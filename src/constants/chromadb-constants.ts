/**
 * ChromaDB-related constants
 */

// ChromaDB server configuration
export const CHROMADB_BASE_URL = "http://localhost:8000";

// ChromaDB API endpoints
export const CHROMADB_API_ENDPOINTS = {
  VERSION_V1: "/api/v1/version",
  VERSION_V2: "/api/v2/version",
} as const;

// Default query configuration
export const CHROMADB_DEFAULTS = {
  QUERY_RESULTS_LIMIT: 10,
} as const;

// Action types for API requests
export const CHROMADB_ACTIONS = {
  CONNECT: "connect",
  HEALTH: "health",
  COLLECTIONS: "collections",
  GET_DOCUMENTS: "get_documents",
  CREATE_COLLECTION: "create_collection",
  DELETE_COLLECTION: "delete_collection",
  DELETE_DOCUMENTS: "delete_documents",
  DISCONNECT: "disconnect",
  TEST: "test",
  ADD_DOCUMENTS: "add_documents",
  QUERY_COLLECTION: "query_collection",
} as const;
