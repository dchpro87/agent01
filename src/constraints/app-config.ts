import { AppConfig } from '@/types/app-config';
import { DEFAULT_OPTIONS } from './model-config';

// Application Configuration
// This file replaces all environment variables with static configuration

// Main application configuration
export const APP_CONFIG: AppConfig = {
  ollama: {
    baseURL: 'http://192.168.0.145:11434',
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
};

// Validation function
export function validateAppConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!APP_CONFIG.ollama.baseURL) {
    errors.push('Ollama base URL is required');
  }

  if (!APP_CONFIG.ollama.model) {
    errors.push('Ollama model is required');
  }

  if (APP_CONFIG.ollama.temperature < 0 || APP_CONFIG.ollama.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (
    APP_CONFIG.ollama.defaultOptions.maxTokens &&
    (APP_CONFIG.ollama.defaultOptions.maxTokens < 1 ||
      APP_CONFIG.ollama.defaultOptions.maxTokens > 32000)
  ) {
    errors.push('maxTokens must be between 1 and 32000');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
