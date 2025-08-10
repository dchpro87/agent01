import { AppConfig } from '@/types/app-config';
import { DEFAULT_OPTIONS } from './model-config';

// Application Configuration
// This file replaces all environment variables with static configuration

// Main application configuration
export const APP_CONFIG: AppConfig = {
  ollama: {
    baseURL: 'http://localhost:11434',
    model: 'qwen3:0.6b',
    temperature: 0.7,
    maxRetries: 2,
    defaultOptions: {
      ...DEFAULT_OPTIONS,
      maxTokens: 8192, // Override with higher value for API usage
    },
  },
  streaming: {
    timeout: 30000, // 30 seconds
    keepAlive: true,
  },
  logging: {
    enabled: true,
    logLevel: 'info',
  },
  serpApi: {
    apiKey: process.env.SERP_API_KEY || '',
    timeout: 10000, // 10 seconds
  },
};
