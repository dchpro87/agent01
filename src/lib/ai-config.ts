import { APP_CONFIG } from "@/constraints/app-config";
import { AppConfig } from "@/types/app-config";

export const aiConfig: AppConfig = APP_CONFIG;

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

  if (aiConfig.serpApi && !aiConfig.serpApi.apiKey) {
    errors.push(
      "SerpApi API key is required when SerpApi is configured. Please set SERP_API_KEY environment variable."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
