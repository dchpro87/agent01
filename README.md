# Agent01 - Advanced AI Chat Application

A sophisticated### ⚙️ **Advanced Configuration**
- **Model Parameters** - Adjust temperature, top-p, top-k, context window, token limits
- **Configuration Presets** - 5 built-in presets (balanced, creative, precise, coding, analytical)
- **Real-time Health Monitoring** - Connection status and diagnostic information
- **Request Logging** - Comprehensive logging with request tracking
- **Error Handling** - Graceful degradation and detailed error messages
- **Tool Toggle** - Enable/disable tools per conversation
- **Validation & Limits** - Real-time parameter validation with helpful error messagesture-rich AI chat application built with Next.js 15, Vercel AI SDK v4, and Ollama. Experience intelligent conversations with advanced streaming, tool integration, customizable personalities, and enterprise-grade monitoring.

## ✨ Key Features

### 🤖 **AI & Model Management**
- **Multi-Model Support** - Switch between any Ollama models (llama3.2, qwen2.5, mistral, etc.)
- **Tool/Function Calling** - Built-in tools for real-time data (weather, time, calculations)
- **Smart Model Detection** - Automatic tool support detection for each model
- **Advanced Model Configuration** - Fine-tune temperature, context window, token limits, and more
- **Model Presets** - Pre-configured settings for balanced, creative, precise, coding, and analytical tasks
- **Real-time Model Validation** - Continuous checking of model availability and capabilities

### 💬 **Chat Experience**
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
- **8 Pre-built Personalities** - Distinct AI personalities with unique traits:
  - **Sarah** - Helpful, practical, and reliable general assistant (default)
  - **Marcus** - Logical, systematic programming expert  
  - **Emily** - Patient, encouraging educational tutor
  - **Isabella** - Imaginative, expressive creative writer
  - **Rogger** - Sharp, decisive analytical data expert
  - **Dr. Flip** - Brilliant, eccentric scientific inventor
  - **Chef Pierre** - Passionate French culinary master
  - **Grace** - Compassionate, understanding counselor
- **Custom System Prompts** - Create and save your own AI personalities
- **Dynamic Prompt Management** - Switch personalities mid-conversation
- **Categorized Prompts** - Organized by General, Technical, Creative, Education, Culinary, and Support
- **Persistent Preferences** - All personality settings saved to localStorage

### 🔧 **Built-in Tools**
- **Real-time Clock** - Get current date/time in any timezone with proper formatting
- **BMI Calculator** - Health calculations with metric/imperial support and category classification
- **Weather Service** - Location-based weather information with realistic simulation (demo implementation)
- **Tool Detection** - Automatic model capability detection for tool support
- **Visual Feedback** - Clear display of tool execution and results with step-by-step progress
- **Extensible Architecture** - Easy to add new tools and capabilities
- **Parameter Validation** - Comprehensive input validation with Zod schemas

### �️ **Advanced Configuration**
- **Model Parameters** - Adjust temperature, top-p, top-k, context window, token limits
- **Real-time Health Monitoring** - Connection status and diagnostic information
- **Request Logging** - Comprehensive logging with request tracking
- **Error Handling** - Graceful degradation and detailed error messages

### 🎨 **User Experience**
- **Modern UI/UX** - Clean, intuitive interface with smooth animations
- **Dark/Light Mode** - Automatic theme detection and manual toggle
- **Responsive Design** - Perfect experience on desktop, tablet, and mobile
- **Accessibility** - Screen reader friendly with proper ARIA labels
- **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line
- **Connection Status** - Visual indicators for Ollama server connectivity
- **Loading States** - Smooth loading animations and progress indicators
- **Error Recovery** - Automatic retry logic and detailed error messages

## 🆕 Latest Features & Updates (July 2025)

### **Recent Enhancements**
- **🎭 Enhanced Personality System** - Added "Rogger" the analytical expert, replacing David
- **⚙️ Configuration Presets** - 5 built-in presets: balanced, creative, precise, coding, analytical
- **🔧 Tool Toggle Control** - Enable/disable tools per conversation with visual indicators
- **📊 Multi-step Conversations** - Extended tool sequences (MAX_CHAT_STEPS: 5) for complex tasks
- **🔒 Static Configuration** - Type-safe configuration in `app-config.ts` with validation
- **📁 File Management** - Improved file size validation and preview functionality
- **🏗️ Architecture Improvements** - Better organization with dedicated constants folder

### **Performance & Reliability**
- **⚡ Optimized Streaming** - Enhanced request headers and performance monitoring
- **🛡️ Error Handling** - Comprehensive error recovery with actionable suggestions
- **📈 Request Tracking** - Detailed logging with unique request IDs
- **🔄 Connection Monitoring** - Real-time Ollama server health checking
- **✅ Validation** - Runtime parameter validation with user-friendly messages

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Ollama** - [Install from ollama.ai](https://ollama.ai)
3. **Git** - For cloning the repository

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
   ```

3. **Start Ollama server:**
   ```bash
   ollama serve
   ```

4. **Launch the application:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Configuration (Optional)

The application uses static configuration in `src/constants/app-config.ts`. You can customize settings by editing this file:

```typescript
// Example configuration
export const APP_CONFIG: AppConfig = {
  ollama: {
    baseURL: "http://localhost:11434",     // Change to your Ollama server
    model: "llama3.2:3b",                  // Default model
    temperature: 0.7,                      // Default creativity
    maxRetries: 2,                         // Retry attempts
    defaultOptions: {
      maxTokens: 4096,                     // Default response length
      // ... other model parameters
    },
  },
  streaming: {
    timeout: 30000,                        // 30 second timeout
    keepAlive: true,                       // Keep connections alive
  },
  logging: {
    enabled: true,                         // Enable request logging
    logLevel: "info",                      // Log level
  },
};
```

Alternatively, create a `.env.local` file for environment-based configuration:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TEMPERATURE=0.7

# Model Parameters
OLLAMA_MAX_TOKENS=4096
OLLAMA_MAX_RETRIES=2

# Monitoring
AI_LOGGING=true
AI_LOG_LEVEL=info
```

## 📱 Using the Application

### Model Selection
- Click the **🤖 bot icon** in the header to select from available Ollama models
- Models with tool support show a **🔧 wrench icon** for function calling capabilities
- Models without tool support show a **⚠️ warning icon** 
- Model information includes size, capabilities, and performance indicators
- Real-time model availability checking and validation

### Personality Selection
- Click the **⚙️ settings icon** to choose from 8 unique AI personalities:
  - **Sarah** - Helpful and reliable general assistant (default)
  - **Marcus** - Expert programming assistant with systematic approach
  - **Emily** - Patient educational tutor with gentle guidance
  - **Isabella** - Creative writing companion with artistic flair
  - **Rogger** - Sharp analytical data expert with decisive insights
  - **Dr. Flip** - Brilliant eccentric scientist with boundless curiosity
  - **Chef Pierre** - Passionate French culinary master with infectious enthusiasm
  - **Grace** - Compassionate counselor with deep empathy
- Create custom personalities with the **+ button** and save them for future use
- Switch personalities seamlessly during conversations

### File Attachments
- Click the **📎 paperclip icon** next to the input field to attach files
- **Supported formats:**
  - **Images:** PNG, JPEG, GIF, WebP, BMP (for vision-capable models)
  - **Documents:** PDF, TXT, CSV, JSON, DOCX, DOC
- **Features:**
  - Preview attached files before sending with file type icons
  - Send files with or without accompanying text
  - Remove individual files or clear all attachments
  - Drag & drop support for easy file attachment
  - Files are automatically processed for multimodal AI models

### Model Configuration
- Click the **⚙️ gear icon** to adjust advanced parameters:
  - **Temperature** - Creativity vs consistency (0.0-2.0, default: 0.7)
  - **Max Tokens** - Response length limit (1-32,000, default: 4,096)
  - **Context Window** - Conversation memory size (1-32,000)
  - **Top-P** - Response variety control (0.0-1.0, precision to 1 decimal)
  - **Top-K** - Token selection diversity
  - **Repeat Penalty** - Reduce repetitive responses
- **Configuration Presets** - 5 built-in presets for different use cases:
  - **Balanced** - Optimal balance of creativity and coherence
  - **Creative** - High creativity and varied outputs
  - **Precise** - Focused and deterministic responses
  - **Coding** - Optimized for code generation
  - **Analytical** - Structured analytical thinking
- Real-time validation with helpful error messages
- Settings persist across sessions

### Tool Usage
Ask questions that require real-time data and watch the AI use tools:
- *"What time is it?"* or *"What time is it in Tokyo?"* - Uses getCurrentTime tool with timezone support
- *"What's my BMI if I'm 5'9" and weigh 160 lbs?"* - Uses BMI calculator with unit conversion
- *"What's the weather in London?"* - Uses weather service with simulated realistic data
- Tools display execution details and results visually in the chat
- Only compatible models can use tools (automatically detected)

### Advanced Features
- **Reset Conversation** - Clear chat history anytime with confirmation dialog
- **Real-time Status** - Connection monitoring in header with health indicators
- **Error Recovery** - Automatic reconnection and retry logic with detailed error messages
- **Thinking Visualization** - See AI reasoning process with `<think>` tag parsing and removal
- **Markdown Rendering** - Rich text, code blocks, tables, and mathematical expressions
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Accessibility** - Screen reader friendly with proper ARIA labels and keyboard navigation
- **Performance Monitoring** - Request tracking, token usage, and response time logging

## 🏗️ Architecture

### Project Structure
```
agent01/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          # Streaming chat endpoint with tool support
│   │   │   ├── health/route.ts        # Health monitoring & diagnostics
│   │   │   └── models/route.ts        # Model discovery & validation
│   │   ├── layout.tsx                 # Root layout with theme support
│   │   ├── page.tsx                   # Main application page
│   │   └── globals.css                # Global styles & Tailwind
│   ├── components/
│   │   ├── Chat.tsx                   # Main chat interface with streaming
│   │   ├── ModelSelector.tsx          # Model selection dropdown
│   │   ├── SystemPromptSelector.tsx   # Personality management
│   │   ├── ModelConfigSelector.tsx    # Parameter configuration
│   │   └── ToolSwitch.tsx             # Tool enable/disable toggle
│   ├── constants/
│   │   ├── app-config.ts              # Application configuration
│   │   ├── chat-constants.ts          # Chat-specific constants
│   │   ├── model-config.ts            # Model configuration presets
│   │   └── predefined-system-prompts.ts # Built-in personalities
│   ├── lib/
│   │   ├── ai-config.ts               # AI configuration utilities
│   │   ├── ai-health.ts               # Health monitoring utilities
│   │   ├── ai-middleware.ts           # Request logging & tracking
│   │   └── tools.ts                   # Built-in tool definitions
│   ├── types/
│   │   ├── index.ts                   # General type definitions
│   │   └── ollama.ts                  # Ollama-specific types
│   └── utils/                         # Utility functions
├── public/                            # Static assets
├── docs/
│   └── AI_SDK_IMPLEMENTATION.md       # Technical implementation details
├── package.json                       # Dependencies & scripts
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
└── tsconfig.json                      # TypeScript configuration
```

### Key Technologies

#### **Frontend Stack**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety throughout
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Modern utility-first styling
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icons

#### **AI Integration**
- **[Vercel AI SDK v4.3.16](https://sdk.vercel.ai/)** - Streaming AI responses with tool integration
- **[Ollama AI Provider v1.2.0](https://ollama.ai/)** - Local LLM inference engine
- **[React Markdown v10.1.0](https://github.com/remarkjs/react-markdown)** - Rich text rendering with GFM support
- **[Rehype Highlight v7.0.2](https://github.com/rehypejs/rehype-highlight)** - Code syntax highlighting
- **[Zod v3.25.67](https://zod.dev/)** - Runtime type validation and schema validation

#### **Development Tools**
- **[ESLint 9](https://eslint.org/)** - Modern code linting with updated configuration
- **[PostCSS](https://postcss.org/)** - CSS processing pipeline with Tailwind
- **[TypeScript 5](https://www.typescriptlang.org/)** - Latest TypeScript with enhanced type safety
- **VS Code Integration** - Optimized development experience with proper task configuration

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
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint code analysis

# Utilities
npm run check-ollama # Check Ollama connection and models
```

### Adding New Tools

Create new tools in `src/lib/tools.ts`:

```typescript
export const tools = {
  // Existing tools...
  
  myNewTool: {
    description: "Description of what your tool does",
    parameters: z.object({
      param1: z.string().describe("Parameter description"),
      param2: z.number().optional().describe("Optional parameter"),
    }),
    execute: async ({ param1, param2 }) => {
      // Your tool implementation
      return "Tool result";
    },
  },
};
```

### Adding New Personalities

Add to `PREDEFINED_PROMPTS` in `src/components/SystemPromptSelector.tsx`:

```typescript
{
  id: "unique-id",
  name: "Personality Name", 
  description: "Brief description of the personality",
  prompt: "Detailed system prompt that defines the AI's behavior, tone, and expertise...",
  icon: YourIcon, // From lucide-react (Bot, User, Code, BookOpen, etc.)
  category: "Category", // General, Technical, Creative, Education, Culinary, Support
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

Configuration is managed through `src/constants/app-config.ts`. For environment-based configuration, you can use these variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Default model |
| `OLLAMA_TEMPERATURE` | `0.7` | Default creativity setting |
| `OLLAMA_MAX_TOKENS` | `4096` | Default response length |
| `OLLAMA_MAX_RETRIES` | `2` | Number of retry attempts |
| `AI_LOGGING` | `true` | Enable request logging |
| `AI_LOG_LEVEL` | `info` | Logging verbosity |

**Note:** The application primarily uses static configuration in `app-config.ts` for better type safety and validation.

### Troubleshooting

#### **Ollama Connection Issues**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
ollama serve

# Pull missing model
ollama pull llama3.2:3b
```

#### **Model Not Found**
```bash
# List available models
ollama list

# Pull the specific model you need
ollama pull model-name
```

#### **Tool Support Issues**
- Small models (1B parameters) typically don't support tools
- Use models like `llama3.2:3b`, `qwen2.5:7b`, or `mistral:7b`
- Check the model info in the UI for tool support indicators

#### **Performance Optimization**
- Use smaller context windows for faster responses
- Lower temperature for more consistent outputs
- Adjust `num_predict` to control response length
- Consider model size vs. performance trade-offs

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

#### **Cloud Ollama Setup**
```bash
# Example: AWS EC2 with GPU
# 1. Launch GPU-enabled instance (g4dn.xlarge or better)
# 2. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 3. Pull your models
ollama pull llama3.2:3b
ollama pull qwen2.5:7b

# 4. Start Ollama service
systemctl enable ollama
systemctl start ollama

# 5. Configure firewall
ufw allow 11434
```

### Environment Configuration for Production

```bash
# .env.production
OLLAMA_BASE_URL=https://your-ollama-server.com:11434
OLLAMA_MODEL=llama3.2:7b
OLLAMA_TEMPERATURE=0.7
AI_LOGGING=true
AI_LOG_LEVEL=warn
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

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Make your changes and test thoroughly
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Create a Pull Request

### Contribution Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Ensure code passes ESLint checks
- Test with multiple Ollama models
- Consider accessibility in UI changes

### Areas for Contribution
- **New Tools** - Add useful function calling tools
- **UI/UX Improvements** - Enhance the user interface
- **Model Support** - Add support for new AI providers
- **Performance** - Optimize streaming and rendering
- **Documentation** - Improve guides and examples
- **Testing** - Add comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Vercel](https://vercel.com)** for the excellent AI SDK
- **[Ollama](https://ollama.ai)** for making local AI accessible
- **[Next.js](https://nextjs.org)** for the amazing React framework
- **[Tailwind CSS](https://tailwindcss.com)** for beautiful, responsive styling
- **The open-source community** for inspiration and contributions

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/dchpro87/agent01/issues)
- **Discussions** - [GitHub Discussions](https://github.com/dchpro87/agent01/discussions)
- **Documentation** - Check `/docs` folder for detailed guides
- **Ollama Help** - [Ollama Documentation](https://ollama.ai/docs)

---

**Built with ❤️ by [dchpro87](https://github.com/dchpro87)**

*Star ⭐ this repo if you find it helpful!*
