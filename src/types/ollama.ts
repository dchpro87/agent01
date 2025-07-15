// Ollama-specific types and interfaces

export interface OllamaModelOptions {
  // Core sampling parameters
  temperature?: number; // 0.0 to 2.0, controls randomness
  top_k?: number; // Limits vocabulary, reduces repetition
  top_p?: number; // 0.0 to 1.0, nucleus sampling
  min_p?: number; // 0.0 to 1.0, minimum probability threshold
  typical_p?: number; // 0.0 to 1.0, typical sampling

  // Token control - AI SDK standard
  maxTokens?: number; // Maximum tokens to generate (AI SDK standard)
  num_predict?: number; // Ollama native - for backward compatibility
  num_keep?: number; // Tokens to keep from context
  num_ctx?: number; // Context window size

  // Repetition control
  repeat_penalty?: number; // 1.0+ penalizes repetition
  repeat_last_n?: number; // Tokens to consider for repetition penalty
  presence_penalty?: number; // -2.0 to 2.0, penalizes presence
  frequency_penalty?: number; // -2.0 to 2.0, penalizes frequency

  // Special tokens and formatting
  stop?: string[]; // Stop sequences
  penalize_newline?: boolean; // Whether to penalize newlines

  // Performance and hardware
  numa?: boolean; // NUMA support
  num_batch?: number; // Batch size for processing
  num_gpu?: number; // Number of GPU layers
  main_gpu?: number; // Main GPU to use
  use_mmap?: boolean; // Use memory mapping
  num_thread?: number; // Number of CPU threads

  // Model behavior
  seed?: number; // Random seed for reproducibility
  tfs_z?: number; // Tail-free sampling
  mirostat?: number; // Mirostat sampling (0, 1, or 2)
  mirostat_tau?: number; // Mirostat target entropy
  mirostat_eta?: number; // Mirostat learning rate
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelInfo {
  modelfile: string;
  parameters: string;
  template: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  model_info: Record<string, unknown>;
  capabilities: string[];
}

export interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface OllamaTool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  images?: string[];
  tool_calls?: OllamaToolCall[];
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  tools?: OllamaTool[];
  format?: string | object;
  options?: OllamaModelOptions;
  stream?: boolean;
  keep_alive?: string | number;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    images?: string[] | null;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  done_reason?: string;
}

// Preset configurations for different use cases
export const MODEL_PRESETS = {
  balanced: {
    temperature: 0.4,
    top_k: 10,
    top_p: 0, // Use temperature instead
    repeat_penalty: 1.1,
    num_ctx: 4096,
    maxTokens: 2048, // AI SDK standard
  },
  creative: {
    temperature: 0.9,
    top_k: 50,
    top_p: 0, // Use temperature instead
    repeat_penalty: 1.05,
    num_ctx: 4096,
    maxTokens: 2048, // AI SDK standard
  },
  precise: {
    temperature: 0.0,
    top_k: 5,
    top_p: 0, // Use temperature instead
    repeat_penalty: 1.2,
    num_ctx: 4096,
    maxTokens: 2048, // AI SDK standard
  },
  coding: {
    temperature: 0.2,
    top_k: 5,
    top_p: 0, // Use temperature instead
    repeat_penalty: 1.1,
    num_ctx: 4096,
    maxTokens: 2048, // Higher for code generation
  },
  analytical: {
    temperature: 0.4,
    top_k: 10,
    top_p: 0, // Use temperature instead
    repeat_penalty: 1.2,
    num_ctx: 4096,
    maxTokens: 2048, // AI SDK standard
  },
} as const;

export type ModelPreset = keyof typeof MODEL_PRESETS;
