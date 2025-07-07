import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import { createOllamaEmbeddingFunction } from "@/lib/ollama-embedding";
import {
  CHROMADB_BASE_URL,
  CHROMADB_API_ENDPOINTS,
  CHROMADB_DEFAULTS,
  CHROMADB_ACTIONS,
} from "@/constants/chromadb-constants";

let client: ChromaClient | null = null;

async function getClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      path: CHROMADB_BASE_URL,
    });
  }
  return client;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case CHROMADB_ACTIONS.CONNECT:
        const chromaClient = await getClient();
        const version = await chromaClient.version();
        return NextResponse.json({
          success: true,
          connected: true,
          version,
          message: "Connected to ChromaDB",
        });

      case CHROMADB_ACTIONS.HEALTH:
        try {
          const response = await fetch(
            `${CHROMADB_BASE_URL}${CHROMADB_API_ENDPOINTS.VERSION_V1}`
          );
          if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
              success: true,
              status: "healthy",
              details: data,
            });
          } else {
            // Try v2 API since v1 might be deprecated
            const responseV2 = await fetch(
              `${CHROMADB_BASE_URL}${CHROMADB_API_ENDPOINTS.VERSION_V2}`
            );
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

      case CHROMADB_ACTIONS.COLLECTIONS:
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

      case CHROMADB_ACTIONS.GET_DOCUMENTS:
        const collectionName = searchParams.get("collection");
        const limitStr = searchParams.get("limit");
        const offsetStr = searchParams.get("offset");
        const limit = limitStr ? parseInt(limitStr, 10) : undefined;
        const offset = offsetStr ? parseInt(offsetStr, 10) : undefined;

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

          // Get total count first
          const totalData = await collection.get();
          const totalCount = totalData.ids.length;

          // Get paginated data
          const data = await collection.get({
            limit: limit,
            offset: offset,
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
            totalCount,
            limit: limit || totalCount,
            offset: offset || 0,
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

      case CHROMADB_ACTIONS.DISCONNECT:
        client = null;
        return NextResponse.json({
          success: true,
          connected: false,
          message: "Disconnected from ChromaDB",
        });

      case CHROMADB_ACTIONS.CREATE_COLLECTION:
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

      case CHROMADB_ACTIONS.DELETE_COLLECTION:
        const deleteCollectionName = searchParams.get("name");

        if (!deleteCollectionName) {
          return NextResponse.json(
            {
              success: false,
              error: "Collection name is required",
            },
            { status: 400 }
          );
        }

        try {
          const chromaClientForDelete = await getClient();

          console.log(`Deleting collection "${deleteCollectionName}"`);

          await chromaClientForDelete.deleteCollection({
            name: deleteCollectionName,
          });

          return NextResponse.json({
            success: true,
            message: `Collection "${deleteCollectionName}" deleted successfully`,
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to delete collection",
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action. Use: ${Object.values(CHROMADB_ACTIONS)
              .slice(0, 8)
              .join(", ")}`,
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
      case CHROMADB_ACTIONS.TEST:
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

      case CHROMADB_ACTIONS.ADD_DOCUMENTS:
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

      case CHROMADB_ACTIONS.DELETE_DOCUMENTS:
        if (!collection || !ids) {
          return NextResponse.json(
            {
              success: false,
              error: "Collection name and document ids are required",
            },
            { status: 400 }
          );
        }

        try {
          const chromaClient = await getClient();
          const chromaCollection = await chromaClient.getCollection({
            name: collection,
          });

          await chromaCollection.delete({
            ids,
          });

          return NextResponse.json({
            success: true,
            message: `Deleted ${ids.length} documents from collection "${collection}"`,
            collection,
            deletedCount: ids.length,
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to delete documents",
            },
            { status: 500 }
          );
        }

      case CHROMADB_ACTIONS.QUERY_COLLECTION:
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
            nResults: n_results || CHROMADB_DEFAULTS.QUERY_RESULTS_LIMIT,
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
            error: `Invalid action. Use: ${Object.values(CHROMADB_ACTIONS)
              .slice(7)
              .join(", ")}`,
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
