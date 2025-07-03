// Chat component constants

// Default system prompt
export const DEFAULT_SYSTEM_PROMPT =
  "You are Sarah, a helpful AI assistant with a warm and nurturing personality. You're naturally organized, detail-oriented, and always ready to lend a helping hand. Provide clear, accurate, and helpful responses with a caring touch. If you need more clarification, say so, or ask for it.\n After calling a tool and receiving the result, provide a clear and direct answer to the user using the information returned by the tool.";

// Tool support configuration
export const TOOL_SUPPORTED_MODELS = [
  "llama3.2",
  "llama3.1",
  "llama3",
  "llama2",
  "qwen2.5",
  "qwen2",
  "qwen",
  "mistral",
  "mixtral",
  "codellama",
  "phi3",
  "gemma2",
];

export const NO_TOOL_SUPPORT_MODELS = [
  "gemma:1b",
  "gemma2:1b",
  "gemma3:1b",
  "tinyllama",
  "orca-mini",
];

// Thinking tags for parsing
export const THINK_START_TAG = "<think>";
export const THINK_END_TAG = "</think>";

// File upload configuration
export const SUPPORTED_FILE_TYPES =
  "image/*,application/pdf,.pdf,.txt,.csv,.json,.docx,.doc";

// Chat configuration
export const MAX_CHAT_STEPS = 3;
export const DEFAULT_CHAT_STEPS = 1;

// API Route Constants
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

// Validation Constants
export const VALIDATION_LIMITS = {
  MAX_TOKENS_MIN: 1,
  MAX_TOKENS_MAX: 32000,
  NUM_CTX_MIN: 1,
  NUM_CTX_MAX: 32000,
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  TOP_P_MIN: 0,
  TOP_P_MAX: 1,
  TOP_P_MAX_DECIMALS: 1,
} as const;

// Validation Error Messages
export const VALIDATION_ERROR_MESSAGES = {
  MAX_TOKENS_RANGE: "maxTokens/num_predict must be between 1 and 32000",
  NUM_CTX_RANGE: "num_ctx must be between 1 and 32000",
  TEMPERATURE_RANGE: "temperature must be between 0 and 2",
  TOP_P_RANGE: "top_p must be between 0 and 1",
  TOP_P_DECIMALS: "top_p can only have 1 decimal place",
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
    "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
  WITHOUT_TOOLS: (modelName: string) =>
    `You are a helpful AI assistant. Note: This model (${modelName}) does not support tool/function calling or tools are disabled.`,
} as const;
