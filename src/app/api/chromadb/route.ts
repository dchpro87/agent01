import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import { createOllamaEmbeddingFunction } from "@/lib/ollama-embedding";

let client: ChromaClient | null = null;
const baseUrl = "http://localhost:8000";

async function getClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      path: baseUrl,
    });
  }
  return client;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "connect":
        const chromaClient = await getClient();
        const version = await chromaClient.version();
        return NextResponse.json({
          success: true,
          connected: true,
          version,
          message: "Connected to ChromaDB",
        });

      case "health":
        try {
          const response = await fetch(`${baseUrl}/api/v1/version`);
          if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
              success: true,
              status: "healthy",
              details: data,
            });
          } else {
            // Try v2 API since v1 might be deprecated
            const responseV2 = await fetch(`${baseUrl}/api/v2/version`);
            if (responseV2.ok) {
              const dataV2 = await responseV2.json();
              return NextResponse.json({
                success: true,
                status: "healthy",
                details: dataV2,
              });
            } else {
              return NextResponse.json({
                success: false,
                status: "unhealthy",
                details: `HTTP ${response.status}`,
              });
            }
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            status: "error",
            details: error instanceof Error ? error.message : "Unknown error",
          });
        }

      case "collections":
        const chromaClientForCollections = await getClient();
        const collections = await chromaClientForCollections.listCollections();

        // Extract only the necessary collection information
        const collectionsData = collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          metadata: collection.metadata,
        }));

        return NextResponse.json({
          success: true,
          collections: collectionsData,
        });

      case "get_documents":
        const collectionName = searchParams.get("collection");
        const limitStr = searchParams.get("limit");
        const limit = limitStr ? parseInt(limitStr, 10) : undefined;

        if (!collectionName) {
          return NextResponse.json(
            {
              success: false,
              error: "Collection name is required",
            },
            { status: 400 }
          );
        }

        try {
          const chromaClientForDocs = await getClient();
          const collection = await chromaClientForDocs.getCollection({
            name: collectionName,
          });

          const data = await collection.get({
            limit: limit,
          });

          // Transform the data to match our interface
          const documents = data.ids.map((id, index) => ({
            id,
            document: data.documents?.[index] || undefined,
            metadata: data.metadatas?.[index] || undefined,
            embedding: data.embeddings?.[index] || undefined,
          }));

          return NextResponse.json({
            success: true,
            documents,
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to get documents",
            },
            { status: 500 }
          );
        }

      case "disconnect":
        client = null;
        return NextResponse.json({
          success: true,
          connected: false,
          message: "Disconnected from ChromaDB",
        });

      case "create_collection":
        const newCollectionName = searchParams.get("name");
        const useOllamaEmbedding =
          searchParams.get("ollama_embedding") === "true";

        if (!newCollectionName) {
          return NextResponse.json(
            {
              success: false,
              error: "Collection name is required",
            },
            { status: 400 }
          );
        }

        try {
          const chromaClientForCreate = await getClient();

          const collectionOptions = {
            name: newCollectionName,
            embeddingFunction: useOllamaEmbedding
              ? createOllamaEmbeddingFunction()
              : undefined,
          };

          console.log(
            `Creating collection "${newCollectionName}" with ${
              useOllamaEmbedding ? "Ollama nomic-embed-text" : "default"
            } embedding function`
          );

          const collection = await chromaClientForCreate.createCollection(
            collectionOptions
          );

          return NextResponse.json({
            success: true,
            collection: {
              id: collection.id,
              name: collection.name,
              metadata: collection.metadata,
            },
            message: `Collection "${newCollectionName}" created successfully`,
            embeddingFunction: useOllamaEmbedding
              ? "ollama-nomic-embed"
              : "default",
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to create collection",
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Use: connect, health, collections, get_documents, create_collection, or disconnect",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("ChromaDB API error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      collection,
      query_texts,
      n_results,
      where,
      documents,
      ids,
      metadatas,
    } = body;

    switch (action) {
      case "test":
        if (!client) {
          return NextResponse.json({
            success: false,
            connected: false,
            error: "Not connected to ChromaDB",
          });
        }

        await client.version();
        return NextResponse.json({
          success: true,
          connected: true,
          message: "Connection test successful",
        });

      case "add_documents":
        if (!collection || !documents || !ids) {
          return NextResponse.json(
            {
              success: false,
              error: "Collection name, documents, and ids are required",
            },
            { status: 400 }
          );
        }

        try {
          const chromaClient = await getClient();
          const chromaCollection = await chromaClient.getCollection({
            name: collection,
          });

          // Check if we should generate embeddings using Ollama
          const generateEmbeddings = body.generate_ollama_embeddings === true;
          let embeddings: number[][] | undefined;

          if (generateEmbeddings) {
            console.log(
              `Generating embeddings for ${documents.length} documents using Ollama nomic-embed-text`
            );
            const embeddingFunction = createOllamaEmbeddingFunction();
            embeddings = await embeddingFunction.generate(documents);
            console.log(
              `Generated ${embeddings.length} embeddings with ${embeddings[0]?.length} dimensions each`
            );
          }

          await chromaCollection.add({
            ids,
            documents,
            metadatas,
            embeddings, // Pass the generated embeddings directly
          });

          return NextResponse.json({
            success: true,
            message: `Added ${documents.length} documents to collection "${collection}"`,
            collection,
            addedCount: documents.length,
            embeddingsGenerated: generateEmbeddings,
            embeddingDimensions: embeddings?.[0]?.length,
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to add documents",
            },
            { status: 500 }
          );
        }

      case "query_collection":
        if (!collection || !query_texts) {
          return NextResponse.json(
            {
              success: false,
              error: "Collection name and query texts are required",
            },
            { status: 400 }
          );
        }

        try {
          const chromaClient = await getClient();
          const chromaCollection = await chromaClient.getCollection({
            name: collection,
          });

          // Check if we should generate query embeddings using Ollama
          const generateQueryEmbeddings =
            body.generate_ollama_embeddings === true;
          let queryEmbeddings: number[][] | undefined;

          if (generateQueryEmbeddings) {
            console.log(
              `Generating query embeddings for ${query_texts.length} queries using Ollama nomic-embed-text`
            );
            const embeddingFunction = createOllamaEmbeddingFunction();
            queryEmbeddings = await embeddingFunction.generate(query_texts);
            console.log(
              `Generated ${queryEmbeddings.length} query embeddings with ${queryEmbeddings[0]?.length} dimensions each`
            );
          }

          const queryResults = await chromaCollection.query({
            queryTexts: generateQueryEmbeddings ? undefined : query_texts, // Use queryTexts only if not using embeddings
            queryEmbeddings, // Use generated embeddings if available
            nResults: n_results || 10,
            where: where,
          });

          // Transform the results to match our interface
          const results =
            queryResults.ids[0]?.map((id, index) => ({
              id,
              document: queryResults.documents?.[0]?.[index] || undefined,
              metadata: queryResults.metadatas?.[0]?.[index] || undefined,
              embedding: queryResults.embeddings?.[0]?.[index] || undefined,
              distance: queryResults.distances?.[0]?.[index] || undefined,
            })) || [];

          return NextResponse.json({
            success: true,
            results,
            query: query_texts,
            collection,
            resultsCount: results.length,
            queryEmbeddingsGenerated: generateQueryEmbeddings,
            queryEmbeddingDimensions: queryEmbeddings?.[0]?.length,
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to query collection",
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Use: test, add_documents, or query_collection",
            note: "For add_documents and query_collection, set 'generate_ollama_embeddings: true' to use Ollama nomic-embed-text model",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
