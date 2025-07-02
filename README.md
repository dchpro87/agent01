# Agent01 - Advanced AI Chat Application

A sophisticated, feature-rich AI chat application built with Next.js 15, Vercel AI SDK, and Ollama. Experience intelligent conversations with advanced streaming, tool integration, customizable personalities, and enterprise-grade monitoring.

## ✨ Key Features

### 🤖 **AI & Model Management**
- **Multi-Model Support** - Switch between any Ollama models (llama3.2, qwen2.5, mistral, etc.)
- **Tool/Function Calling** - Built-in tools for real-time data (weather, time, calculations)
- **Smart Model Detection** - Automatic tool support detection for each model
- **Advanced Model Configuration** - Fine-tune temperature, context window, token limits, and more

### 💬 **Chat Experience**
- **Real-time Streaming** - Smooth, fast responses with the Vercel AI SDK
- **Thinking Process Visualization** - See the AI's reasoning with `<think>` tag parsing
- **Tool Execution Display** - Visual feedback for function calls and results
- **Markdown Support** - Rich text rendering with syntax highlighting
- **Message History** - Persistent conversation with reset capability

### 🎭 **Personality System**
- **Pre-built Personalities** - Sarah (helpful), Marcus (coding), Emily (teacher), Chef Pierre (culinary), Dr. Flip (scientist), and more
- **Custom System Prompts** - Create and save your own AI personalities
- **Dynamic Prompt Management** - Switch personalities mid-conversation
- **Categorized Prompts** - Organized by General, Technical, Creative, Education, etc.

### 🔧 **Built-in Tools**
- **Real-time Clock** - Get current date/time in any timezone
- **BMI Calculator** - Health calculations with metric/imperial support
- **Weather Service** - Location-based weather information (demo implementation)
- **Extensible Architecture** - Easy to add new tools and capabilities

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

Create a `.env.local` file to customize settings:

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
- Click the **bot icon** in the header to select from available Ollama models
- Models with tool support show a **🔧 wrench icon**
- Models without tool support show a **⚠️ warning icon**
- Model information includes size and capabilities

### Personality Selection
- Click the **settings icon** to choose AI personalities:
  - **Sarah** - Helpful and reliable general assistant
  - **Marcus** - Expert programming assistant
  - **Emily** - Patient educational tutor
  - **Chef Pierre** - Passionate French culinary expert
  - **Dr. Flip** - Brilliant eccentric scientist
  - **Isabella** - Creative writing companion
  - **Grace** - Compassionate counselor
- Create custom personalities with the **+ button**

### Model Configuration
- Click the **gear icon** to adjust:
  - **Temperature** - Creativity vs consistency (0.0-2.0)
  - **Max Tokens** - Response length limit
  - **Context Window** - Conversation memory size
  - **Top-P & Top-K** - Response variety controls
  - **Repeat Penalty** - Reduce repetitive responses

### Tool Usage
Ask questions that require real-time data:
- *"What time is it?"* - Uses getCurrentTime tool
- *"What's my BMI if I'm 5'9" and weigh 160 lbs?"* - Uses BMI calculator
- *"What's the weather in Tokyo?"* - Uses weather service (demo)

### Advanced Features
- **Reset Conversation** - Clear chat history anytime
- **Real-time Status** - Connection monitoring in header
- **Error Recovery** - Automatic reconnection and retry logic
- **Thinking Visualization** - See AI reasoning process
- **Markdown Rendering** - Rich text, code blocks, tables

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
│   │   └── ModelConfigSelector.tsx    # Parameter configuration
│   ├── lib/
│   │   ├── ai-config.ts              # Centralized AI configuration
│   │   ├── ai-health.ts              # Health monitoring utilities
│   │   ├── ai-middleware.ts          # Logging & request tracking
│   │   └── tools.ts                  # Built-in tool definitions
│   ├── types/
│   │   ├── index.ts                  # General type definitions
│   │   └── ollama.ts                 # Ollama-specific types
│   └── utils/                        # Utility functions
├── public/                           # Static assets
├── docs/
│   └── AI_SDK_IMPLEMENTATION.md      # Technical implementation details
├── package.json                      # Dependencies & scripts
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS configuration
└── tsconfig.json                    # TypeScript configuration
```

### Key Technologies

#### **Frontend Stack**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety throughout
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Modern utility-first styling
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icons

#### **AI Integration**
- **[Vercel AI SDK 4](https://sdk.vercel.ai/)** - Streaming AI responses
- **[Ollama AI Provider](https://ollama.ai/)** - Local LLM inference
- **[React Markdown](https://github.com/remarkjs/react-markdown)** - Rich text rendering
- **[Rehype Highlight](https://github.com/rehypejs/rehype-highlight)** - Code syntax highlighting
- **[Zod](https://zod.dev/)** - Runtime type validation

#### **Development Tools**
- **[ESLint 9](https://eslint.org/)** - Code linting with modern config
- **[PostCSS](https://postcss.org/)** - CSS processing pipeline
- **VS Code Integration** - Optimized development experience

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
  description: "Brief description",
  prompt: "Detailed system prompt...",
  icon: YourIcon, // From lucide-react
  category: "Category",
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Default model |
| `OLLAMA_TEMPERATURE` | `0.7` | Default creativity setting |
| `OLLAMA_MAX_TOKENS` | `4096` | Default response length |
| `AI_LOGGING` | `true` | Enable request logging |
| `AI_LOG_LEVEL` | `info` | Logging verbosity |

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
