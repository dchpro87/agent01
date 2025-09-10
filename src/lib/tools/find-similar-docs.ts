import { z } from "zod";
import { tool } from "ai";
import { ChromaClient } from "chromadb";
import { createOllamaEmbeddingFunction } from "@/lib/ollama-embedding";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { aiConfig } from "@/lib/ai-config";
import {
  CHROMADB_BASE_URL,
  CHROMADB_DEFAULTS,
} from "@/constraints/chromadb-constraints";

// Define interfaces for better type safety
interface SearchDocument {
  id: string;
  document: string;
  metadata: Record<string, unknown>;
  distance: number;
}

interface CollectionData {
  ids: string[];
  documents?: (string | null)[];
  metadatas?: (Record<string, unknown> | null)[];
}

// Helper function for direct search fallback
async function performDirectSearch({
  collection,
  query,
  resultsCount,
  includeMetadata,
  collectionName,
  collectionData,
  fallbackReason,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: any; // Using any due to complex ChromaDB Collection type incompatibilities
  query: string;
  resultsCount: number;
  includeMetadata: boolean;
  collectionName: string;
  collectionData: CollectionData;
  fallbackReason: string;
}) {
  try {
    console.log(`🔄 Performing direct search with fallback query: ${query}`);

    const queryResults = await collection.query({
      queryTexts: [query],
      nResults: resultsCount || CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE,
    });

    // Transform the results to match our interface
    const searchResults: SearchDocument[] =
      queryResults.ids[0]?.map((id: string, index: number) => ({
        id,
        document: queryResults.documents?.[0]?.[index] || "",
        metadata: queryResults.metadatas?.[0]?.[index] || {},
        distance: queryResults.distances?.[0]?.[index] || 0,
      })) || [];

    console.log(
      `📄 Found ${searchResults.length} similar documents (fallback)`
    );

    // Format the results for better presentation
    interface FormattedResult {
      rank: number;
      id: string;
      content: string;
      contentPreview: string;
      distance: number;
      metadata?: Record<string, unknown>;
    }

    const formattedResults: FormattedResult[] = searchResults.map(
      (doc: SearchDocument, index: number) => {
        const result: FormattedResult = {
          rank: index + 1,
          id: doc.id,
          content: doc.document || "No content available",
          contentPreview:
            doc.document && doc.document.length > 200
              ? doc.document.substring(0, 200) + "..."
              : doc.document || "No content available",
          distance: doc.distance || 0,
        };

        if (includeMetadata && doc.metadata) {
          result.metadata = doc.metadata;
        }

        return result;
      }
    );

    // Calculate some basic statistics
    const totalContentLength = formattedResults.reduce(
      (sum, doc) => sum + (doc.content?.length || 0),
      0
    );

    const resultSummary = {
      query: {
        original: query, // Using original query since AI enhancement failed
        optimized: null, // No AI optimization was performed
        fallback: true,
        fallbackReason,
      },
      collection: {
        name: collectionName,
        totalDocuments: collectionData.ids.length,
      },
      search: {
        resultsFound: searchResults.length,
        resultsRequested: resultsCount,
        totalContentLength,
        timestamp: new Date().toISOString(),
        searchMethod: "direct_fallback",
      },
      results: formattedResults,
      warnings: [
        "AI query enhancement failed - used direct search with original query",
        fallbackReason,
      ],
      success: true,
    };

    console.log("✅ find_similar_docs completed successfully (with fallback)");
    return resultSummary;
  } catch (fallbackError) {
    const errorMessage =
      fallbackError instanceof Error
        ? fallbackError.message
        : String(fallbackError);
    console.error("❌ Fallback search also failed:", errorMessage);

    return {
      error: "Complete Search Failure",
      details: `Both AI-enhanced and direct search failed. Original error: ${fallbackReason}. Fallback error: ${errorMessage}`,
      instructions:
        "All search methods have failed. This indicates a serious issue with the knowledge base or embedding services.",
      errorType: "COMPLETE_FAILURE",
      suggestions: [
        "Check if ChromaDB service is properly running",
        "Verify the collection integrity and documents",
        "Restart all related services (ChromaDB, Ollama)",
        "Check system resources and network connectivity",
        "Consider recreating the collection from source documents",
      ],
      success: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/** Tool to find similar documents from ChromaDB collections using AI-generated search queries */
export const find_similar_docs = tool({
  description:
    "Local knowledge base. Find similar documents from a ChromaDB collection by analyzing the user's message and generating an optimized search query. This tool takes the user's message, uses the currently selected AI model to understand the intent and generate an appropriate search query, then searches the specified collection for the most relevant documents.",
  parameters: z.object({
    userMessage: z
      .string()
      .min(1)
      .describe(
        "The user's message or question to be used to find relevant documents"
      ),
    collectionName: z
      .string()
      .min(1)
      .describe("The name of the ChromaDB collection to search in"),
    resultsCount: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe("Number of similar documents to return (1-20, default: 5)"),
    includeMetadata: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to include document metadata in the results"),
  }),
  execute: async ({
    userMessage,
    collectionName,
    resultsCount = 5,
    includeMetadata = false,
  }) => {
    console.log("🔧 find_similar_docs tool called with:", {
      userMessage: userMessage.substring(0, 100) + "...",
      collectionName,
      resultsCount,
      includeMetadata,
    });

    try {
      // Create a direct ChromaDB client connection
      let client: ChromaClient;
      try {
        client = new ChromaClient({
          path: CHROMADB_BASE_URL,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ ChromaDB client creation failed:", errorMessage);
        return {
          error: "ChromaDB Connection Failed",
          details: `Unable to connect to ChromaDB server at ${CHROMADB_BASE_URL}. ${errorMessage}`,
          instructions:
            "Ensure ChromaDB server is running on the expected port. You can check this by using the health check API or trying to list collections first.",
          errorType: "CONNECTION_ERROR",
          suggestions: [
            "Verify ChromaDB server is running",
            "Check if the ChromaDB URL is correct",
            "Try using the list_collections tool to test connectivity",
          ],
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Verify the collection exists and determine embedding function
      let collections;
      try {
        collections = await client.listCollections();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Failed to list collections:", errorMessage);
        return {
          error: "ChromaDB Access Failed",
          details: `Unable to retrieve collections from ChromaDB. ${errorMessage}`,
          instructions:
            "ChromaDB server may be unreachable or experiencing issues. Try checking the server status or restart the ChromaDB service.",
          errorType: "ACCESS_ERROR",
          suggestions: [
            "Check ChromaDB server logs for errors",
            "Verify network connectivity to ChromaDB",
            "Consider restarting the ChromaDB service",
          ],
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      const targetCollection = collections.find(
        (col) => col.name === collectionName
      );

      if (!targetCollection) {
        const availableCollections = collections.map((col) => col.name);
        return {
          error: "Collection Not Found",
          details: `Collection "${collectionName}" does not exist in the knowledge base.`,
          instructions:
            availableCollections.length > 0
              ? `Available collections are: ${availableCollections.join(
                  ", "
                )}. Please specify one of these collection names or create the collection first if it should exist.`
              : "No collections exist in the knowledge base. You may need to upload documents first to create collections.",
          errorType: "COLLECTION_NOT_FOUND",
          availableCollections,
          suggestions:
            availableCollections.length > 0
              ? [
                  "Use one of the existing collection names",
                  "Check if the collection name was spelled correctly",
                  "Use the list_collections tool to see all available collections",
                ]
              : [
                  "Upload documents to create collections",
                  "Check if any documents have been processed",
                  "Verify the document processing pipeline is working",
                ],
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Always use Ollama embedding function since it's the default for this application
      let embeddingFunction;
      try {
        embeddingFunction = createOllamaEmbeddingFunction();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Failed to create embedding function:", errorMessage);
        return {
          error: "Embedding Function Creation Failed",
          details: `Unable to create Ollama embedding function. ${errorMessage}`,
          instructions:
            "The Ollama embedding service may not be available or properly configured. Ensure Ollama is running and the nomic-embed-text model is available.",
          errorType: "EMBEDDING_ERROR",
          suggestions: [
            "Check if Ollama service is running",
            "Verify nomic-embed-text model is installed in Ollama",
            "Check Ollama embedding configuration",
            "Try pulling the embedding model: 'ollama pull nomic-embed-text'",
          ],
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      console.log(
        `Collection "${collectionName}" using Ollama nomic-embed-text embedding function`
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let collection: any; // Using any due to complex ChromaDB Collection type incompatibilities
      try {
        collection = await client.getCollection({
          name: collectionName,
          embeddingFunction: embeddingFunction,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Failed to get collection:", errorMessage);
        return {
          error: "Collection Access Failed",
          details: `Unable to access collection "${collectionName}". ${errorMessage}`,
          instructions:
            "The collection exists but cannot be accessed. This might be due to embedding function mismatch or collection corruption.",
          errorType: "COLLECTION_ACCESS_ERROR",
          suggestions: [
            "Verify the collection was created with compatible embedding function",
            "Check collection integrity",
            "Try recreating the collection if it appears corrupted",
            "Ensure embedding function matches collection requirements",
          ],
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Check if collection has documents
      let collectionData: CollectionData;
      try {
        collectionData = await collection.get({ limit: 1 });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Failed to retrieve collection data:", errorMessage);
        return {
          error: "Collection Data Retrieval Failed",
          details: `Unable to retrieve data from collection "${collectionName}". ${errorMessage}`,
          instructions:
            "The collection might be corrupted or have permission issues. Try checking collection status or recreating it.",
          errorType: "DATA_RETRIEVAL_ERROR",
          suggestions: [
            "Check collection permissions",
            "Verify collection integrity",
            "Try recreating the collection from source documents",
            "Check ChromaDB server logs for detailed errors",
          ],
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      if (!collectionData.ids || collectionData.ids.length === 0) {
        return {
          error: "Empty Collection",
          details: `Collection "${collectionName}" exists but contains no documents.`,
          instructions:
            "The collection is empty. You need to add documents to this collection before you can search it. Upload and process documents to populate the collection.",
          errorType: "EMPTY_COLLECTION",
          suggestions: [
            "Upload documents to populate the collection",
            "Check if document processing completed successfully",
            "Verify documents were correctly chunked and embedded",
            "Use document upload tools to add content to this collection",
          ],
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Use the current AI model to generate an optimized search query
      let openai;
      try {
        openai = createOpenAI({
          baseURL: aiConfig.ollama.baseURL + "/v1",
          apiKey: "ollama",
          compatibility: "compatible",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Failed to create OpenAI client:", errorMessage);
        return {
          error: "AI Client Creation Failed",
          details: `Unable to create AI client for query generation. ${errorMessage}`,
          instructions:
            "The AI service (Ollama) may not be available. Falling back to direct search with user query would be recommended.",
          errorType: "AI_CLIENT_ERROR",
          suggestions: [
            "Check if Ollama service is running",
            "Verify Ollama API endpoint is accessible",
            "Try using the original user query directly for search",
            "Consider using a simpler search approach without AI query enhancement",
          ],
          fallbackAction: {
            description: "Use original user query for direct search",
            query: userMessage,
          },
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      console.log(
        `🤖 Generating optimized search query using AI model: ${aiConfig.ollama.model}`
      );

      let queryGenerationResult;
      try {
        queryGenerationResult = await generateText({
          // model: openai(aiConfig.ollama.model),
          model: openai("gemma3:4b"),
          messages: [
            {
              role: "system",
              content: `You are a search query optimization expert. Your task is to analyze the user's message and generate the most effective search query to find relevant documents in a knowledge base.

Instructions:
1. Extract the key concepts, entities, and topics from the user's message
2. Generate a concise, focused search query that will find the most relevant documents
3. Use synonyms and related terms to improve search coverage
4. Keep the query under 100 words
5. Focus on the main intent and information need
6. Return ONLY the optimized search query, nothing else

Examples:
- User: "How do I reset my password?" → Query: "password reset change login authentication account recovery"
- User: "What are the benefits of solar energy?" → Query: "solar energy benefits advantages renewable clean power environmental cost savings"
- User: "I need help with React component testing" → Query: "React component testing unit tests jest enzyme testing library"`,
            },
            {
              role: "user",
              content: `Generate an optimized search query for this user message: "${userMessage}"`,
            },
          ],
          temperature: 0.3, // Lower temperature for more focused results
          maxTokens: 100,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Query generation failed:", errorMessage);

        // Fallback to using the original user message as query
        console.log("🔄 Falling back to original user message as search query");

        return await performDirectSearch({
          collection,
          query: userMessage,
          resultsCount,
          includeMetadata,
          collectionName,
          collectionData,
          fallbackReason: `AI query generation failed: ${errorMessage}`,
        });
      }

      const optimizedQuery = queryGenerationResult.text.trim();
      console.log(`🔍 Generated search query: ${optimizedQuery}`);

      // Search the ChromaDB collection using the optimized query
      let queryResults;
      try {
        queryResults = await collection.query({
          queryTexts: [optimizedQuery],
          nResults: resultsCount || CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Collection query failed:", errorMessage);
        return {
          error: "Search Query Failed",
          details: `Unable to search collection "${collectionName}" with query "${optimizedQuery}". ${errorMessage}`,
          instructions:
            "The search operation failed, possibly due to embedding issues or collection problems. Consider using a simpler query or checking the collection integrity.",
          errorType: "QUERY_ERROR",
          originalQuery: userMessage,
          optimizedQuery: optimizedQuery,
          suggestions: [
            "Try with a simpler search query",
            "Check if embedding service is working correctly",
            "Verify collection contains properly embedded documents",
            "Consider rebuilding the collection if issues persist",
          ],
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Transform the results to match our interface
      const searchResults: SearchDocument[] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryResults.ids[0]?.map((id: any, index: any) => ({
          id,
          document: queryResults.documents?.[0]?.[index] || "",
          metadata: queryResults.metadatas?.[0]?.[index] || {},
          distance: queryResults.distances?.[0]?.[index] || 0,
        })) || [];

      console.log(`📄 Found ${searchResults.length} similar documents`);

      // Format the results for better presentation
      interface FormattedResult {
        rank: number;
        id: string;
        content: string;
        contentPreview: string;
        distance: number;
        metadata?: Record<string, unknown>;
      }

      const formattedResults: FormattedResult[] = searchResults.map(
        (doc, index) => {
          const result: FormattedResult = {
            rank: index + 1,
            id: doc.id,
            content: doc.document || "No content available",
            contentPreview:
              doc.document && doc.document.length > 200
                ? doc.document.substring(0, 200) + "..."
                : doc.document || "No content available",
            distance: doc.distance || 0,
          };

          if (includeMetadata && doc.metadata) {
            result.metadata = doc.metadata;
          }

          return result;
        }
      );

      // Calculate some basic statistics
      const totalContentLength = formattedResults.reduce(
        (sum, doc) => sum + (doc.content?.length || 0),
        0
      );

      const resultSummary = {
        query: {
          original: userMessage,
          optimized: optimizedQuery,
        },
        collection: {
          name: collectionName,
          totalDocuments: collectionData.ids.length,
        },
        search: {
          resultsFound: searchResults.length,
          resultsRequested: resultsCount,
          totalContentLength,
          timestamp: new Date().toISOString(),
        },
        results: formattedResults,
        success: true,
      };

      console.log("✅ find_similar_docs completed successfully");
      return resultSummary;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      console.error("❌ find_similar_docs unexpected error:", errorMessage);

      // Analyze error type for better instructions
      let errorType = "UNKNOWN_ERROR";
      let instructions =
        "An unexpected error occurred during the search operation.";
      let suggestions = [
        "Try the search again",
        "Check system logs for more details",
      ];

      if (
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("connection refused")
      ) {
        errorType = "CONNECTION_REFUSED";
        instructions =
          "Cannot connect to the required service. ChromaDB or Ollama service may be down.";
        suggestions = [
          "Check if ChromaDB server is running",
          "Verify Ollama service is active",
          "Check network connectivity",
          "Restart the required services",
        ];
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("ETIMEDOUT")
      ) {
        errorType = "TIMEOUT_ERROR";
        instructions =
          "The operation timed out. Services may be overloaded or unresponsive.";
        suggestions = [
          "Try again with a simpler query",
          "Check if services are responding slowly",
          "Consider reducing the number of results requested",
          "Wait a moment and retry the operation",
        ];
      } else if (
        errorMessage.includes("authentication") ||
        errorMessage.includes("unauthorized")
      ) {
        errorType = "AUTH_ERROR";
        instructions =
          "Authentication failed. Check API keys and service configuration.";
        suggestions = [
          "Verify API keys are correctly configured",
          "Check service authentication settings",
          "Ensure all required credentials are available",
        ];
      } else if (
        errorMessage.includes("model") ||
        errorMessage.includes("embedding")
      ) {
        errorType = "MODEL_ERROR";
        instructions =
          "AI model or embedding service error. The required models may not be available.";
        suggestions = [
          "Check if the required AI model is loaded in Ollama",
          "Verify embedding model (nomic-embed-text) is available",
          "Try pulling the required models: 'ollama pull gemma3:4b' and 'ollama pull nomic-embed-text'",
          "Restart Ollama service",
        ];
      }

      return {
        error: "Unexpected Error",
        details: errorMessage,
        instructions,
        errorType,
        suggestions,
        context: {
          userMessage:
            userMessage.substring(0, 200) +
            (userMessage.length > 200 ? "..." : ""),
          collectionName,
          resultsCount,
          includeMetadata,
        },
        debugInfo: stackTrace ? { stackTrace } : undefined,
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  },
});
