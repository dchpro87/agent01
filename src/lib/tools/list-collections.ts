import { z } from "zod";
import { tool } from "ai";
import { ChromaClient } from "chromadb";
import { CHROMADB_BASE_URL } from "@/constraints/chromadb-constraints";

/** Tool to list all available collections in ChromaDB */
export const list_collections = tool({
  description:
    "List all available collections in the ChromaDB knowledge base. This tool retrieves and returns information about all collections currently stored in ChromaDB, including collection names and basic metadata.",
  parameters: z.object({
    includeMetadata: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether to include additional collection metadata in the results"
      ),
  }),
  execute: async ({ includeMetadata = false }) => {
    console.log("🔧 list_collections tool called with:", {
      includeMetadata,
    });

    try {
      // Create a direct ChromaDB client connection
      const client = new ChromaClient({
        path: CHROMADB_BASE_URL,
      });

      // Get all collections
      const collections = await client.listCollections();

      console.log(`📋 Found ${collections.length} collections`);

      // Format the results
      interface FormattedCollection {
        name: string;
        id: string;
        metadata?: Record<string, unknown>;
        documentCount?: number;
      }

      const formattedCollections: FormattedCollection[] = [];

      for (const col of collections) {
        const result: FormattedCollection = {
          name: col.name,
          id: col.id,
        };

        if (includeMetadata) {
          result.metadata = col.metadata || {};

          // Get document count for each collection if metadata is requested
          try {
            const collection = await client.getCollection({
              name: col.name,
            });
            const collectionData = await collection.get({ limit: 1 });
            result.documentCount = collectionData.ids?.length || 0;
          } catch (error) {
            console.warn(
              `Warning: Could not get document count for collection "${col.name}":`,
              error
            );
            result.documentCount = 0;
          }
        }

        formattedCollections.push(result);
      }

      // Sort collections by name for consistent ordering
      formattedCollections.sort((a, b) => a.name.localeCompare(b.name));

      const resultSummary = {
        collections: formattedCollections,
        summary: {
          totalCollections: collections.length,
          collectionNames: formattedCollections.map((col) => col.name),
          timestamp: new Date().toISOString(),
        },
        success: true,
      };

      console.log("✅ list_collections completed successfully");
      return resultSummary;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ list_collections error:", errorMessage);

      return {
        error: "Failed to list collections",
        details: errorMessage,
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  },
});
