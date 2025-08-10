import { z } from 'zod';
import { tool } from 'ai';
import { ChromaClient } from 'chromadb';
import { createOllamaEmbeddingFunction } from '@/lib/ollama-embedding';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { aiConfig } from '@/lib/ai-config';
import {
  CHROMADB_BASE_URL,
  CHROMADB_DEFAULTS,
} from '@/constraints/chromadb-constraints';

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
      .describe('The name of the ChromaDB collection to search in'),
    resultsCount: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe('Number of similar documents to return (1-20, default: 5)'),
    includeMetadata: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to include document metadata in the results'),
  }),
  execute: async ({
    userMessage,
    collectionName,
    resultsCount = 5,
    includeMetadata = true,
  }) => {
    console.log('🔧 find_similar_docs tool called with:', {
      userMessage: userMessage.substring(0, 100) + '...',
      collectionName,
      resultsCount,
      includeMetadata,
    });

    try {
      // Create a direct ChromaDB client connection
      const client = new ChromaClient({
        path: CHROMADB_BASE_URL,
      });

      // Verify the collection exists and determine embedding function
      const collections = await client.listCollections();
      const targetCollection = collections.find(
        (col) => col.name === collectionName
      );

      if (!targetCollection) {
        const availableCollections = collections.map((col) => col.name);
        return {
          error: 'Collection not found',
          details: `Collection "${collectionName}" does not exist. Available collections: ${availableCollections.join(
            ', '
          )}`,
          availableCollections,
          success: false,
        };
      }

      // Determine embedding function from collection metadata
      const embeddingFunction =
        targetCollection.metadata?.embedding_function === 'ollama-nomic-embed'
          ? createOllamaEmbeddingFunction()
          : undefined;

      console.log(
        `Collection "${collectionName}" uses ${
          embeddingFunction ? 'Ollama nomic-embed-text' : 'default'
        } embedding function`
      );

      const collection = await client.getCollection({
        name: collectionName,
        embeddingFunction: embeddingFunction,
      });

      // Check if collection has documents
      const collectionData = await collection.get({ limit: 1 });
      if (!collectionData.ids || collectionData.ids.length === 0) {
        return {
          error: 'Empty collection',
          details: `Collection "${collectionName}" exists but contains no documents`,
          success: false,
        };
      }

      // Use the current AI model to generate an optimized search query
      const openai = createOpenAI({
        baseURL: aiConfig.ollama.baseURL + '/v1',
        apiKey: 'ollama',
        compatibility: 'compatible',
      });

      console.log(
        `🤖 Generating optimized search query using AI model: ${aiConfig.ollama.model}`
      );

      const queryGenerationResult = await generateText({
        // model: openai(aiConfig.ollama.model),
        model: openai('gemma3:4b'),
        messages: [
          {
            role: 'system',
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
            role: 'user',
            content: `Generate an optimized search query for this user message: "${userMessage}"`,
          },
        ],
        temperature: 0.3, // Lower temperature for more focused results
        maxTokens: 100,
      });

      const optimizedQuery = queryGenerationResult.text.trim();
      console.log(`🔍 Generated search query: ${optimizedQuery}`);

      // Search the ChromaDB collection using the optimized query
      const queryResults = await collection.query({
        queryTexts: [optimizedQuery],
        nResults: resultsCount || CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE,
      });

      // Transform the results to match our interface
      const searchResults =
        queryResults.ids[0]?.map((id, index) => ({
          id,
          document: queryResults.documents?.[0]?.[index] || '',
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
            content: doc.document || 'No content available',
            contentPreview:
              doc.document && doc.document.length > 200
                ? doc.document.substring(0, 200) + '...'
                : doc.document || 'No content available',
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

      console.log('✅ find_similar_docs completed successfully');
      return resultSummary;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('❌ find_similar_docs error:', errorMessage);

      return {
        error: 'Search failed',
        details: errorMessage,
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  },
});
