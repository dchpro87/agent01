import { NextRequest, NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';
import { createOllamaEmbeddingFunction } from '@/lib/ollama-embedding';
import {
  CHROMADB_BASE_URL,
  CHROMADB_API_ENDPOINTS,
  CHROMADB_DEFAULTS,
  CHROMADB_ACTIONS,
} from '@/constraints/chromadb-constraints';

let client: ChromaClient | null = null;

// Helper function to determine embedding function from collection metadata
async function getCollectionEmbeddingFunction(
  client: ChromaClient,
  collectionName: string
): Promise<ReturnType<typeof createOllamaEmbeddingFunction> | undefined> {
  try {
    // Get collection information to check metadata
    const collections = await client.listCollections();
    const targetCollection = collections.find(
      (col) => col.name === collectionName
    );

    if (!targetCollection?.metadata) {
      console.log(
        `No metadata found for collection "${collectionName}". This might be a legacy collection created before embedding function metadata was stored.`
      );

      // For collections without metadata, assume they need Ollama embedding
      // This handles legacy collections created before our metadata fix
      console.log(
        `Assuming collection "${collectionName}" uses Ollama embedding function (legacy collection fallback)`
      );
      return createOllamaEmbeddingFunction();
    }

    const embeddingFunction = targetCollection.metadata.embedding_function;
    console.log(
      `Collection "${collectionName}" metadata:`,
      targetCollection.metadata
    );

    // Return Ollama embedding function if the collection was created with it
    if (embeddingFunction === 'ollama-nomic-embed') {
      console.log(
        `Using Ollama embedding function for collection "${collectionName}"`
      );
      return createOllamaEmbeddingFunction();
    }

    console.log(
      `Using default embedding function for collection "${collectionName}"`
    );
    return undefined;
  } catch (error) {
    console.warn(
      `Failed to determine embedding function for collection "${collectionName}":`,
      error
    );
    return undefined;
  }
}

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
  const action = searchParams.get('action');

  try {
    switch (action) {
      case CHROMADB_ACTIONS.CONNECT:
        const chromaClient = await getClient();
        const version = await chromaClient.version();
        return NextResponse.json({
          success: true,
          connected: true,
          version,
          message: 'Connected to ChromaDB',
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
              status: 'healthy',
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
                status: 'healthy',
                details: dataV2,
              });
            } else {
              return NextResponse.json({
                success: false,
                status: 'unhealthy',
                details: `HTTP ${response.status}`,
              });
            }
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            status: 'error',
            details: error instanceof Error ? error.message : 'Unknown error',
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
        const collectionName = searchParams.get('collection');
        const limitStr = searchParams.get('limit');
        const offsetStr = searchParams.get('offset');
        const limit = limitStr ? parseInt(limitStr, 10) : undefined;
        const offset = offsetStr ? parseInt(offsetStr, 10) : undefined;

        if (!collectionName) {
          return NextResponse.json(
            {
              success: false,
              error: 'Collection name is required',
            },
            { status: 400 }
          );
        }

        try {
          const chromaClientForDocs = await getClient();

          // Determine the correct embedding function from collection metadata
          const embeddingFunction = await getCollectionEmbeddingFunction(
            chromaClientForDocs,
            collectionName
          );

          console.log(
            `Getting documents from collection "${collectionName}" with ${
              embeddingFunction ? 'Ollama nomic-embed-text' : 'default'
            } embedding function`
          );

          // Get collection with the appropriate embedding function
          const collection = await chromaClientForDocs.getCollection({
            name: collectionName,
            embeddingFunction: embeddingFunction,
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
            embeddingFunction: embeddingFunction
              ? 'ollama-nomic-embed'
              : 'default',
          });
        } catch (error) {
          console.error(
            `Failed to get documents from collection "${collectionName}":`,
            error
          );
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to get documents',
            },
            { status: 500 }
          );
        }

      case CHROMADB_ACTIONS.DISCONNECT:
        client = null;
        return NextResponse.json({
          success: true,
          connected: false,
          message: 'Disconnected from ChromaDB',
        });

      case CHROMADB_ACTIONS.CREATE_COLLECTION:
        const newCollectionName = searchParams.get('name');
        const useOllamaEmbedding =
          searchParams.get('ollama_embedding') === 'true';

        if (!newCollectionName) {
          return NextResponse.json(
            {
              success: false,
              error: 'Collection name is required',
            },
            { status: 400 }
          );
        }

        try {
          const chromaClientForCreate = await getClient();

          // Store embedding function information in collection metadata
          const collectionMetadata = {
            created_at: new Date().toISOString(),
            embedding_function: useOllamaEmbedding
              ? 'ollama-nomic-embed'
              : 'default',
            embedding_model: useOllamaEmbedding
              ? 'nomic-embed-text'
              : 'default',
          };

          const collectionOptions = {
            name: newCollectionName,
            metadata: collectionMetadata,
            embeddingFunction: useOllamaEmbedding
              ? createOllamaEmbeddingFunction()
              : undefined,
          };

          console.log(
            `Creating collection "${newCollectionName}" with ${
              useOllamaEmbedding ? 'Ollama nomic-embed-text' : 'default'
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
              ? 'ollama-nomic-embed'
              : 'default',
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to create collection',
            },
            { status: 500 }
          );
        }

      case CHROMADB_ACTIONS.DELETE_COLLECTION:
        const deleteCollectionName = searchParams.get('name');

        if (!deleteCollectionName) {
          return NextResponse.json(
            {
              success: false,
              error: 'Collection name is required',
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
                  : 'Failed to delete collection',
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
              .join(', ')}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('ChromaDB API error:', errorMessage);

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
            error: 'Not connected to ChromaDB',
          });
        }

        await client.version();
        return NextResponse.json({
          success: true,
          connected: true,
          message: 'Connection test successful',
        });

      case CHROMADB_ACTIONS.ADD_DOCUMENTS:
        if (!collection || !documents || !ids) {
          return NextResponse.json(
            {
              success: false,
              error: 'Collection name, documents, and ids are required',
            },
            { status: 400 }
          );
        }

        try {
          const chromaClient = await getClient();

          // Determine the correct embedding function from collection metadata
          const embeddingFunction = await getCollectionEmbeddingFunction(
            chromaClient,
            collection
          );

          console.log(
            `Adding ${
              documents.length
            } documents to collection "${collection}" with ${
              embeddingFunction ? 'Ollama nomic-embed-text' : 'default'
            } embedding function`
          );

          if (embeddingFunction) {
            const config = embeddingFunction.getConfig();
            console.log(`ADD_DOCUMENTS Embedding Config:`, config);
          }

          const chromaCollection = await chromaClient.getCollection({
            name: collection,
            embeddingFunction: embeddingFunction,
          });

          // Let ChromaDB handle embedding generation automatically
          await chromaCollection.add({
            ids,
            documents,
            metadatas,
            // Don't pass embeddings - let the collection's embedding function handle it
          });

          return NextResponse.json({
            success: true,
            message: `Added ${documents.length} documents to collection "${collection}"`,
            collection,
            addedCount: documents.length,
            embeddingFunction: embeddingFunction
              ? 'ollama-nomic-embed'
              : 'default',
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to add documents',
            },
            { status: 500 }
          );
        }

      case CHROMADB_ACTIONS.DELETE_DOCUMENTS:
        if (!collection || !ids) {
          return NextResponse.json(
            {
              success: false,
              error: 'Collection name and document ids are required',
            },
            { status: 400 }
          );
        }

        try {
          const chromaClient = await getClient();

          // Determine the correct embedding function from collection metadata
          const embeddingFunction = await getCollectionEmbeddingFunction(
            chromaClient,
            collection
          );

          console.log(
            `Deleting ${
              ids.length
            } documents from collection "${collection}" with ${
              embeddingFunction ? 'Ollama nomic-embed-text' : 'default'
            } embedding function`
          );

          if (embeddingFunction) {
            const config = embeddingFunction.getConfig();
            console.log(`DELETE_DOCUMENTS Embedding Config:`, config);
          }

          const chromaCollection = await chromaClient.getCollection({
            name: collection,
            embeddingFunction: embeddingFunction,
          });

          await chromaCollection.delete({
            ids,
          });

          return NextResponse.json({
            success: true,
            message: `Deleted ${ids.length} documents from collection "${collection}"`,
            collection,
            deletedCount: ids.length,
            embeddingFunction: embeddingFunction
              ? 'ollama-nomic-embed'
              : 'default',
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to delete documents',
            },
            { status: 500 }
          );
        }

      case CHROMADB_ACTIONS.QUERY_COLLECTION:
        if (!collection || !query_texts || !Array.isArray(query_texts)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Collection name and query texts (array) are required',
            },
            { status: 400 }
          );
        }

        try {
          const chromaClient = await getClient();

          // Determine the correct embedding function from collection metadata
          const embeddingFunction = await getCollectionEmbeddingFunction(
            chromaClient,
            collection
          );

          console.log(
            `Querying collection "${collection}" with ${
              query_texts.length
            } queries using ${
              embeddingFunction ? 'Ollama nomic-embed-text' : 'default'
            } embedding function`
          );

          if (embeddingFunction) {
            const config = embeddingFunction.getConfig();
            console.log(`QUERY_COLLECTION Embedding Config:`, config);
          }

          const chromaCollection = await chromaClient.getCollection({
            name: collection,
            embeddingFunction: embeddingFunction,
          });

          // Let ChromaDB handle embedding generation automatically using queryTexts
          const queryResults = await chromaCollection.query({
            queryTexts: query_texts,
            nResults: n_results || CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE,
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
            embeddingFunction: embeddingFunction
              ? 'ollama-nomic-embed'
              : 'default',
          });
        } catch (error) {
          console.error('ChromaDB query error:', error);

          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          // Provide more specific error messages for common issues
          let specificError = errorMessage;
          if (
            errorMessage.includes('Collection') &&
            errorMessage.includes('does not exist')
          ) {
            specificError = `Collection "${collection}" does not exist`;
          } else if (errorMessage.includes('embedding')) {
            specificError = `Embedding function mismatch or error: ${errorMessage}`;
          } else if (errorMessage.includes('dimension')) {
            specificError = `Embedding dimension mismatch: ${errorMessage}`;
          }

          return NextResponse.json(
            {
              success: false,
              error: specificError,
              collection,
              originalError: errorMessage,
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
              .join(', ')}`,
            note: 'Collections automatically use the correct embedding function based on their metadata',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
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
