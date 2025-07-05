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
}

export interface CollectionDocument {
  id: string;
  document?: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
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

  async getCollections(): Promise<Collection[]> {
    if (!this.isConnectedState) {
      throw new Error("ChromaDB client not connected");
    }

    try {
      const response = await fetch(`${this.baseApiUrl}?action=collections`);
      const data = await response.json();

      if (data.success) {
        return data.collections || [];
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
    limit?: number
  ): Promise<CollectionDocument[]> {
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

      const response = await fetch(`${this.baseApiUrl}?${params}`);
      const data = await response.json();

      if (data.success) {
        return data.documents || [];
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
