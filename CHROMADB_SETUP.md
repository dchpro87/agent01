# ChromaDB Integration Setup

This project now includes ChromaDB integration for vector database functionality. The connection is established through a server-side API to avoid client-side Node.js compatibility issues.

## Architecture

The ChromaDB integration uses a **server-side API architecture**:

- **Client-side**: `src/components/ContextWindowManager.tsx` - UI component for managing ChromaDB
- **Client-side Manager**: `src/lib/chromadb.ts` - HTTP client that communicates with the server API
- **Server-side API**: `src/app/api/chromadb/route.ts` - Next.js API route that directly communicates with ChromaDB

This approach avoids the `node:process` webpack issues that occur when trying to use ChromaDB directly in the browser.

## Prerequisites

1. **ChromaDB Server**: Make sure you have ChromaDB running locally on `http://localhost:8000`
   
   To start ChromaDB server:
   ```bash
   # Install ChromaDB if not already installed
   pip install chromadb
   
   # Start the ChromaDB server
   chroma run --host localhost --port 8000
   ```

2. **Verify ChromaDB is Running**: You can check if ChromaDB is running by visiting:
   - Web UI: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health check: http://localhost:8000/api/v1/heartbeat

## Features Implemented

### Server-side API (`src/app/api/chromadb/route.ts`)
- **Connection Management**: Establishes and manages connection to local ChromaDB instance
- **Health Monitoring**: Checks ChromaDB server health status via `/api/v1/heartbeat`
- **Collection Management**: Lists and manages ChromaDB collections
- **Error Handling**: Robust error handling for connection issues
- **RESTful API**: GET and POST endpoints for different operations

### Client-side Manager (`src/lib/chromadb.ts`)
- **HTTP Client**: Communicates with server-side API instead of direct ChromaDB connection
- **Connection State**: Manages client-side connection state
- **Error Handling**: Graceful error handling and user feedback
- **TypeScript Support**: Fully typed interfaces for better development experience

### Context Window Manager (`src/components/ContextWindowManager.tsx`)
- **Connection UI**: Visual interface showing ChromaDB connection status
- **Real-time Status**: Shows connection state with appropriate icons and colors
- **Collections Display**: Lists all available collections in the database
- **Connect/Disconnect**: Manual connection management buttons

## Usage

1. **Start ChromaDB Server** (if not already running):
   ```bash
   chroma run --host localhost --port 8000
   ```

2. **Start the Next.js Application**:
   ```bash
   npm run dev
   ```

3. **Access the Context Window Manager**:
   - Open the application in your browser (http://localhost:3000)
   - The ContextWindowManager will automatically attempt to connect to ChromaDB when opened
   - You'll see the connection status, health information, and any existing collections

## Connection Status Indicators

- 🔵 **Connecting**: Spinning blue icon while establishing connection
- ✅ **Connected**: Green checkmark when successfully connected
- ❌ **Error**: Red warning icon when connection fails

## API Endpoints

### GET `/api/chromadb`
Query parameters:
- `action=connect` - Connect to ChromaDB and return version info
- `action=health` - Check ChromaDB server health
- `action=collections` - List all collections
- `action=disconnect` - Disconnect from ChromaDB

### POST `/api/chromadb`
Body parameters:
- `{ "action": "test" }` - Test existing connection

### Example Usage
```bash
# Check health
curl "http://localhost:3000/api/chromadb?action=health"

# Connect to ChromaDB
curl "http://localhost:3000/api/chromadb?action=connect"

# List collections
curl "http://localhost:3000/api/chromadb?action=collections"
```

## Troubleshooting

### Connection Issues
1. **ChromaDB Not Running**: Make sure ChromaDB server is running on localhost:8000
2. **Port Conflicts**: Ensure port 8000 is not being used by another service
3. **Network Issues**: Check firewall settings if using remote ChromaDB instance

### Common Errors
- `Connection refused`: ChromaDB server is not running
- `Timeout`: ChromaDB server is unresponsive or overloaded
- `Unauthorized`: Check ChromaDB authentication settings

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
