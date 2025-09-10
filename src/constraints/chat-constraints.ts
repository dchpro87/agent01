// Chat component constraints

// Import model database and types
import { MODEL_DATABASE, type ModelCapabilities } from "./model-database";

// Re-export the interface for convenience
export type { ModelCapabilities } from "./model-database";

// Helper functions to query model capabilities
export function getModelCapabilities(
  modelName: string
): ModelCapabilities | null {
  // First try exact match
  if (MODEL_DATABASE[modelName]) {
    return MODEL_DATABASE[modelName];
  }

  // Then try to match based on model family/pattern
  const lowerModelName = modelName.toLowerCase();

  // Find the best matching model pattern
  for (const [pattern, capabilities] of Object.entries(MODEL_DATABASE)) {
    if (lowerModelName.includes(pattern.toLowerCase())) {
      return capabilities;
    }
  }

  // Return null if no match found
  return null;
}

export function checkModelSupportsTools(modelName: string): boolean {
  const capabilities = getModelCapabilities(modelName);
  return capabilities?.tools ?? false;
}

export function checkModelSupportsVision(modelName: string): boolean {
  const capabilities = getModelCapabilities(modelName);
  return capabilities?.vision ?? false;
}

export function checkModelSupportsEmbedding(modelName: string): boolean {
  const capabilities = getModelCapabilities(modelName);
  return capabilities?.embedding ?? false;
}

export function checkModelSupportsReasoning(modelName: string): boolean {
  const capabilities = getModelCapabilities(modelName);
  return capabilities?.reasoning ?? false;
}

export function getModelContextSize(modelName: string): number {
  const capabilities = getModelCapabilities(modelName);
  return capabilities?.contextSize ?? 4096; // Default context size
}

export function getModelFamily(modelName: string): string {
  const capabilities = getModelCapabilities(modelName);
  return capabilities?.family ?? "unknown";
}

export function getModelDescription(modelName: string): string {
  const capabilities = getModelCapabilities(modelName);
  return capabilities?.description ?? "Model capabilities unknown";
}

// Get models by capability
export function getModelsByCapability(
  capability: keyof ModelCapabilities
): string[] {
  return Object.keys(MODEL_DATABASE).filter(
    (key) => MODEL_DATABASE[key][capability] === true
  );
}

// Get tool-supporting models (for backward compatibility)
export function getToolSupportedModels(): string[] {
  return getModelsByCapability("tools");
}

// Get vision-supporting models
export function getVisionSupportedModels(): string[] {
  return getModelsByCapability("vision");
}

// Get embedding models
export function getEmbeddingModels(): string[] {
  return getModelsByCapability("embedding");
}

// Get reasoning models
export function getReasoningModels(): string[] {
  return getModelsByCapability("reasoning");
}

// Get models by family
export function getModelsByFamily(family: string): string[] {
  return Object.keys(MODEL_DATABASE).filter(
    (key) => MODEL_DATABASE[key].family.toLowerCase() === family.toLowerCase()
  );
}

// Legacy exports for backward compatibility (deprecated - use getModelCapabilities instead)
export const TOOL_SUPPORTED_MODELS = Object.keys(MODEL_DATABASE).filter(
  (key) => MODEL_DATABASE[key].tools
);

export const NO_TOOL_SUPPORT_MODELS = Object.keys(MODEL_DATABASE).filter(
  (key) => !MODEL_DATABASE[key].tools
);

// File upload configuration
export const SUPPORTED_FILE_TYPES = "image/*,.pdf,application/pdf";

// File size limits (in bytes)
export const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB in bytes
export const MAX_FILE_SIZE_DISPLAY = "40MB"; // Display string

// Chat configuration
export const MAX_CHAT_STEPS = 5;
export const DEFAULT_CHAT_STEPS = 1;

// API Route constraints
export const API_ROUTES = {
  CHAT: "/api/chat",
  HEALTH: "/api/health",
  MODELS: "/api/models",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_AI_CONFIG: "Invalid AI configuration",
  INVALID_REQUEST_FORMAT: "Invalid request format",
  INVALID_MODEL_OPTIONS: "Invalid model options",
  OLLAMA_CONNECTION_FAILED: "Failed to connect to Ollama server",
  CHAT_REQUEST_FAILED: "Failed to process chat request",
  REQUEST_ABORTED: "Request aborted",
  MESSAGE_CONTENT_EMPTY: "Message content cannot be empty",
  CONTENT_PARTS_EMPTY: "Content parts array cannot be empty",
  AT_LEAST_ONE_MESSAGE: "At least one message is required",
} as const;

// Validation constraints
export const VALIDATION_LIMITS = {
  MAX_TOKENS_MIN: 1,
  MAX_TOKENS_MAX: 32000,
  MAX_TOKENS_UI_MIN: 50, // More practical minimum for UI slider
  NUM_CTX_MIN: 1,
  NUM_CTX_MAX: 128000,
  NUM_CTX_UI_MIN: 512, // More practical minimum for UI slider
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  TOP_P_MIN: 0,
  TOP_P_MAX: 1,
  TOP_P_MAX_DECIMALS: 1,
  TOP_K_MIN: 1,
  TOP_K_MAX: 100,
  REPEAT_PENALTY_MIN: 0.8,
  REPEAT_PENALTY_MAX: 1.5,
  MIN_P_MIN: 0,
  MIN_P_MAX: 0.5,
} as const;

// Validation Error Messages
export const VALIDATION_ERROR_MESSAGES = {
  MAX_TOKENS_RANGE: "maxTokens/num_predict must be between 1 and 32000",
  NUM_CTX_RANGE: "num_ctx must be between 1 and 128000",
  TEMPERATURE_RANGE: "temperature must be between 0 and 2",
  TOP_P_RANGE: "top_p must be between 0 and 1",
  TOP_P_DECIMALS: "top_p can only have 1 decimal place",
  TOP_K_RANGE: "top_k must be between 1 and 100",
  REPEAT_PENALTY_RANGE: "repeat_penalty must be between 0.8 and 1.5",
  MIN_P_RANGE: "min_p must be between 0 and 0.5",
} as const;

// HTTP Headers
export const HTTP_HEADERS = {
  CONTENT_TYPE_JSON: "application/json",
  CACHE_CONTROL_NO_CACHE: "no-cache",
  CONNECTION_KEEP_ALIVE: "keep-alive",
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  REQUEST_TIMEOUT: 408,
  REQUEST_ABORTED: 499,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Default System Prompts
export const DEFAULT_SYSTEM_PROMPTS = {
  WITH_TOOLS:
    "You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When using tools, always provide a final summary response to the user after the tool execution is complete. For complex reasoning or problem-solving, you may wrap your thinking process in <think></think> tags to show your thought process.",
  WITHOUT_TOOLS: (modelName: string) =>
    `You are a helpful AI assistant. Note: This model (${modelName}) does not support tool/function calling or tools are disabled. For complex reasoning or problem-solving, you may wrap your thinking process in <think></think> tags to show your thought process.`,
} as const;
