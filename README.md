# Agent01 - Adva### 🗄️ **Vector Database & Context Management**
- **ChromaDB Integration** - Full vector database support with semanti### **Improved User Experience**
- **🌐 Real-time Web Search Interface** - Seamless integration of web search results with formatted, structured output
- **📄 Advanced PDF Management** - Drag-and-drop PDF upload with real-time processing progress and detailed analytics
- **🗄️ Enhanced Vector Database UI** - Improved collection management with document browsing and metadata viewing
- **📱 Advanced File Management** - Better preview, validation, and processing for multimodal content
- **🎨 Responsive Design Enhancements** - Optimized interface for all device sizes with improved accessibility
- **⚡ Performance Optimizations** - Faster streaming, better error handling, and enhanced connection monitoring
- **🛡️ Enhanced Security** - Comprehensive input validation, secure file handling, and improved error boundaries
- **📈 Real-time Diagnostics** - Advanced health monitoring with actionable insights and suggestions
- **🔄 Intelligent Error Recovery** - Automatic retry logic and graceful degradation for better reliabilitych capabilities
- **Advanced PDF Processing** - Streaming PDF upload with real-time progress tracking and intelligent chunking
- **Context Window Manager** - Visual interface for managing collections and context data
- **Document Upload & Processing** - Direct PDF upload with automatic text extraction, chunking, and embedding generation
- **Active Collection System** - Add/remove collections from chat context with real-time indicators
- **Semantic Search Integration** - Automatic document retrieval based on user queries
- **Collection Detail Views** - Browse documents, view metadata, and explore collection contents with comprehensive document management
- **Custom Ollama Embeddings** - High-quality nomic-embed-text integration for superior semantic understanding
- **Real-time Context Augmentation** - Retrieved documents automatically enhance AI responses
- **Performance Monitoring** - Detailed metrics for processing time, embedding generation, and storage efficiency
- **Batch Processing** - Efficient handling of large documents with intelligent batching and error recoveryChat Application with Vector Database & Web Search

A sophisticated feature-rich AI chat application built with **Next.js 15**, **Vercel AI SDK v4**, **Ollama**, and **ChromaDB**. Experience intelligent conversations with advanced streaming, comprehensive tool integration, customizable personalities, vector database context management, real-time web search capabilities, and enterprise-grade monitoring.

> **Latest Update:** July 2025 - Now featuring complete ChromaDB vector database integration, SerpAPI web search integration, enhanced multimodal support, 10+ distinct AI personalities, 5 configuration presets, advanced PDF processing, and intelligent context management with semantic search capabilities.

## ✨ Key Features

### 🤖 **AI & Model Management**
- **Multi-Model Support** - Switch between any Ollama models (llama3.2, qwen2.5, mistral, etc.)
- **Tool/Function Calling** - Built-in tools for real-time data (weather, time, calculations)
- **Smart Model Detection** - Automatic tool support detection for each model
- **Advanced Model Configuration** - Fine-tune temperature, context window, token limits, and more
- **Model Presets** - Pre-configured settings for balanced, creative, precise, coding, and analytical tasks
- **Real-time Model Validation** - Continuous checking of model availability and capabilities

### �️ **Vector Database & Context Management**
- **ChromaDB Integration** - Full vector database support with semantic search capabilities
- **Context Window Manager** - Visual interface for managing collections and context data
- **Active Collection System** - Add/remove collections from chat context with real-time indicators
- **Semantic Search Integration** - Automatic document retrieval based on user queries
- **Document Detail View** - Browse and examine documents within collections
- **Custom Embeddings** - Ollama nomic-embed-text integration for high-quality embeddings
- **Real-time Context Augmentation** - Retrieved documents automatically enhance AI responses

### �💬 **Chat Experience**
- **Real-time Streaming** - Smooth, fast responses with the Vercel AI SDK v4
- **File Attachments** - Send images, PDFs, and text files to the AI (multimodal support)
- **Thinking Process Visualization** - See the AI's reasoning with `<think>` tag parsing
- **Tool Execution Display** - Visual feedback for function calls and results
- **Markdown Support** - Rich text rendering with syntax highlighting and code blocks
- **Message History** - Persistent conversation with reset capability
- **Multi-step Conversations** - Tool calls with follow-up responses (MAX_CHAT_STEPS: 5)
- **Request Cancellation** - Stop generation at any time with visual feedback

### 📎 **File Attachments & Multimodal Support**
- **Visual File Upload** - Click the 📎 paperclip icon next to the input field
- **Multiple File Types** - Images (PNG, JPEG, GIF, WebP, BMP), Documents (PDF, TXT, CSV, JSON, DOCX, DOC)
- **File Preview** - Preview attached files before sending with visual indicators
- **Vision-Capable Models** - Automatic image processing for compatible models
- **Drag & Drop** - Easy file attachment with drag and drop support
- **File Management** - Remove files individually or clear all attachments
- **File Size Validation** - Automatic file size formatting and validation

### 🎭 **Personality System**
- **10+ Professionally Crafted Personalities** - Distinct AI characters with unique expertise and communication styles:
  - **Sarah** - Helpful, practical, and reliable general assistant (default)
  - **Marcus** - Logical, systematic programming expert with technical depth  
  - **Emily** - Patient, encouraging educational tutor with gentle guidance
  - **Isabella** - Imaginative, expressive creative writer with artistic flair
  - **Rogger** - Sharp, decisive analytical data expert with insight-driven approach
  - **Dr. Flip** - Brilliant, eccentric scientific inventor with boundless curiosity
  - **Chef Pierre** - Passionate French culinary master with infectious enthusiasm
  - **Grace** - Compassionate, understanding counselor with deep empathy
  - **Dr. Harrison** - PhD-level consultant for industrial risk assessment and due diligence
  - **Vision** - OCR specialist for accurate text extraction from images
  - **Dr. Prometheus** - Expert system prompt engineer and AI instruction designer
- **Custom Personality Creator** - Full-featured UI for creating and managing personalized AI assistants
- **Dynamic Personality Switching** - Change AI behavior and expertise mid-conversation seamlessly
- **Intelligent Categorization** - Organized by General, Technical, Creative, Education, Culinary, Legal, and Support
- **Persistent Personality Memory** - All personality settings and custom creations saved automatically

### 🔧 **Built-in Tools & Function Calling**
- **Real-time Web Search** - Comprehensive web search across Google, Bing, Yahoo, DuckDuckGo, and specialized engines
- **SerpAPI Integration** - Professional search API with support for web, news, images, shopping, academic, and video search
- **Advanced Search Features** - Location-based search, time filtering, safe search, language preferences, and result customization
- **Multi-Engine Support** - Choose from 11 different search engines including Google Scholar, YouTube, and Google Shopping
- **Structured Search Results** - Formatted results with featured snippets, knowledge graphs, related questions, and rich metadata
- **Real-time Clock** - Get current date/time in any timezone with proper formatting and locale support
- **BMI Calculator** - Health calculations with metric/imperial support and comprehensive category classification
- **Weather Service** - Location-based weather information with realistic simulation (demo implementation ready for API integration)
- **Intelligent Tool Detection** - Automatic model capability detection with visual indicators for tool support
- **Visual Tool Execution** - Clear, step-by-step display of tool calls and results with progress indicators
- **Extensible Architecture** - Easy-to-extend framework for adding new tools and capabilities
- **Comprehensive Validation** - Zod schema validation for all tool parameters with user-friendly error messages
- **Tool Toggle Control** - Per-conversation enable/disable with smart model compatibility checking

### ⚙️ **Advanced Configuration & Performance**
- **Precision Model Parameters** - Fine-tune temperature, top-p, top-k, context window, and token limits with real-time validation
- **Professional Configuration Presets** - 5 expertly tuned presets for different use cases:
  - **Balanced** - Optimal blend of creativity and coherence for general conversations
  - **Creative** - High creativity and varied outputs for artistic and brainstorming tasks
  - **Precise** - Focused and deterministic responses for factual and analytical work
  - **Coding** - Optimized parameters for code generation and technical documentation
  - **Analytical** - Structured analytical thinking for data analysis and problem-solving
- **Real-time Health Monitoring** - Comprehensive connection status and diagnostic information with actionable insights
- **Advanced Request Logging** - Detailed logging with unique request IDs for debugging and performance analysis
- **Intelligent Error Handling** - Graceful degradation with detailed error messages and recovery suggestions
- **Performance Optimization** - Token usage tracking, connection pooling, and response time monitoring
- **Validation & Limits** - Real-time parameter validation with helpful error messages and suggested ranges

### 🎨 **Premium User Experience**
- **Modern, Intuitive UI/UX** - Clean, professional interface with smooth animations and micro-interactions
- **Adaptive Dark/Light Mode** - Automatic theme detection with manual toggle and system preference sync
- **Fully Responsive Design** - Perfect experience across desktop, tablet, and mobile with optimized layouts
- **Accessibility First** - Screen reader friendly with proper ARIA labels, keyboard navigation, and contrast compliance
- **Smart Keyboard Shortcuts** - Enter to send, Shift+Enter for new line, Escape to cancel, and more
- **Real-time Connection Status** - Visual indicators for Ollama server connectivity with automatic reconnection
- **Elegant Loading States** - Smooth loading animations, progress indicators, and status feedback
- **Intelligent Error Recovery** - Automatic retry logic with detailed error messages and suggested solutions
- **Performance Optimized** - Fast rendering, efficient memory usage, and optimized for large conversations

## 🆕 Latest Features & Updates (July 2025)

### **Major New Features**
- **🌐 SerpAPI Web Search Integration** - Professional web search with 11 search engines including Google, Bing, Yahoo, DuckDuckGo, YouTube, and specialized engines
- **📄 Advanced PDF Processing** - Streaming PDF upload with real-time progress tracking, intelligent chunking, and automatic embedding generation
- **🗄️ ChromaDB Vector Database Integration** - Complete vector database support with semantic search and context augmentation
- **📊 Visual Context Window Manager** - Intuitive interface for managing document collections and active context
- **🔍 Intelligent Semantic Search** - Automatic document retrieval based on conversation context
- **� Collection Detail Views** - Browse documents, view metadata, and explore collection contents with comprehensive management
- **🎯 Active Collection System** - Real-time visual indicators for context-aware conversations
- **🔗 Custom Ollama Embeddings** - High-quality nomic-embed-text integration for superior semantic understanding
- **📈 Performance Analytics** - Detailed metrics for PDF processing, embedding generation, and search performance

### **Enhanced AI Capabilities**
- **🌐 Real-time Web Search** - Comprehensive web search integration with SerpAPI supporting 11 search engines
- **📄 Advanced Document Processing** - Streaming PDF upload with intelligent chunking and real-time progress tracking
- **⚙️ Configuration Presets** - 5 professionally tuned presets: balanced, creative, precise, coding, analytical
- **🔧 Smart Tool Toggle** - Intelligent tool enable/disable with model capability detection
- **📊 Multi-step Conversations** - Extended tool call sequences (up to 5 steps) for complex problem solving
- **🎭 Advanced Personality System** - 10+ distinct, professionally crafted AI personalities with custom creation support
- **💾 Enhanced Persistence** - All preferences, personalities, and settings automatically saved
- **🔍 Context-Aware Responses** - Automatic document retrieval and integration from vector database collections

### **Improved User Experience**
- **�️ Advanced File Management** - Better preview, validation, and processing for multimodal content
- **� Responsive Design Enhancements** - Optimized interface for all device sizes with improved accessibility
- **⚡ Performance Optimizations** - Faster streaming, better error handling, and enhanced connection monitoring
- **🛡️ Enhanced Security** - Comprehensive input validation, secure file handling, and improved error boundaries
- **📈 Real-time Diagnostics** - Advanced health monitoring with actionable insights and suggestions

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Ollama** - [Install from ollama.ai](https://ollama.ai)
3. **ChromaDB (Optional)** - For vector database functionality
4. **SerpAPI Key (Optional)** - For web search functionality - [Get your key](https://serpapi.com/manage-api-key)
5. **Git** - For cloning the repository

### Installation

1. **Clone and setup:**
   ```bash
   git clone https://github.com/dchpro87/agent01.git
   cd agent01
   npm install
   ```

2. **Install Ollama models:**
   ```bash
   # Recommended starter model (fast, capable)
   ollama pull llama3.2:3b
   
   # For better performance (larger model)
   ollama pull llama3.2:7b
   
   # For coding tasks
   ollama pull qwen2.5-coder:7b
   
   # For embeddings (if using ChromaDB)
   ollama pull nomic-embed-text
   ```

4. **Get your SerpAPI key (Optional - for web search features):**
   - Sign up at [SerpAPI](https://serpapi.com) for web search functionality
   - Get your API key from the [manage API key page](https://serpapi.com/manage-api-key)
   - Add to your environment: `$env:SERP_API_KEY="your_key_here"` (Windows PowerShell)

5. **Setup ChromaDB (Optional - for vector database features):**
   ```bash
   # Install ChromaDB
   pip install chromadb
   
   # Start ChromaDB server
   chroma run --host localhost --port 8000
   ```

6. **Start Ollama server:**
   ```bash
   ollama serve
   ```

7. **Launch the application:**
   ```bash
   npm run dev
   ```

8. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Configuration (Optional)

The application uses **static configuration** in `src/constraints/app-config.ts` for optimal type safety and performance. You can customize settings by editing this file directly, or use environment variables for deployment flexibility:

```typescript
// src/constraints/app-config.ts - Primary configuration method
export const APP_CONFIG: AppConfig = {
  ollama: {
    baseURL: "http://localhost:11434",     // Ollama server endpoint
    model: "llama3.2:3b",                  // Default model selection
    temperature: 0.7,                      // Creativity vs consistency balance
    maxRetries: 2,                         // Retry attempts for failed requests
    defaultOptions: {
      maxTokens: 4096,                     // Response length limit
      numCtx: 4096,                        // Context window size
      // Additional model parameters available
    },
  },
  streaming: {
    timeout: 30000,                        // Request timeout (30 seconds)
    keepAlive: true,                       // Keep connections alive for performance
  },
  logging: {
    enabled: true,                         // Enable comprehensive request logging
    logLevel: "info",                      // Logging verbosity level
  },
  chromadb: {
    baseURL: "http://localhost:8000",      // ChromaDB server endpoint
    timeout: 30000,                        // ChromaDB request timeout
  },
  serpApi: {
    apiKey: process.env.SERP_API_KEY || "", // SerpAPI key for web search
    timeout: 10000,                        // SerpAPI request timeout
  },
};
```

**Environment Variables (Alternative Configuration)**:
```bash
# Core Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434    # Ollama server URL
OLLAMA_MODEL=llama3.2:3b                  # Default model
OLLAMA_TEMPERATURE=0.7                    # Default creativity setting

# Model Parameters
OLLAMA_MAX_TOKENS=4096                    # Default response length
OLLAMA_MAX_RETRIES=2                      # Number of retry attempts
OLLAMA_NUM_CTX=4096                       # Context window size

# Monitoring & Development
AI_LOGGING=true                           # Enable request logging
AI_LOG_LEVEL=info                         # Logging verbosity

# Vector Database Configuration
CHROMADB_URL=http://localhost:8000        # ChromaDB server URL
EMBEDDING_MODEL=nomic-embed-text          # Ollama embedding model

# Web Search Configuration
SERP_API_KEY=your_serpapi_key_here        # SerpAPI key for web search functionality
SERP_API_TIMEOUT=10000                    # SerpAPI request timeout (milliseconds)
```

> **Recommendation**: Use static configuration for development and environment variables for production deployments.

## 📱 Using the Application

## 📱 Using the Application

### 🗄️ **Vector Database & Context Management**
- **One-Click Access**: Click the **🗄️ database icon** in the header to open the intuitive Context Window Manager
- **Automatic ChromaDB Connection**: Seamless connection to localhost:8000 with real-time health monitoring
- **Advanced PDF Processing**: Drag-and-drop PDF upload with streaming progress, intelligent chunking, and automatic embedding generation
- **Visual Collection Browser**: Browse all available vector database collections with metadata and document counts
- **Smart Context Addition**: Click the database icon on collection cards to instantly add them to active context
- **Real-time Active Collections**: See currently active collections with green highlighting and count badges
- **Detailed Document Exploration**: Click collection names to view documents, metadata, and content previews
- **Document Upload Interface**: Upload PDFs directly through the collection detail view with real-time progress tracking
- **Performance Analytics**: Monitor processing time, embedding generation, and storage efficiency metrics
- **Intelligent Semantic Search**: When collections are active, questions automatically trigger relevant document retrieval
- **Context-Enhanced Responses**: AI responses include pertinent information from your active knowledge base
- **Flexible Context Management**: Easy add/remove collections with immediate visual feedback and status updates

### 🤖 **Model Selection & Management**
- **Smart Model Discovery**: Click the **🤖 bot icon** in the header to view all available Ollama models with real-time status
- **Capability Indicators**: Models with tool support display a **🔧 wrench icon** for function calling capabilities
- **Compatibility Warnings**: Models without tool support show a **⚠️ warning icon** with helpful upgrade suggestions
- **Detailed Model Information**: View model size, capabilities, performance indicators, and memory requirements
- **Real-time Availability**: Automatic model availability checking and validation with connection status
- **Intelligent Recommendations**: Model suggestions based on your current task and conversation context

### 🎭 **Personality Selection & Customization**
- **Professional Personality Gallery**: Click the **⚙️ settings icon** to explore 10+ expertly crafted AI personalities:
  - **Sarah** - Reliable general assistant with practical problem-solving approach (default choice)
  - **Marcus** - Expert programming assistant with systematic methodology and technical depth
  - **Emily** - Patient educational tutor with gentle guidance and encouraging teaching style
  - **Isabella** - Creative writing companion with artistic flair and imaginative storytelling
  - **Rogger** - Sharp analytical data expert with decisive insights and data-driven conclusions
  - **Dr. Flip** - Brilliant eccentric scientist with boundless curiosity and innovative thinking
  - **Chef Pierre** - Passionate French culinary master with infectious enthusiasm and cultural expertise
  - **Grace** - Compassionate counselor with deep empathy and understanding communication
  - **Dr. Harrison** - PhD-level consultant for industrial risk assessment and due diligence
  - **Vision** - OCR specialist for accurate text extraction from images
  - **Dr. Prometheus** - Expert system prompt engineer and AI instruction designer
- **Custom Personality Creator**: Use the **+ button** to create personalized AI assistants with custom behavior and expertise
- **Seamless Personality Switching**: Change AI personalities mid-conversation without losing context or history
- **Intelligent Categorization**: Personalities organized by purpose - General, Technical, Creative, Education, Culinary, Legal, Support
- **Persistent Memory**: All personality preferences and custom creations automatically saved for future sessions

### 📎 **File Attachments & Multimodal Support**
- **Intuitive File Upload**: Click the **📎 paperclip icon** next to the input field for easy file attachment
- **Comprehensive Format Support**:
  - **Visual Content**: PNG, JPEG, GIF, WebP, BMP (automatically processed by vision-capable models)
  - **Documents**: PDF, TXT, CSV, JSON, DOCX, DOC (content extracted and analyzed)
  - **Future-Ready**: Extensible architecture for additional file types
- **Advanced Features**:
  - **Visual File Preview**: Preview attached files before sending with file type icons and size information
  - **Flexible Messaging**: Send files with or without accompanying text messages
  - **Granular File Management**: Remove individual files or clear all attachments with one click
  - **Drag & Drop Support**: Intuitive drag and drop interface for effortless file attachment
  - **Smart Processing**: Files automatically processed for multimodal AI models with content extraction
  - **Size Validation**: Automatic file size formatting, validation, and helpful limit suggestions

### ⚙️ **Advanced Model Configuration**
- **Precision Parameter Control**: Click the **⚙️ gear icon** to access professional-grade parameter tuning:
  - **Temperature** - Creativity vs consistency balance (0.0-2.0, default: 0.7) with real-time preview
  - **Max Tokens** - Response length control (1-32,000, default: 4,096) with context awareness
  - **Context Window** - Conversation memory size (1-32,000) with model-specific optimization
  - **Top-P** - Response variety control (0.0-1.0, precision to 1 decimal) for nucleus sampling
  - **Top-K** - Token selection diversity for controlling randomness
  - **Repeat Penalty** - Reduce repetitive responses with intelligent penalty adjustment
- **Professional Configuration Presets** - 5 expertly tuned presets for different scenarios:
  - **Balanced** - Optimal blend of creativity and coherence for general conversations
  - **Creative** - Enhanced creativity and varied outputs for artistic and brainstorming tasks  
  - **Precise** - Focused and deterministic responses for factual and analytical work
  - **Coding** - Optimized parameters for code generation and technical documentation
  - **Analytical** - Structured analytical thinking for data analysis and problem-solving
- **Intelligent Validation**: Real-time parameter validation with helpful error messages and suggested ranges
- **Persistent Configuration**: All settings automatically saved and restored across sessions
- **Model-Specific Optimization**: Parameters automatically adjusted based on selected model capabilities

### 🔧 **Tool Usage & Function Calling**
Experience the power of function calling with intelligent tools that enhance AI capabilities:

- **Real-time Web Search**: 
  - *"Search for the latest AI news"* or *"Find restaurants in Tokyo"* - Uses SerpAPI with 11 search engines
  - Supports Google, Bing, Yahoo, DuckDuckGo, YouTube, Google News, Scholar, Shopping, and Images
  - Location-based search, time filtering, safe search, and result customization options
  - Structured results with featured snippets, knowledge graphs, and related questions

- **Time & Date Queries**: 
  - *"What time is it?"* or *"What time is it in Tokyo?"* - Uses getCurrentTime tool with timezone support and locale formatting
  - Supports all major timezones with automatic daylight saving time detection

- **Health & Fitness Calculations**: 
  - *"What's my BMI if I'm 5'9" and weigh 160 lbs?"* - Uses BMI calculator with metric/imperial conversion
  - Provides category classification (underweight, normal, overweight, obese) with health insights

- **Weather Information**: 
  - *"What's the weather in London?"* - Uses weather service with realistic simulation
  - Demo implementation ready for real API integration with location-based data

- **Advanced Features**:
  - **Visual Tool Execution**: Watch tools work with step-by-step progress indicators and detailed results
  - **Smart Model Detection**: Only tool-compatible models can access functions (automatically detected with visual indicators)
  - **Multi-step Tool Chains**: Complex queries can trigger multiple tool calls in sequence (up to 5 steps)
  - **Error Handling**: Graceful tool failure handling with fallback responses and suggestions
  - **Parameter Validation**: Comprehensive input validation with user-friendly error messages

### 🚀 **Advanced Features & Capabilities**
- **Intelligent Conversation Reset** - Clear chat history with confirmation dialog while preserving settings and preferences
- **Real-time System Monitoring** - Comprehensive connection monitoring with health indicators and diagnostic information
- **Intelligent Error Recovery** - Automatic reconnection and retry logic with detailed error messages and actionable suggestions
- **Thinking Process Visualization** - See AI reasoning process with `<think>` tag parsing and removal for transparent decision-making
- **Rich Markdown Rendering** - Support for text formatting, code blocks, tables, lists, and mathematical expressions
- **Multi-Device Optimization** - Perfectly responsive design optimized for desktop, tablet, and mobile with touch-friendly interfaces
- **Accessibility Excellence** - Screen reader friendly with proper ARIA labels, keyboard navigation, and high contrast support
- **Performance Intelligence** - Request tracking, token usage monitoring, response time analysis, and optimization suggestions
- **Memory Management** - Efficient handling of large conversations with smart context window management
- **Future-Ready Architecture** - Extensible design ready for new AI models, tools, and integration capabilities

## 🏗️ Architecture

### Project Structure
```
agent01/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          # Streaming chat endpoint with multimodal & context support
│   │   │   ├── chromadb/route.ts      # ChromaDB integration API with collection management
│   │   │   ├── embeddings/route.ts    # Ollama embeddings API for vector generation
│   │   │   ├── health/route.ts        # Health monitoring & diagnostics endpoint
│   │   │   ├── models/route.ts        # Model discovery & validation API
│   │   │   ├── cancel-upload/route.ts # File upload cancellation endpoint
│   │   │   └── process-pdf-stream/route.ts # Streaming PDF processing endpoint
│   │   ├── layout.tsx                 # Root layout with theme support & global configuration
│   │   ├── page.tsx                   # Main application page with chat interface
│   │   ├── favicon.ico                # Application favicon
│   │   └── globals.css                # Global styles with Tailwind v4 configuration
│   ├── components/
│   │   ├── Chat.tsx                   # Advanced chat UI with streaming, attachments & context
│   │   ├── CollectionDetail.tsx       # Vector database collection detail view with PDF upload
│   │   ├── ContextWindowManager.tsx   # ChromaDB context management interface with visual feedback
│   │   ├── ModelSelector.tsx          # Model selection with capability indicators & health status
│   │   ├── SystemPromptSelector.tsx   # Personality system with 10+ pre-built & custom prompts
│   │   ├── ModelConfigSelector.tsx    # Advanced parameter configuration with presets
│   │   └── ToolSwitch.tsx             # Tool enable/disable toggle with compatibility checking
│   ├── constraints/
│   │   ├── app-config.ts              # Static application configuration with type safety
│   │   ├── chat-constraints.ts        # Chat-specific constraints & validation rules
│   │   ├── chromadb-constraints.ts    # ChromaDB configuration & defaults
│   │   ├── model-config.ts            # Model configuration presets & parameter ranges
│   │   ├── model-database.ts          # Model capability database & compatibility matrix
│   │   ├── pdf-constraints.ts         # PDF processing configuration & limits
│   │   └── predefined-system-prompts.ts # Built-in personality definitions & categories
│   ├── lib/
│   │   ├── ai-config.ts               # AI configuration utilities & validation helpers
│   │   ├── ai-health.ts               # Health monitoring utilities & diagnostic functions
│   │   ├── ai-middleware.ts           # Request logging, tracking & performance monitoring
│   │   ├── chromadb.ts                # ChromaDB client manager & API interface
│   │   ├── ollama-embedding.ts        # Custom Ollama embedding function for ChromaDB
│   │   ├── pdf-utils.ts               # PDF processing utilities & content extraction
│   │   ├── tools-main.ts              # Main tools configuration and exports
│   │   └── tools/                     # Individual tool implementations
│   │       ├── calculate-bmi.ts       # BMI calculation tool with health insights
│   │       ├── get-current-time.ts    # Time/date tool with timezone support
│   │       ├── get-weather.ts         # Weather information tool (demo)
│   │       ├── search-web.ts          # SerpAPI web search tool with 11 engines
│   │       └── index.ts               # Tools export configuration
│   ├── types/
│   │   ├── app-config.ts              # Application configuration type definitions
│   │   ├── chat.ts                    # Chat-specific type definitions
│   │   ├── index.ts                   # General application type definitions
│   │   ├── ollama.ts                  # Ollama-specific types & model configurations
│   │   ├── pdf-parse.d.ts             # PDF parsing type declarations
│   │   ├── pdf.ts                     # PDF processing type definitions
│   │   └── serpapi.ts                 # SerpAPI response type definitions
│   ├── utils/
│   │   ├── file-utils.tsx             # File handling utilities
│   │   ├── markdown-utils.tsx         # Markdown processing utilities
│   │   ├── pdf-processor.ts           # PDF content processing & extraction utilities
│   │   ├── search-formatter.ts        # SerpAPI response formatting utilities
│   │   ├── server.ts                  # Server-side utilities
│   │   └── text-chunker.ts            # Text chunking utilities for embeddings
│   └── captures/                      # Development screenshots & documentation
│       ├── Capture.PNG                # Application screenshot
│       └── sample.md                  # Sample markdown content
├── public/                            # Static assets & icons
│   ├── file.svg                       # File type icons
│   ├── globe.svg                      # Web/global icons
│   ├── next.svg                       # Next.js branding
│   ├── ollama.svg                     # Ollama branding
│   ├── vercel.svg                     # Vercel branding
│   └── window.svg                     # UI element icons
├── docs/                              # Comprehensive documentation
│   ├── AI_SDK_IMPLEMENTATION.md       # Technical implementation details & patterns
│   ├── CHROMADB_CONTEXT_IMPLEMENTATION.md # Context system implementation guide
│   └── SERPAPI_WEB_SEARCH.md          # SerpAPI web search integration guide
├── package.json                       # Dependencies, scripts & project metadata
├── next.config.ts                     # Next.js configuration with optimizations
├── eslint.config.mjs                  # ESLint configuration with modern rules
├── postcss.config.mjs                 # PostCSS configuration for Tailwind
├── tailwind.config.ts                 # Tailwind CSS configuration with custom theme
├── tsconfig.json                      # TypeScript configuration with strict settings
├── tsconfig.tsbuildinfo               # TypeScript build cache
├── next-env.d.ts                      # Next.js type declarations
└── README.md                          # This comprehensive documentation
```

### Key Technologies

#### **Frontend Stack**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety throughout
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Modern utility-first styling
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icons

#### **Core Production Dependencies**
```json
{
  "@ai-sdk/openai": "^1.3.22",          // OpenAI provider for Ollama compatibility
  "@ai-sdk/react": "^1.2.12",           // React hooks for AI SDK integration
  "ai": "^4.3.16",                       // Core AI SDK v4 with streaming support
  "chromadb": "^3.0.6",                 // ChromaDB JavaScript client for vector database
  "@chroma-core/default-embed": "^0.1.8", // Default embedding functions for ChromaDB
  "serpapi": "^2.1.0",                  // SerpAPI for comprehensive web search capabilities
  "sharp": "^0.34.3",                   // High-performance image processing library
  "next": "15.3.4",                      // Next.js 15 with App Router and React 19
  "react": "^19.0.0",                    // Latest React with concurrent features
  "react-dom": "^19.0.0",               // React DOM with improved hydration
  "ollama-ai-provider": "^1.2.0",       // Ollama integration provider for AI SDK
  "react-markdown": "^10.1.0",          // Markdown rendering with GFM support
  "rehype-highlight": "^7.0.2",         // Code syntax highlighting for markdown
  "remark-gfm": "^4.0.1",               // GitHub Flavored Markdown support
  "zod": "^3.25.67",                     // Runtime type validation and schema validation
  "lucide-react": "^0.523.0",           // Modern icon library with 1000+ icons
  "pdf-parse": "^1.1.1"                 // PDF content extraction for document processing
}
```

#### **Development Dependencies**
```json
{
  "@eslint/eslintrc": "^3",              // ESLint configuration utilities
  "@tailwindcss/postcss": "^4",         // PostCSS plugin for Tailwind CSS v4
  "@types/node": "^20",                  // Node.js type definitions
  "@types/react": "^19",                 // React type definitions for TypeScript
  "@types/react-dom": "^19",             // React DOM type definitions
  "eslint": "^9",                        // Latest ESLint with modern rules
  "eslint-config-next": "15.3.4",       // Next.js optimized ESLint configuration
  "tailwindcss": "^4",                   // Tailwind CSS v4 with enhanced performance
  "typescript": "^5"                     // TypeScript 5 with enhanced type safety
}
```

### Core Features Implementation

#### **Streaming Chat System**
- Real-time message streaming with `streamText()`
- Proper error handling and recovery
- Request cancellation support
- Token usage tracking

#### **Tool Integration**
- Function calling with parameter validation
- Tool result visualization
- Model capability detection
- Extensible tool architecture

#### **Vector Database Integration**
- ChromaDB client management and connection handling
- Semantic search and document retrieval
- Collection browsing and document detail views
- Context augmentation with relevant documents
- Custom embedding function with Ollama nomic-embed-text
- Real-time context indicators and active collection management

#### **State Management**
- React hooks for local state
- LocalStorage persistence for preferences
- Real-time connection monitoring
- Optimistic UI updates

#### **Configuration System**
- Environment-based configuration
- Runtime validation with Zod schemas
- Hot-reloading of model parameters
- Centralized error handling

## 🛠️ Development

### Available Scripts

```bash
# Core Development Commands
npm run dev          # Start development server with hot reload
npm run build        # Build optimized production bundle
npm run start        # Start production server
npm run lint         # Run ESLint code analysis with modern rules

# Utility Commands
npm run check-ollama # Check Ollama connection and available models

# API Testing Commands (when services are running)
# Test ChromaDB health and connection
curl "http://localhost:3000/api/chromadb?action=health"

# Test embeddings generation with Ollama
curl "http://localhost:3000/api/embeddings?action=test"

# Check application health status
curl "http://localhost:3000/api/health"

# Test model availability
curl "http://localhost:3000/api/models"
```

### Adding New Tools

Create new tools in the `src/lib/tools/` directory and update the exports:

```typescript
// src/lib/tools/my-new-tool.ts
import { z } from "zod";

export const myNewTool = {
  description: "Description of what your tool does",
  parameters: z.object({
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().describe("Optional parameter"),
  }),
  execute: async ({ param1, param2 }) => {
    // Your tool implementation
    return "Tool result";
  },
};
```

Then update `src/lib/tools/index.ts`:
```typescript
export { myNewTool } from "./my-new-tool";
```

And add to `src/lib/tools-main.ts`:
```typescript
import { myNewTool } from "./tools";

export const tools = {
  // existing tools...
  myNewTool,
};
```

### Adding New Personalities

Add to `PREDEFINED_PROMPTS` in `src/constraints/predefined-system-prompts.ts`:

```typescript
{
  id: "unique-id",
  name: "Personality Name", 
  description: "Brief description of the personality",
  prompt: "Detailed system prompt that defines the AI's behavior, tone, and expertise...",
  icon: YourIcon, // From lucide-react (Bot, User, Code, BookOpen, etc.)
  category: "Category", // General, Technical, Creative, Education, Culinary, Legal, Support
}
```

### Custom Personality Creation
Users can also create custom personalities through the UI:
- Click the settings icon in the header
- Select "Create Custom Prompt"
- Fill in name, description, and detailed prompt
- Custom prompts are automatically saved to localStorage
- Edit or delete custom prompts as needed

### Environment Variables

Configuration is managed through `src/constraints/app-config.ts`. For environment-based configuration, you can use these variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Default model |
| `OLLAMA_TEMPERATURE` | `0.7` | Default creativity setting |
| `OLLAMA_MAX_TOKENS` | `4096` | Default response length |
| `OLLAMA_MAX_RETRIES` | `2` | Number of retry attempts |
| `AI_LOGGING` | `true` | Enable request logging |
| `AI_LOG_LEVEL` | `info` | Logging verbosity |
| `CHROMADB_URL` | `http://localhost:8000` | ChromaDB server URL |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Ollama embedding model |
| `SERP_API_KEY` | `""` | SerpAPI key for web search |

**Note:** The application primarily uses static configuration in `app-config.ts` for better type safety and validation.

### Troubleshooting

#### **Ollama Connection Issues**
```bash
# Check if Ollama is running and accessible
curl http://localhost:11434/api/tags

# Restart Ollama service (if needed)
ollama serve

# Verify Ollama installation
ollama --version

# Check available models
ollama list
```

#### **Model Not Found Errors**
```bash
# List currently available models
ollama list

# Pull the specific model you need
ollama pull llama3.2:3b
ollama pull qwen2.5:7b
ollama pull nomic-embed-text  # For embeddings

# Remove and re-pull if model is corrupted
ollama rm model-name
ollama pull model-name
```

#### **Tool Support & Compatibility Issues**
- **Small models** (1B parameters) typically don't support function calling
- **Recommended tool-compatible models**: `llama3.2:3b`, `qwen2.5:7b`, `mistral:7b`, `gemma2:9b`
- Check the model info in the UI for tool support indicators (🔧 = supported, ⚠️ = not supported)
- The app automatically detects tool capabilities and displays warnings

#### **SerpAPI Web Search Issues**
```bash
# Check if SerpAPI key is configured
echo $SERP_API_KEY  # Unix/Linux/macOS
echo $env:SERP_API_KEY  # Windows PowerShell

# Test SerpAPI directly
curl "https://serpapi.com/search.json?q=test&api_key=YOUR_KEY"

# Test through the application API
curl "http://localhost:3000/api/chat" -X POST -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"search for current AI news"}]}'
```
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Start ChromaDB server (Python installation required)
pip install chromadb
chroma run --host localhost --port 8000

# Alternative: Docker installation
docker run -p 8000:8000 chromadb/chroma

# Check ChromaDB version
python -c "import chromadb; print(chromadb.__version__)"
```

#### **ChromaDB Vector Database Issues**
```bash
# Ensure embedding model is available in Ollama
ollama pull nomic-embed-text

# Test embedding generation via API
curl "http://localhost:3000/api/embeddings?action=test"

# Check ChromaDB collections
curl "http://localhost:3000/api/chromadb?action=collections"

# Verify embedding dimensions match (nomic-embed-text uses 768 dimensions)
```

#### **Embedding & Semantic Search Issues**
- **Reduce context window** for faster responses (lower memory usage)
- **Lower temperature** (0.3-0.5) for more consistent outputs
#### **Performance & Memory Issues**
- **Reduce context window** for faster responses (lower memory usage)
- **Lower temperature** (0.3-0.5) for more consistent outputs
- **Adjust max tokens** to control response length and processing time
- **Consider model size vs performance trade-offs** (3B vs 7B vs 13B models)
- **Monitor system resources** when running multiple models simultaneously

#### **PDF Processing & Upload Issues**
- **Supported file types**: Images (PNG, JPEG, GIF, WebP, BMP), Documents (PDF, TXT, CSV, JSON, DOCX, DOC)
- **File size limits**: Check browser and server limits for large files
- **Vision model requirements**: Use vision-capable models for image processing
- **PDF processing**: Ensure `pdf-parse` dependency is properly installed
- **Streaming PDF upload**: Monitor progress in the collection detail view for large documents
- **ChromaDB integration**: Ensure ChromaDB is running before uploading PDFs to collections

#### **Application Startup Issues**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run lint

# Verify all dependencies are installed
npm ls
```

## 🚀 Deployment

### Production Deployment

#### **Vercel (Recommended)**
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect repository to [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on each push

#### **Docker Deployment**
```bash
# Build the application
npm run build

# Create Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./.next
COPY public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

#### **Self-Hosted**
```bash
# Build for production
npm run build

# Start production server
npm start

# Or with PM2 for process management
npm install -g pm2
pm2 start npm --name "agent01" -- start
```

### Ollama Deployment Considerations

#### **Local Development**
- Ollama runs on `localhost:11434`
- Models stored locally
- No external dependencies

#### **Production Deployment**
- Deploy Ollama on a separate server/container
- Update `OLLAMA_BASE_URL` to point to your Ollama instance
- Ensure network connectivity between app and Ollama
- Consider GPU requirements for larger models

#### **Cloud Ollama & ChromaDB Setup**
```bash
# Example: AWS EC2 with GPU for Ollama
# 1. Launch GPU-enabled instance (g4dn.xlarge or better)
# 2. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 3. Pull your models
ollama pull llama3.2:3b
ollama pull qwen2.5:7b
ollama pull nomic-embed-text

# 4. Start Ollama service
systemctl enable ollama
systemctl start ollama

# 5. Install and start ChromaDB
pip install chromadb
chroma run --host 0.0.0.0 --port 8000

# 6. Configure firewall
ufw allow 11434  # Ollama
ufw allow 8000   # ChromaDB
```

### Environment Configuration for Production

```bash
# .env.production
OLLAMA_BASE_URL=https://your-ollama-server.com:11434
OLLAMA_MODEL=llama3.2:7b
OLLAMA_TEMPERATURE=0.7
AI_LOGGING=true
AI_LOG_LEVEL=warn

# ChromaDB Configuration
CHROMADB_URL=https://your-chromadb-server.com:8000
EMBEDDING_MODEL=nomic-embed-text
```

## 📊 Monitoring & Analytics

### Built-in Monitoring
- **Health Checks** - `/api/health` endpoint
- **Request Logging** - Comprehensive request/response tracking
- **Error Tracking** - Detailed error logs with context
- **Performance Metrics** - Token usage and response times

### Production Monitoring
- Set up monitoring for the `/api/health` endpoint
- Monitor Ollama server resource usage
- Track response times and error rates
- Consider integrating with services like DataDog, New Relic, or Sentry

## 🤝 Contributing

We welcome contributions that enhance the application's capabilities and user experience!

### Development Setup
1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `npm install`
4. **Start development server**: `npm run dev`
5. **Start required services**:
   ```bash
   # Start Ollama
   ollama serve
   
   # Start ChromaDB (optional)
   chroma run --host localhost --port 8000
   ```
6. **Make your changes** and test thoroughly
7. **Commit changes**: `git commit -m 'Add amazing feature'`
8. **Push to your fork**: `git push origin feature/amazing-feature`
9. **Create a Pull Request** with detailed description

### Contribution Guidelines
- **Follow TypeScript best practices** with strict type checking
- **Add comprehensive tests** for new features and bug fixes
- **Update documentation** as needed (README, code comments, /docs folder)
- **Ensure code passes** ESLint checks (`npm run lint`)
- **Test with multiple Ollama models** to ensure compatibility
- **Consider accessibility** in all UI changes (ARIA labels, keyboard navigation)
- **Follow semantic commit messages** for clear history

### Priority Areas for Contribution
- **🌐 Web Search Enhancements** - Improve SerpAPI integration, add more search engines, enhance result formatting
- **🔧 New Tools & Integrations** - Add useful function calling tools (API integrations, calculations, data processing)
- **📄 Document Processing** - Improve PDF, DOCX, and other document format support with better chunking strategies
- **🎨 UI/UX Improvements** - Enhance the user interface, animations, and user experience
- **🤖 AI Model Support** - Add support for new AI providers (OpenAI, Anthropic, Google, etc.)
- **⚡ Performance Optimization** - Optimize streaming, rendering, memory usage, and response times
- **📚 Documentation & Examples** - Improve guides, tutorials, and usage examples
- **🧪 Testing & Quality** - Add comprehensive test coverage (unit, integration, e2e)
- **🗄️ ChromaDB Features** - Enhance vector database functionality, collection management, search
- **🔗 Embedding Models** - Add support for additional embedding providers and models
- **🌐 Internationalization** - Add multi-language support and localization
- **♿ Accessibility** - Enhance screen reader support and keyboard navigation
- **🔒 Security** - Improve input validation, sanitization, and secure practices

### Code Style & Standards
- Use **TypeScript** for all new code with proper type definitions
- Follow **React 19** best practices with functional components and hooks
- Use **Tailwind CSS** for styling with consistent design patterns
- Implement **Zod schemas** for all validation and type safety
- Add **JSDoc comments** for complex functions and components
- Follow **Next.js 15** conventions for API routes and components

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Vercel](https://vercel.com)** for the excellent AI SDK
- **[Ollama](https://ollama.ai)** for making local AI accessible
- **[SerpAPI](https://serpapi.com)** for comprehensive web search capabilities
- **[ChromaDB](https://trychroma.com)** for powerful vector database functionality
- **[Next.js](https://nextjs.org)** for the amazing React framework
- **[Tailwind CSS](https://tailwindcss.com)** for beautiful, responsive styling
- **The open-source community** for inspiration and contributions

## 📞 Support & Resources

### Getting Help
- **📋 Issues** - [GitHub Issues](https://github.com/dchpro87/agent01/issues) for bug reports and feature requests
- **💬 Discussions** - [GitHub Discussions](https://github.com/dchpro87/agent01/discussions) for questions and community support
- **📖 Documentation** - Check `/docs` folder for detailed technical guides and implementation details
- **🦙 Ollama Help** - [Ollama Documentation](https://ollama.ai/docs) for model setup and configuration
- **🗄️ ChromaDB Support** - [ChromaDB Documentation](https://docs.trychroma.com/) for vector database questions

### External Resources
- **[Vercel AI SDK Documentation](https://sdk.vercel.ai/)** - Official AI SDK guides and API reference
- **[Next.js 15 Documentation](https://nextjs.org/docs)** - Framework documentation and best practices  
- **[React 19 Documentation](https://react.dev/)** - Latest React features and patterns
- **[Tailwind CSS Documentation](https://tailwindcss.com/docs)** - Styling framework and utility classes
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - Type safety and advanced TypeScript features

### Community & Updates
- **⭐ Star this repository** if you find it helpful!
- **🔔 Watch** for updates and new releases
- **🍴 Fork** to create your own customized version
- **🐛 Report bugs** to help improve the application
- **💡 Suggest features** for future development

---

**Built with ❤️ by [dchpro87](https://github.com/dchpro87)**

*Experience the future of AI-powered conversations with advanced context understanding and intelligent tool integration.*
