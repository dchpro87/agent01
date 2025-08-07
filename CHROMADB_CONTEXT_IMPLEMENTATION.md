# ChromaDB Vector Database Integration

Implementation guide for the ChromaDB vector database integration, enabling semantic search and document context augmentation.

## Overview

This implementation adds vector database capabilities to the AI chat platform:

- **Local ChromaDB Server**: Runs on `localhost:8000` 
- **Custom Ollama Embeddings**: Uses `nomic-embed-text` model for embeddings
- **Context Augmentation**: Automatically retrieves relevant documents during chat
- **Visual Management**: UI for managing collections and active context

## Setup Instructions

### 1. Install ChromaDB
```bash
pip install chromadb
```

### 2. Start ChromaDB Server
```bash
chroma run --host localhost --port 8000
```

### 3. Install Embedding Model
```bash
ollama pull nomic-embed-text
```

### 4. Create Collections (Optional)
You can create collections programmatically or through the UI once it's running.

## Key Features

### Context Window Manager
- Click the 🗄️ database icon to open the context manager
- View all available collections with document counts
- Add/remove collections from active context with visual feedback
- Green highlighting shows active collections

### Semantic Search
- When collections are active, user queries automatically trigger semantic search
- Top 5 most relevant documents are retrieved and added to the AI context
- Works across multiple collections simultaneously

### Document Browsing
- Click on collection names to view detailed document listings
- See document metadata, content previews, and relevance scores
- Browse all documents within any collection

## Implementation Architecture

### Client-Side Components

**ContextWindowManager** (`src/components/ContextWindowManager.tsx`)
```typescript
const ContextWindowManager = ({ activeCollections, onActiveCollectionsChange }) => {
  // Auto-connect to ChromaDB when opened
  // Display collections with add/remove toggles
  // Show active status with visual indicators
};
```

**Chat Integration** (`src/components/Chat.tsx`)  
```typescript
const handleSubmit = async (message: string) => {
  const requestBody = {
    messages: [...messages, { role: "user", content: message }],
    activeCollections: Array.from(activeCollections), // Send active collections
  };
  // ... submit to API
};
```

### Server-Side APIs

**ChromaDB API** (`src/app/api/chromadb/route.ts`)
```typescript
export async function GET(request: NextRequest) {
  const action = searchParams.get("action");
  switch (action) {
    case "connect": // Connect and get version info
    case "collections": // List all collections  
    case "get_documents": // Get documents from collection
    case "health": // Check ChromaDB health
  }
}

export async function POST(request: NextRequest) {
  const { action } = await request.json();
  switch (action) {
    case "query_collection": // Perform semantic search
    case "test": // Test connection
  }
}
```

**Enhanced Chat API** (`src/app/api/chat/route.ts`)
```typescript
export async function POST(request: NextRequest) {
  const { messages, activeCollections } = await request.json();
  
  // Query active collections for context
  if (activeCollections?.length > 0) {
    const lastUserMessage = messages[messages.length - 1];
    const relevantDocs = await queryActiveCollections(
      activeCollections, 
      lastUserMessage.content
    );
    
    if (relevantDocs.length > 0) {
      const contextPrompt = `\n\nRelevant context:\n${relevantDocs
        .map((doc, index) => `${index + 1}. ${doc.document}`)
        .join('\n')}`;
      finalSystemPrompt += contextPrompt;
    }
  }
  
  // Continue with AI SDK streaming...
}
```

### ChromaDB Client Manager

**ChromaDB Manager** (`src/lib/chromadb.ts`)
```typescript
export class ChromaDBManager {
  private baseApiUrl = "/api/chromadb";

  async connect(): Promise<ChromaDBConnection> {
    const response = await fetch(`${this.baseApiUrl}?action=connect`);
    return response.json();
  }

  async getCollections(): Promise<Collection[]> {
    const response = await fetch(`${this.baseApiUrl}?action=collections`);
    return response.json();
  }

  async queryCollection(name: string, texts: string[]): Promise<Document[]> {
    const response = await fetch(this.baseApiUrl, {
      method: "POST",
      body: JSON.stringify({
        action: "query_collection",
        collection: name,
        query_texts: texts,
        n_results: 3,
      }),
    });
    return response.json();
  }
}
```

### Custom Ollama Embeddings

**Embedding Function** (`src/lib/ollama-embedding.ts`)
```typescript
export class OllamaEmbeddingFunction implements EmbeddingFunction {
  private model = "nomic-embed-text";
  private baseURL = "http://localhost:11434";

  async generate(texts: string[]): Promise<number[][]> {
    const embeddings = [];
    
    for (const text of texts) {
      const response = await fetch(`${this.baseURL}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt: text }),
      });
      
      const data = await response.json();
      embeddings.push(data.embedding);
    }
    
    return embeddings;
  }
}
```

## Usage Flow

1. **Open Context Manager**: Click 🗄️ icon in chat header
2. **Connect**: App automatically connects to ChromaDB server  
3. **Browse Collections**: View available collections with document counts
4. **Activate Collections**: Click database icon on collection cards to add to context
5. **Visual Feedback**: Active collections show green highlighting and count badge
6. **Chat with Context**: Ask questions - AI automatically searches collections for relevant context
7. **View Documents**: Click collection names to browse individual documents

## Configuration

**App Config** (`src/constraints/app-config.ts`)
```typescript
export const APP_CONFIG = {
  chromadb: {
    baseURL: "http://localhost:8000",
    timeout: 30000,
  },
  embeddings: {
    model: "nomic-embed-text",
    batchSize: 10,
    dimensions: 768,
  },
  context: {
    maxDocuments: 5,           // Max documents per query
    maxTokensPerDocument: 500, // Truncate long documents
  },
};
```

## Error Handling

- **Graceful Degradation**: Chat continues without context if ChromaDB is unavailable
- **Connection Monitoring**: Real-time health checks with visual status indicators  
- **Individual Collection Failures**: If one collection fails, others continue to work
- **Retry Logic**: Automatic retry for transient connection issues

## API Endpoints

- `GET /api/chromadb?action=connect` - Connect and get server info
- `GET /api/chromadb?action=collections` - List all collections
- `POST /api/chromadb` with `action=query_collection` - Semantic search
- `GET /api/chromadb?action=health` - Check ChromaDB health

This implementation provides seamless vector database integration that enhances AI responses with relevant document context while maintaining the local-first architecture.
