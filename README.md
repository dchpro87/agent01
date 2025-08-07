# Agent01 - Local AI Chat Platform

A complete local AI chat platform built with **Next.js**, **Ollama**, and **ChromaDB**. Run entirely offline with no cloud dependencies.

## IDE

VSCode, Github Copilot Agent with Claude Sonnet 4

## 🎯 Core Features

- **🔒 100% Local** - Everything runs locally: AI models, vector database, and web interface
- **🤖 Multiple AI Models** - Use any Ollama model with automatic tool support detection  
- **� Vector Database** - ChromaDB integration for document search and context augmentation
- **🔧 Built-in Tools** - Web Search, Dummy Document Summarizer, Add more...
- **📎 File Support** - Upload images, PDFs with multimodal processing
- **⚡ Streaming Responses** - Real-time AI responses

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Ollama** - [Install from ollama.ai](https://ollama.ai)
- **Python 3.8+** - For ChromaDB (optional)

### 1. Setup the Platform
```bash
# Clone and install
git clone https://github.com/dchpro87/agent01.git
cd agent01
npm install

# Install required AI models
ollama pull llama3.2:3b          # Primary chat model
ollama pull nomic-embed-text     # For vector embeddings
```

### 2. Start Services
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start ChromaDB (optional but recommended)
pip install chromadb
chroma run --host localhost --port 8000

# Terminal 3: Start the platform
npm run dev
```

### 3. Access the Platform
Open [http://localhost:3000](http://localhost:3000) in your browser

## 💡 How to Use

### Basic Chat
- Type messages and get AI responses with real-time streaming
- Switch models using the 🤖 icon for different capabilities
- Use 🎭 icon to select different AI personalities

### Document Context (ChromaDB)
- Click 🗄️ icon to manage document collections  
- Add collections to chat context for intelligent Q&A
- Upload your own documents (PDFs, etc.) to create knowledge bases

### Tools & Features
- **File Attachments**: Click 📎 to upload images, documents
- **AI Tools**: Ask for time, calculations, or web searches (with API key)
- **Model Config**: Adjust temperature, tokens, and other parameters

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI**: Ollama (local models), Vercel AI SDK v4
- **Vector DB**: ChromaDB with nomic-embed-text embeddings
- **Optional**: SerpAPI for web search

## 📁 Project Structure

```
src/
├── app/api/          # API routes for chat, ChromaDB, health
├── components/       # React components for UI
├── constraints/      # Configuration and constants
├── lib/             # Core logic (AI, ChromaDB, tools)
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

## ⚙️ Configuration

Edit `src/constraints/app-config.ts` to customize:

```typescript
export const APP_CONFIG = {
  ollama: {
    baseURL: "http://localhost:11434",  // Ollama server
    model: "llama3.2:3b",               // Default model
    temperature: 0.7,                   // Response creativity
  },
  // ... other settings
};
```

## � Development

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run lint         # Run code quality checks
```

## 🔧 Adding Features

### New AI Tools
Create in `src/lib/tools/` and export from `src/lib/tools/index.ts`

### New AI Personalities  
Add to `PREDEFINED_PROMPTS` in `src/constraints/predefined-system-prompts.ts`

### Custom Models
Any Ollama model works - just add it to the model database in `src/constraints/model-databse.ts`
## 📄 License

MIT License

---

**Built for local AI development by [dchpro87](https://github.com/dchpro87)**
