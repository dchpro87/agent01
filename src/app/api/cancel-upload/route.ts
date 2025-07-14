import { NextRequest, NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';
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
    const { collectionName, fileName } = await request.json();

    if (!collectionName) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    console.log(
      `Performing cleanup for collection: ${collectionName}, file: ${fileName}`
    );

    const chromaClient = await getClient();

    // Check if collection exists
    let collection;
    try {
      collection = await chromaClient.getCollection({ name: collectionName });
    } catch (collectionError) {
      console.log(`Collection ${collectionName} not found:`, collectionError);
      return NextResponse.json({
        message: 'Collection not found, no cleanup needed',
        cleaned: false,
      });
    }

    if (fileName) {
      try {
        // Get all documents in the collection
        const results = await collection.get();

        if (!results.ids || results.ids.length === 0) {
          return NextResponse.json({
            message: 'Collection is empty, no cleanup needed',
            cleaned: false,
          });
        }

        // Look for documents that might be from the cancelled upload
        // Filter based on metadata containing the filename
        const documentsToDelete: string[] = [];

        if (results.metadatas) {
          results.ids.forEach((id, index) => {
            const metadata = results.metadatas?.[index];
            if (metadata && typeof metadata === 'object') {
              // Check if metadata contains the filename
              const hasFilename =
                (metadata.source_file &&
                  typeof metadata.source_file === 'string' &&
                  metadata.source_file === fileName) ||
                (metadata.filename &&
                  typeof metadata.filename === 'string' &&
                  metadata.filename === fileName);

              // Also check for recent timestamp (within last 10 minutes for safety)
              const now = Date.now();
              const tenMinutesAgo = now - 10 * 60 * 1000;
              const hasRecentTimestamp =
                metadata.upload_timestamp &&
                typeof metadata.upload_timestamp === 'string' &&
                new Date(metadata.upload_timestamp).getTime() > tenMinutesAgo;

              if (hasFilename || hasRecentTimestamp) {
                documentsToDelete.push(id);
              }
            }
          });
        }

        if (documentsToDelete.length > 0) {
          console.log(
            `Found ${documentsToDelete.length} documents to clean up`
          );

          // Delete the documents that match the cancelled file
          await collection.delete({ ids: documentsToDelete });

          console.log(
            `Successfully deleted ${documentsToDelete.length} documents from ${collectionName}`
          );

          return NextResponse.json({
            message: `Cleanup completed: removed ${documentsToDelete.length} documents`,
            cleaned: true,
            documentsRemoved: documentsToDelete.length,
            removedDocuments: documentsToDelete,
          });
        } else {
          return NextResponse.json({
            message: 'No matching documents found for cleanup',
            cleaned: false,
          });
        }
      } catch (deleteError) {
        console.error('Error during document cleanup:', deleteError);
        return NextResponse.json(
          {
            message: 'Cleanup failed',
            cleaned: false,
            error:
              deleteError instanceof Error
                ? deleteError.message
                : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'No filename provided for cleanup',
      cleaned: false,
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
