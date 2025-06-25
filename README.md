# Modern AI Chatbot with Next.js 15 and Ollama

A modern, streaming chatbot built with Next.js 15, Vercel AI SDK, and Ollama. Features real-time streaming, beautiful UI, and local AI processing.

## Features

- 🚀 **Real-time streaming** using Vercel AI SDK
- 💬 **Modern chat interface** with Tailwind CSS
- 🤖 **Local AI processing** with Ollama
- 📱 **Responsive design** that works on all devices
- 🌙 **Dark mode support**
- ⚡ **Fast and efficient** with Next.js 15
- 🎨 **Beautiful UI** with smooth animations

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 18 or higher)
2. **Ollama** installed and running locally

### Installing Ollama

1. Download and install Ollama from [https://ollama.ai](https://ollama.ai)
2. Once installed, pull a model (the default is `llama3.2:3b`):
   ```bash
   ollama pull llama3.2:3b
   ```
3. Make sure Ollama is running:
   ```bash
   ollama serve
   ```

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd agent01
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Changing the AI Model

To use a different Ollama model, edit `src/app/api/chat/route.ts`:

```typescript
const result = streamText({
  model: ollama('your-model-name'), // Change this line
  messages,
  temperature: 0.7,
  maxTokens: 2048,
});
```

Available models depend on what you have installed in Ollama. Popular options include:
- `llama3.2:3b` (default, faster)
- `llama3.2:7b` (more capable)
- `codellama` (for coding tasks)
- `mistral` (alternative option)

### Customizing the UI

The chat interface is located in `src/components/Chat.tsx`. You can customize:
- Colors and styling
- Message layout
- Icons and animations
- Error handling

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts    # Chat API endpoint
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   └── Chat.tsx             # Chat component
└── types/                   # TypeScript types
```

## Built With

- **[Next.js 15](https://nextjs.org/)** - React framework
- **[Vercel AI SDK](https://sdk.vercel.ai/)** - AI integration
- **[Ollama](https://ollama.ai/)** - Local AI provider
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Lucide React](https://lucide.dev/)** - Icons
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

## Deployment

This app can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**

Note: When deploying, you'll need to ensure Ollama is accessible to your deployed application, which typically means setting up Ollama on a server and updating the API endpoint.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
