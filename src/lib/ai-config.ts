import { OllamaModelOptions } from '@/types/ollama';

export interface AIConfig {
  ollama: {
    baseURL: string;
    model: string;
    temperature: number;
    maxTokens: number;
    maxRetries: number;
    defaultOptions: OllamaModelOptions;
  };
  streaming: {
    timeout: number;
    keepAlive: boolean;
  };
  logging: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

export const aiConfig: AIConfig = {
  ollama: {
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '2048'),
    maxRetries: parseInt(process.env.OLLAMA_MAX_RETRIES || '2'),
    defaultOptions: {
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
      top_k: parseInt(process.env.OLLAMA_TOP_K || '40'),
      top_p: parseFloat(process.env.OLLAMA_TOP_P || '0.9'),
      repeat_penalty: parseFloat(process.env.OLLAMA_REPEAT_PENALTY || '1.1'),
      num_ctx: parseInt(process.env.OLLAMA_NUM_CTX || '2048'),
      num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT || '512'),
    },
  },
  streaming: {
    timeout: parseInt(process.env.STREAMING_TIMEOUT || '30000'),
    keepAlive: process.env.STREAMING_KEEP_ALIVE !== 'false',
  },
  logging: {
    enabled: process.env.AI_LOGGING !== 'false',
    logLevel: (['debug', 'info', 'warn', 'error'].includes(
      process.env.AI_LOG_LEVEL || ''
    )
      ? process.env.AI_LOG_LEVEL
      : 'info') as 'debug' | 'info' | 'warn' | 'error',
  },
};

export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!aiConfig.ollama.baseURL) {
    errors.push('Ollama base URL is required');
  }

  if (!aiConfig.ollama.model) {
    errors.push('Ollama model is required');
  }

  if (aiConfig.ollama.temperature < 0 || aiConfig.ollama.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (aiConfig.ollama.maxTokens < 1 || aiConfig.ollama.maxTokens > 8192) {
    errors.push('Max tokens must be between 1 and 8192');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
