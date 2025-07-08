// Client-side ChromaDB manager that communicates with server-side API
export interface ChromaDBConnection {
  isConnected: boolean;
  error?: string;
  version?: string;
}

export interface Collection {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
  documentCount?: number;
}

export interface CollectionDocument {
  id: string;
  document?: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

export interface PaginatedDocumentsResponse {
  documents: CollectionDocument[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface CollectionData {
  ids: string[];
  documents?: string[];
  metadatas?: Record<string, unknown>[];
  embeddings?: number[][];
}

export interface HealthStatus {
  status: string;
  details?: unknown;
}

export class ChromaDBManager {
  private isConnectedState = false;
  private baseApiUrl = "/api/chromadb";

  async connect(): Promise<ChromaDBConnection> {
    try {
      const response = await fetch(`${this.baseApiUrl}?action=connect`);
      const data = await response.json();

      if (data.success) {
        this.isConnectedState = true;
        console.log("Connected to ChromaDB version:", data.version);

        return {
          isConnected: true,
          version: data.version,
        };
      } else {
        this.isConnectedState = false;
        return {
          isConnected: false,
          error: data.error || "Connection failed",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to connect to ChromaDB:", errorMessage);
      this.isConnectedState = false;

      return {
        isConnected: false,
        error: errorMessage,
      };
    }
  }

  async disconnect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseApiUrl}?action=disconnect`);
      const data = await response.json();

      if (data.success) {
        this.isConnectedState = false;
        console.log("Disconnected from ChromaDB");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      // Still set to disconnected state even if API call fails
      this.isConnectedState = false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConnectedState) {
      return false;
    }

    try {
      const response = await fetch(this.baseApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "test" }),
      });

      const data = await response.json();
      return data.success && data.connected;
    } catch (error) {
      console.error("ChromaDB connection test failed:", error);
      return false;
    }
  }

  async getCollectionDocumentCount(collectionName: string): Promise<number> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const response = await this.getCollectionDocuments(collectionName, 1, 0);
      return response.totalCount;
    } catch (error) {
      console.error("Failed to get collection document count:", error);
      return 0;
    }
  }

  async getCollections(): Promise<Collection[]> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const response = await fetch(`${this.baseApiUrl}?action=collections`);
      const data = await response.json();

      if (data.success) {
        const collections = data.collections || [];

        // Fetch document counts for each collection
        const collectionsWithCounts = await Promise.all(
          collections.map(async (collection: Collection) => {
            try {
              const docResponse = await this.getCollectionDocuments(
                collection.name,
                1,
                0
              );
              return {
                ...collection,
                documentCount: docResponse.totalCount,
              };
            } catch (error) {
              console.warn(
                `Failed to get document count for collection ${collection.name}:`,
                error
              );
              return {
                ...collection,
                documentCount: 0,
              };
            }
          })
        );

        return collectionsWithCounts;
      } else {
        throw new Error(data.error || "Failed to fetch collections");
      }
    } catch (error) {
      console.error("Failed to get collections:", error);
      throw error;
    }
  }

  async getCollectionDocuments(
    collectionName: string,
    limit?: number,
    offset?: number
  ): Promise<PaginatedDocumentsResponse> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const params = new URLSearchParams({
        action: "get_documents",
        collection: collectionName,
      });

      if (limit) {
        params.append("limit", limit.toString());
      }

      if (offset) {
        params.append("offset", offset.toString());
      }

      const response = await fetch(`${this.baseApiUrl}?${params}`);
      const data = await response.json();

      if (data.success) {
        return {
          documents: data.documents || [],
          totalCount: data.totalCount || 0,
          limit: data.limit || data.documents?.length || 0,
          offset: data.offset || 0,
        };
      } else {
        throw new Error(data.error || "Failed to fetch collection documents");
      }
    } catch (error) {
      console.error("Failed to get collection documents:", error);
      throw error;
    }
  }

  async queryCollection(
    collectionName: string,
    queryTexts: string[],
    nResults?: number,
    where?: Record<string, unknown>
  ): Promise<CollectionDocument[]> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const response = await fetch(this.baseApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "query_collection",
          collection: collectionName,
          query_texts: queryTexts,
          n_results: nResults,
          where: where,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.results || [];
      } else {
        throw new Error(data.error || "Failed to query collection");
      }
    } catch (error) {
      console.error("Failed to query collection:", error);
      throw error;
    }
  }

  async createCollection(
    name: string,
    useOllamaEmbedding: boolean = false
  ): Promise<Collection> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const params = new URLSearchParams({
        action: "create_collection",
        name: name,
        ollama_embedding: useOllamaEmbedding.toString(),
      });

      const response = await fetch(`${this.baseApiUrl}?${params}`);
      const data = await response.json();

      if (data.success) {
        return data.collection;
      } else {
        throw new Error(data.error || "Failed to create collection");
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
      throw error;
    }
  }

  async deleteCollection(name: string): Promise<void> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const params = new URLSearchParams({
        action: "delete_collection",
        name: name,
      });

      const response = await fetch(`${this.baseApiUrl}?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete collection");
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
      throw error;
    }
  }

  async addDocuments(
    collectionName: string,
    documents: string[],
    ids: string[],
    metadatas?: Record<string, unknown>[],
    useOllamaEmbedding: boolean = false
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const response = await fetch(this.baseApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add_documents",
          collection: collectionName,
          documents,
          ids,
          metadatas,
          generate_ollama_embeddings: useOllamaEmbedding,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.message,
        };
      } else {
        throw new Error(data.error || "Failed to add documents");
      }
    } catch (error) {
      console.error("Failed to add documents:", error);
      throw error;
    }
  }

  async deleteDocuments(
    collectionName: string,
    ids: string[]
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const response = await fetch(this.baseApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_documents",
          collection: collectionName,
          ids,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.message,
        };
      } else {
        throw new Error(data.error || "Failed to delete documents");
      }
    } catch (error) {
      console.error("Failed to delete documents:", error);
      throw error;
    }
  }

  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseApiUrl}?action=health`);
      const data = await response.json();

      if (data.success) {
        return {
          status: data.status,
          details: data.details,
        };
      } else {
        return {
          status: data.status || "error",
          details: data.details || data.error,
        };
      }
    } catch (error) {
      return {
        status: "error",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  isConnected(): boolean {
    return this.isConnectedState;
  }
}

// Create a singleton instance
export const chromaDBManager = new ChromaDBManager();
