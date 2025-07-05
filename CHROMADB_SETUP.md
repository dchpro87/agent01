# ChromaDB Integration Setup - Production Ready

This project includes comprehensive ChromaDB integration for vector database functionality with semantic search, document management, and context-aware AI responses. The implementation uses a server-side API architecture for optimal performance and compatibility.

## Architecture Overview

The ChromaDB integration implements a **production-ready server-side architecture**:

### Client-Side Components
- **`ContextWindowManager.tsx`** - Visual interface for managing ChromaDB collections and context
- **`CollectionDetail.tsx`** - Detailed view of collection documents and metadata
- **`chromadb.ts`** - HTTP client manager that communicates with server-side APIs
- **`Chat.tsx`** - Enhanced chat interface with real-time context integration

### Server-Side APIs
- **`/api/chromadb/route.ts`** - Main ChromaDB integration API with full CRUD operations
- **`/api/embeddings/route.ts`** - Ollama embedding generation API for vector operations
- **`/api/chat/route.ts`** - Enhanced chat API with automatic context augmentation

### Vector Database Features
- **Semantic Search**: Advanced similarity search across document collections
- **Context Augmentation**: Automatic integration of relevant documents into AI responses
- **Collection Management**: Full collection browsing and document examination
- **Custom Embeddings**: Ollama nomic-embed-text integration for high-quality vectors
- **Real-time Updates**: Live connection monitoring and status indicators

This architecture eliminates `node:process` webpack compatibility issues while providing enterprise-grade vector database functionality.

## Prerequisites

1. **ChromaDB Server**: Running locally or remotely accessible ChromaDB instance
2. **Ollama Server**: For embedding generation with nomic-embed-text model  
3. **Node.js 18+**: For the Next.js application
4. **Python 3.8+**: For ChromaDB installation (if running locally)

### Quick Start Installation

1. **Install ChromaDB Server**:
   ```bash
   # Install ChromaDB
   pip install chromadb
   
   # Start ChromaDB server
   chroma run --host localhost --port 8000
   ```

2. **Install Ollama Embedding Model**:
   ```bash
   # Pull the embedding model
   ollama pull nomic-embed-text
   
   # Verify model is available
   ollama list | grep nomic-embed-text
   ```

3. **Verify ChromaDB is Running**:
   - **Web UI**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs  
   - **Health Check**: http://localhost:8000/api/v1/heartbeat

### Alternative Installation Methods

#### Using Docker
```bash
# Run ChromaDB in Docker
docker run -p 8000:8000 chromadb/chroma:latest

# Or with persistent storage
docker run -p 8000:8000 -v ./chroma-data:/chroma/chroma chromadb/chroma:latest
```

#### Cloud Deployment
```bash
# For production deployments, consider:
# - ChromaDB Cloud (when available)
# - Self-hosted on cloud providers
# - Docker containers in cloud services
```

## Features Implemented

### Comprehensive Vector Database Integration
- **Collection Management**: Browse, examine, and manage ChromaDB collections
- **Document Browsing**: Detailed view of documents with metadata and content
- **Semantic Search**: Advanced similarity search using custom Ollama embeddings
- **Context Integration**: Automatic context augmentation for AI responses
- **Real-time Status**: Live connection monitoring and health indicators

### Advanced Context Window Management
- **Visual Interface**: User-friendly interface for managing active collections
- **Active Collection System**: Add/remove collections from chat context with visual feedback
- **Collection Detail Views**: Click-through examination of documents and metadata
- **Context Indicators**: Visual badges showing active collection count and status
- **Real-time Updates**: Immediate UI updates when collections are modified

### Custom Embedding Integration
- **Ollama nomic-embed-text**: High-quality embedding generation using local Ollama
- **Batch Processing**: Efficient batch embedding generation for performance
- **Custom Embedding Function**: ChromaDB-compatible embedding function implementation
- **Flexible Configuration**: Configurable embedding models and parameters

### Production-Ready APIs
- **Health Monitoring**: Comprehensive health checking and diagnostics
- **Error Handling**: Robust error handling with graceful degradation
- **Performance Optimization**: Connection pooling and query optimization
- **Security**: Server-side processing with input validation

## Usage

### Getting Started
1. **Start ChromaDB Server** (if not already running):
   ```bash
   chroma run --host localhost --port 8000
   ```

2. **Start Ollama Server** (if not already running):
   ```bash
   ollama serve
   ```

3. **Start the Next.js Application**:
   ```bash
   npm run dev
   ```

4. **Access Vector Database Features**:
   - Open the application in your browser (http://localhost:3000)
   - Click the database icon in the chat header to open Context Window Manager
   - The system will automatically attempt to connect to ChromaDB
   - View connection status, browse collections, and manage context

### Using the Context Window Manager

#### Connection Management
- **Automatic Connection**: Opens and connects to ChromaDB when the dialog is opened
- **Health Monitoring**: Real-time connection status with visual indicators
- **Error Recovery**: Automatic retry logic with detailed error messages

#### Collection Management
- **Browse Collections**: View all available collections with metadata
- **Collection Details**: Click on collection names to examine documents
- **Active Collections**: Add collections to chat context by clicking database icons
- **Visual Feedback**: Green highlighting and badges for active collections

#### Context Integration
- **Semantic Search**: Ask questions and get context from active collections
- **Automatic Augmentation**: Relevant documents are automatically added to AI responses
- **Multi-Collection Support**: Query multiple collections simultaneously
- **Performance Optimization**: Intelligent result limiting and caching

## Connection Status Indicators

- 🔵 **Connecting**: Spinning blue icon while establishing connection
- ✅ **Connected**: Green checkmark when successfully connected
- ❌ **Error**: Red warning icon when connection fails

## API Endpoints

### ChromaDB Integration API (`/api/chromadb`)

#### GET Endpoints
```bash
# Connect to ChromaDB and return version info
GET /api/chromadb?action=connect

# Check ChromaDB server health
GET /api/chromadb?action=health

# List all collections with metadata
GET /api/chromadb?action=collections

# Get documents from a specific collection
GET /api/chromadb?action=get_documents&collection=COLLECTION_NAME&limit=50

# Disconnect from ChromaDB
GET /api/chromadb?action=disconnect
```

#### POST Endpoints
```bash
# Test existing connection
POST /api/chromadb
Body: { "action": "test" }

# Query collection for semantic search
POST /api/chromadb
Body: {
  "action": "query_collection",
  "collection": "collection_name",
  "query_texts": ["search query"],
  "n_results": 5
}
```

### Embeddings API (`/api/embeddings`)

#### GET Endpoints
```bash
# Test embedding generation
GET /api/embeddings?action=test&text=sample text

# Generate single embedding
GET /api/embeddings?action=embedding&text=your text here

# Generate batch embeddings
GET /api/embeddings?action=batch&texts=["text1","text2","text3"]
```

#### POST Endpoints
```bash
# Generate embeddings for multiple texts
POST /api/embeddings
Body: {
  "action": "generate",
  "texts": ["text1", "text2", "text3"]
}

# Generate single embedding
POST /api/embeddings
Body: {
  "action": "generate",
  "text": "single text"
}
```

### Example Usage
```bash
# Check ChromaDB health
curl "http://localhost:3000/api/chromadb?action=health"

# Connect to ChromaDB
curl "http://localhost:3000/api/chromadb?action=connect"

# List all collections
curl "http://localhost:3000/api/chromadb?action=collections"

# Test embedding generation
curl "http://localhost:3000/api/embeddings?action=test"

# Query a collection
curl -X POST "http://localhost:3000/api/chromadb" \
  -H "Content-Type: application/json" \
  -d '{"action":"query_collection","collection":"my_collection","query_texts":["search term"],"n_results":3}'
```

## Configuration

### Application Configuration (`src/constants/app-config.ts`)
```typescript
export const APP_CONFIG = {
  chromadb: {
    baseURL: "http://localhost:8000",
    timeout: 30000,
    maxRetries: 3,
  },
  embeddings: {
    model: "nomic-embed-text",
    batchSize: 10,
    dimensions: 768,
    timeout: 60000,
  },
  context: {
    maxDocuments: 5,           // Maximum documents per query
    maxTokensPerDocument: 500, // Truncate long documents
    similarityThreshold: 0.7,  // Minimum similarity for inclusion
  },
};
```

### Environment Variables (Optional)
```bash
# ChromaDB Configuration
CHROMADB_URL=http://localhost:8000
CHROMADB_TIMEOUT=30000

# Embedding Configuration  
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_BATCH_SIZE=10
EMBEDDING_TIMEOUT=60000

# Context Configuration
MAX_CONTEXT_DOCUMENTS=5
MAX_TOKENS_PER_DOCUMENT=500
SIMILARITY_THRESHOLD=0.7
```

### Production Configuration
```bash
# .env.production
CHROMADB_URL=https://your-chromadb-server.com:8000
OLLAMA_BASE_URL=https://your-ollama-server.com:11434
EMBEDDING_MODEL=nomic-embed-text

# Security Settings
CHROMADB_API_KEY=your_api_key_here
CHROMADB_TIMEOUT=60000
MAX_CONTEXT_DOCUMENTS=3
```

### Connection Issues
1. **ChromaDB Not Running**: 
   ```bash
   # Check if ChromaDB is running
   curl http://localhost:8000/api/v1/heartbeat
   
   # Start ChromaDB if not running
   chroma run --host localhost --port 8000
   ```

2. **Port Conflicts**: 
   ```bash
   # Check what's using port 8000
   lsof -i :8000
   
   # Kill process if needed
   kill -9 PID
   
   # Or run ChromaDB on different port
   chroma run --host localhost --port 8001
   ```

3. **Ollama Embedding Issues**:
   ```bash
   # Ensure embedding model is available
   ollama list | grep nomic-embed-text
   
   # Pull model if missing
   ollama pull nomic-embed-text
   
   # Test embedding generation
   curl "http://localhost:3000/api/embeddings?action=test"
   ```

### Performance Issues
1. **Slow Queries**: 
   - Reduce `maxDocuments` in configuration
   - Implement result caching
   - Use smaller embedding batches

2. **Memory Usage**:
   - Limit document content length
   - Implement pagination for large collections
   - Monitor ChromaDB memory usage

3. **Network Timeouts**:
   - Increase timeout values in configuration
   - Check network connectivity between services
   - Implement retry logic with exponential backoff

### Common Errors
- **`Connection refused`**: ChromaDB server is not running or unreachable
- **`Model not found`**: nomic-embed-text model not installed in Ollama
- **`Timeout`**: ChromaDB server is overloaded or network issues
- **`Unauthorized`**: Check ChromaDB authentication settings (if enabled)
- **`Collection not found`**: Collection name doesn't exist or was deleted

### Debug Mode
```bash
# Enable debug logging
AI_LOG_LEVEL=debug npm run dev

# Check browser console for detailed logs
# Check server logs for API errors
# Monitor ChromaDB logs for database issues
```

## Next Steps

The current implementation provides basic connection functionality. Future enhancements could include:

1. **Collection Management**: Create, update, and delete collections
2. **Document Operations**: Add, query, and manage documents in collections
3. **Embedding Integration**: Integrate with embedding models for semantic search
4. **Advanced Querying**: Implement complex query operations
5. **Batch Operations**: Support for bulk document operations

## Dependencies

- `chromadb@3.0.6`: ChromaDB JavaScript client
- `@chroma-core/default-embed@0.1.8`: Default embedding functions
