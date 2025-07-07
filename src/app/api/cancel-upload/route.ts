import { NextRequest, NextResponse } from "next/server";
import { chromaDBManager } from "@/lib/chromadb";

export async function POST(request: NextRequest) {
  try {
    const { collectionName, fileName } = await request.json();

    if (!collectionName) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    console.log(
      `Performing cleanup for collection: ${collectionName}, file: ${fileName}`
    );

    // Check if collection exists
    const collections = await chromaDBManager.getCollections();
    const collection = collections.find((c) => c.name === collectionName);

    if (!collection) {
      console.log(`Collection ${collectionName} not found, no cleanup needed`);
      return NextResponse.json({
        message: "Collection not found, no cleanup needed",
        cleaned: false,
      });
    }

    // Get all documents in the collection to check for partial uploads
    const documents = await chromaDBManager.getCollectionDocuments(
      collectionName
    );

    if (fileName && documents.documents.length > 0) {
      // Look for documents that might be from the cancelled upload
      // This approach uses timestamp-based filtering for recently added documents
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago

      const recentDocuments = documents.documents.filter((doc) => {
        // Check if metadata contains the filename or if document was recently added
        const metadata = doc.metadata;
        if (metadata && typeof metadata === "object") {
          // Check for filename match
          const hasFilename =
            ("source" in metadata &&
              typeof metadata.source === "string" &&
              metadata.source.includes(fileName)) ||
            ("filename" in metadata &&
              typeof metadata.filename === "string" &&
              metadata.filename.includes(fileName));

          // Check for recent timestamp (if available)
          const hasRecentTimestamp =
            "timestamp" in metadata &&
            typeof metadata.timestamp === "number" &&
            metadata.timestamp > fiveMinutesAgo;

          // Check for upload session (if available)
          const hasUploadSession =
            "uploadSession" in metadata &&
            typeof metadata.uploadSession === "string";

          return hasFilename || hasRecentTimestamp || hasUploadSession;
        }
        return false;
      });

      if (recentDocuments.length > 0) {
        console.log(`Found ${recentDocuments.length} documents to clean up`);

        // Delete the documents that match the cancelled file
        const documentIds = recentDocuments.map((doc) => doc.id);

        try {
          await chromaDBManager.deleteDocuments(collectionName, documentIds);
          console.log(
            `Successfully deleted ${documentIds.length} documents from ${collectionName}`
          );

          return NextResponse.json({
            message: `Cleanup completed: removed ${documentIds.length} documents`,
            cleaned: true,
            documentsRemoved: documentIds.length,
            removedDocuments: documentIds,
          });
        } catch (deleteError) {
          console.error(
            "Error deleting documents during cleanup:",
            deleteError
          );
          return NextResponse.json(
            {
              message: "Partial cleanup completed with errors",
              cleaned: false,
              error:
                deleteError instanceof Error
                  ? deleteError.message
                  : "Unknown error",
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      message: "No cleanup needed - no matching documents found",
      cleaned: false,
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
