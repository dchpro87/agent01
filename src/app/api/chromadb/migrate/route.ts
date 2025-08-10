import { NextRequest, NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';
import { createOllamaEmbeddingFunction } from '@/lib/ollama-embedding';
import { CHROMADB_BASE_URL } from '@/constraints/chromadb-constraints';

let client: ChromaClient | null = null;

async function getClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({
      path: CHROMADB_BASE_URL,
    });
  }
  return client;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, collectionName } = body;

    switch (action) {
      case 'migrate_collection':
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
          const chromaClient = await getClient();

          // Get the existing collection without embedding function
          const existingCollection = await chromaClient.getCollection({
            name: collectionName,
          });

          // Get all documents from the existing collection
          console.log(
            `Migrating collection "${collectionName}" to use Ollama embedding function...`
          );
          const allData = await existingCollection.get();

          if (allData.ids.length === 0) {
            return NextResponse.json({
              success: false,
              error: `Collection "${collectionName}" is empty, no migration needed`,
            });
          }

          console.log(`Found ${allData.ids.length} documents to migrate`);

          // Create a backup name
          const backupName = `${collectionName}_backup_${Date.now()}`;

          // Rename the existing collection to backup
          // Note: ChromaDB doesn't have a direct rename, so we'll create new and delete old
          console.log(`Creating backup collection "${backupName}"`);

          // Create the backup collection with default embedding (to preserve original data)
          const backupCollection = await chromaClient.createCollection({
            name: backupName,
            metadata: {
              original_name: collectionName,
              backup_created: new Date().toISOString(),
              migration_reason: 'embedding_function_migration',
            },
          });

          // Copy data to backup
          await backupCollection.add({
            ids: allData.ids,
            documents: allData.documents?.filter(
              (doc): doc is string => doc !== null
            ),
            metadatas: allData.metadatas?.filter((meta) => meta !== null),
            embeddings: allData.embeddings,
          });

          console.log(`Backup created successfully`);

          // Delete the original collection
          await chromaClient.deleteCollection({ name: collectionName });
          console.log(`Original collection "${collectionName}" deleted`);

          // Create new collection with Ollama embedding function and proper metadata
          const newCollection = await chromaClient.createCollection({
            name: collectionName,
            embeddingFunction: createOllamaEmbeddingFunction(),
            metadata: {
              created_at: new Date().toISOString(),
              embedding_function: 'ollama-nomic-embed',
              embedding_model: 'nomic-embed-text',
              migrated_from_backup: backupName,
              migration_date: new Date().toISOString(),
            },
          });

          console.log(
            `New collection "${collectionName}" created with Ollama embedding function`
          );

          // Add documents to the new collection (embeddings will be regenerated with Ollama)
          console.log(
            `Adding ${allData.ids.length} documents to new collection...`
          );
          await newCollection.add({
            ids: allData.ids,
            documents: allData.documents?.filter(
              (doc): doc is string => doc !== null
            ),
            metadatas: allData.metadatas?.filter((meta) => meta !== null),
            // Don't include embeddings - let Ollama generate new ones
          });

          console.log(`Migration completed successfully`);

          return NextResponse.json({
            success: true,
            message: `Collection "${collectionName}" migrated successfully`,
            details: {
              originalCollection: collectionName,
              backupCollection: backupName,
              documentsCount: allData.ids.length,
              embeddingFunction: 'ollama-nomic-embed',
            },
          });
        } catch (error) {
          console.error(
            `Migration failed for collection "${collectionName}":`,
            error
          );
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error ? error.message : 'Migration failed',
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: migrate_collection',
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
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
