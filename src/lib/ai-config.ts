import { APP_CONFIG, AppConfig } from "@/constants/app-config";

export interface AIConfig {
  ollama: {
    baseURL: string;
    model: string;
    temperature: number;
    maxRetries: number;
    defaultOptions: AppConfig["ollama"]["defaultOptions"];
  };
  streaming: {
    timeout: number;
    keepAlive: boolean;
  };
  logging: {
    enabled: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
  };
}

export const aiConfig: AIConfig = APP_CONFIG;

export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!aiConfig.ollama.baseURL) {
    errors.push("Ollama base URL is required");
  }

  if (!aiConfig.ollama.model) {
    errors.push("Ollama model is required");
  }

  if (aiConfig.ollama.temperature < 0 || aiConfig.ollama.temperature > 2) {
    errors.push("Temperature must be between 0 and 2");
  }

  if (
    aiConfig.ollama.defaultOptions.maxTokens &&
    (aiConfig.ollama.defaultOptions.maxTokens < 1 ||
      aiConfig.ollama.defaultOptions.maxTokens > 32000)
  ) {
    errors.push("maxTokens must be between 1 and 32000");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
