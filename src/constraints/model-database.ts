// Model Database - Single Source of Truth for Model Capabilities
// This file contains comprehensive information about models available on Ollama

// Model capabilities interface
export interface ModelCapabilities {
  tools: boolean;
  vision: boolean;
  embedding: boolean;
  reasoning: boolean;
  contextSize: number;
  family: string;
  description?: string;
}

// Single source of truth for model information and capabilities
// This database contains information about models available on the Ollama server at 192.168.0.145:11434
// Last updated: July 8, 2025
export const MODEL_DATABASE: Record<string, ModelCapabilities> = {
  // DeepSeek R1 models - Advanced reasoning models
  'deepseek-r1:1.5b': {
    tools: false,
    vision: false,
    embedding: false,
    reasoning: true,
    contextSize: 128000,
    family: 'deepseek',
    description: 'Lightweight DeepSeek reasoning model',
  },
  'deepseek-r1:7b': {
    tools: false,
    vision: false,
    embedding: false,
    reasoning: true,
    contextSize: 128000,
    family: 'deepseek',
    description: '8B parameter DeepSeek reasoning model',
  },
  'deepseek-r1:8b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: true,
    contextSize: 128000,
    family: 'deepseek',
    description: '8B parameter DeepSeek reasoning model',
  },

  // Gemma 3 models - Google's latest generation
  'gemma3n:latest': {
    tools: false,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 32000,
    family: 'gemma',
    description: 'Latest Gemma 3 model with enhanced capabilities',
  },
  'gemma3:12b': {
    tools: false,
    vision: true,
    embedding: false,
    reasoning: false,
    contextSize: 128000,
    family: 'gemma',
    description: 'Large Gemma 3 model for complex tasks',
  },
  'gemma3:4b': {
    tools: false,
    vision: true,
    embedding: false,
    reasoning: false,
    contextSize: 128000,
    family: 'gemma',
    description: 'Balanced Gemma 3 model',
  },
  'gemma3:1b': {
    tools: false,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 32000,
    family: 'gemma',
    description: 'Compact Gemma 3 model',
  },

  // OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases.
  'gpt-oss:20b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: true,
    contextSize: 128000,
    family: 'gpt-oss',
    description:
      "OpenAI's 20B parameter model for advanced reasoning and agentic tasks",
  },

  // A series of multimodal LLMs (MLLMs) designed for vision-language understanding.
  'minicpm-v:8b': {
    tools: false,
    vision: true,
    embedding: false,
    reasoning: false,
    contextSize: 32000,
    family: 'minicpm',
    description: 'MinicPM-V model with vision capabilities',
  },

  // Mistral AI's open-weight models known for high performance and efficiency.
  'mistral:latest': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 32000,
    family: 'mistral',
    description: 'The 7B model released by Mistral AI',
  },

  // Qwen models - Alibaba's multilingual models
  'qwen2.5vl:7b': {
    tools: false,
    vision: true,
    embedding: false,
    reasoning: false,
    contextSize: 125000,
    family: 'qwen',
    description: 'Qwen 2.5 with vision capabilities',
  },
  'qwen2.5:3b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 32000,
    family: 'qwen',
    description: 'Balanced Qwen 2.5 model',
  },
  'qwen2.5:0.5b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 32000,
    family: 'qwen',
    description: 'Ultra-lightweight Qwen 2.5 model',
  },
  'qwen3:8b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: true,
    contextSize: 40000,
    family: 'qwen',
    description: 'High-performance Qwen 3 model',
  },
  'qwen3:4b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: true,
    contextSize: 40000,
    family: 'qwen',
    description: 'Balanced Qwen 3 model',
  },
  'qwen3:1.7b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: true,
    contextSize: 40000,
    family: 'qwen',
    description: 'Compact Qwen 3 model',
  },
  'qwen3:0.6b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: true,
    contextSize: 40000,
    family: 'qwen',
    description: 'Ultra-lightweight Qwen 3 model',
  },

  // QwQ - Qwen reasoning model
  'qwq:32b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 40000,
    family: 'qwen',
    description: 'Large Qwen reasoning model for complex problem solving',
  },

  // Granite models - IBM's enterprise models
  'granite3.1-dense:latest': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 128000,
    family: 'granite',
    description: "IBM's Granite dense model for enterprise use",
  },

  // Llama models
  'llama3-chatqa:8b': {
    tools: false,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 8000,
    family: 'llama3',
    description: 'Llama 3 model optimized for chat and QA tasks',
  },
  'llama3.1:8b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 128000,
    family: 'llama3',
    description: 'Balanced Llama 3.1 performance model',
  },
  'llama3.2:3b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 128000,
    family: 'llama3',
    description: 'Compact Llama 3.2 with good performance',
  },
  'llama3.2:1b': {
    tools: true,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 128000,
    family: 'llama3',
    description: 'Lightweight Llama 3.2 for basic tasks',
  },
  'llama2:7b': {
    tools: false,
    vision: false,
    embedding: false,
    reasoning: false,
    contextSize: 4000,
    family: 'llama2',
    description: 'Previous generation Llama 2 model',
  },

  // Embedding models
  'nomic-embed-text:v1.5': {
    tools: false,
    vision: false,
    embedding: true,
    reasoning: false,
    contextSize: 8192,
    family: 'nomic',
    description: 'High-quality text embeddings for semantic search',
  },
} as const;
