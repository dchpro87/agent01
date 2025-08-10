# Embedding Function Fix Test

## Issue Description

Collections created with Ollama embedding function were showing the error:
"No embedding function configuration found for collection {name}. 'add' and 'query' will fail unless you provide them em"

## Root Cause

The embedding function was not being consistently applied when:

1. Getting documents from collections
2. Adding documents to collections
3. Querying collections
4. Deleting documents from collections

## Solution Implemented

### 1. Collection Metadata Storage

When creating collections, we now store embedding function metadata:

```typescript
const collectionMetadata = {
  created_at: new Date().toISOString(),
  embedding_function: useOllamaEmbedding ? 'ollama-nomic-embed' : 'default',
  embedding_model: useOllamaEmbedding ? 'nomic-embed-text' : 'default',
};
```

### 2. Automatic Embedding Function Detection

Created helper function to automatically determine the correct embedding function:

```typescript
async function getCollectionEmbeddingFunction(
  client: ChromaClient,
  collectionName: string
): Promise<ReturnType<typeof createOllamaEmbeddingFunction> | undefined>;
```

### 3. Updated All Collection Operations

Updated all collection operations to use the metadata-based embedding function detection:

- `GET_DOCUMENTS`
- `ADD_DOCUMENTS`
- `DELETE_DOCUMENTS`
- `QUERY_COLLECTION`

### 4. Updated find-similar-docs Tool

The tool now automatically detects the correct embedding function from collection metadata.

## Testing Steps

1. Create a new collection with Ollama embedding
2. Add documents to the collection
3. Try to query the collection
4. Verify no embedding function errors occur

## Expected Behavior

- No more "No embedding function configuration found" errors
- Collections automatically use the correct embedding function based on their metadata
- Existing collections should work seamlessly after this fix
