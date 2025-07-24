# Agent01 - AI Chat Application

A modern AI chat application built with **Next.js 15**, **Vercel AI SDK v4**, and **Ollama**. Features include streaming chat, multimodal support, vector database integration, web search, and built-in AI tools.

## ✨ Key Features

- **🤖 Multiple AI Models** - Switch between any Ollama models with tool support detection
- **🗄️ Vector Database** - ChromaDB integration with semantic search and document processing  
- **🌐 Web Search** - SerpAPI integration with 11 search engines
- **📎 File Attachments** - Images, PDFs, and documents with multimodal processing
- **🎭 AI Personalities** - 10+ pre-built personalities plus custom creation
- **🔧 Built-in Tools** - Web search, weather, BMI calculator, current time
- **⚡ Real-time Streaming** - Fast responses with progress indicators
- **🎨 Modern UI** - Responsive design with dark/light mode

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Ollama** - [Install from ollama.ai](https://ollama.ai)

### Installation

1. **Clone and install:**
   ```bash
   git clone https://github.com/dchpro87/agent01.git
   cd agent01
   npm install
   ```

2. **Install AI models:**
   ```bash
   ollama pull llama3.2:3b
   ollama pull nomic-embed-text  # For vector database
   ```

3. **Start services:**
   ```bash
   ollama serve
   npm run dev
   ```

4. **Open browser:** Navigate to [http://localhost:3000](http://localhost:3000)

### Optional Setup

**ChromaDB (for vector database features):**
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

**SerpAPI (for web search):**
- Get API key from [serpapi.com](https://serpapi.com)
- Set environment: `$env:SERP_API_KEY="your_key"`

## 🎯 Usage

### Basic Chat
- Type messages and get AI responses with real-time streaming
- Use keyboard shortcuts: `Enter` to send, `Shift+Enter` for new line

### File Attachments 
- Click the 📎 icon to attach images, PDFs, or documents
- AI automatically processes files with vision-capable models

### AI Personalities
- Click ⚙️ to browse 10+ built-in personalities (Sarah, Marcus, Emily, etc.)
- Create custom personalities with unique behavior and expertise

### Vector Database (ChromaDB)
- Click 🗄️ to manage document collections
- Upload PDFs for automatic processing and semantic search
- Add collections to chat context for intelligent document retrieval

### Tools & Web Search  
- Ask for web searches: *"Search for latest AI news"*
- Get current time: *"What time is it in Tokyo?"*
- Calculate BMI: *"BMI for 5'9" and 160 lbs"*
- Tools automatically activate with compatible models

### Model Configuration
- Click 🤖 to switch between Ollama models
- Models with 🔧 icon support tools and function calling
- Fine-tune temperature, tokens, and other parameters

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI Integration:** Vercel AI SDK v4, Ollama API
- **Vector Database:** ChromaDB with custom embeddings
- **Web Search:** SerpAPI with 11 search engines
- **UI Components:** Lucide React icons, React Markdown
- **Validation:** Zod schemas for type safety

## 🔧 Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint checks
```

### Adding New Tools
Create files in `src/lib/tools/` and export from `src/lib/tools-main.ts`:

```typescript
export const myTool = {
  description: "Tool description",
  parameters: z.object({
    param: z.string().describe("Parameter description")
  }),
  execute: async ({ param }) => {
    return "Tool result";
  }
};
```

### Adding Personalities
Add to `PREDEFINED_PROMPTS` in `src/constraints/predefined-system-prompts.ts`:

```typescript
## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to [Vercel](https://vercel.com)  
3. Configure environment variables
4. Deploy automatically

### Docker
```bash
npm run build

# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./.next
COPY public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```bash
SERP_API_KEY=your_api_key
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add feature'`
5. Push and create Pull Request

### Priority Areas
- 🌐 Web search enhancements
- 🔧 New AI tools and integrations  
- 📄 Document processing improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel](https://vercel.com) for the AI SDK
- [Ollama](https://ollama.ai) for local AI models
- [ChromaDB](https://trychroma.com) for vector database
- [SerpAPI](https://serpapi.com) for web search

---

**Built with ❤️ by [dchpro87](https://github.com/dchpro87)**
