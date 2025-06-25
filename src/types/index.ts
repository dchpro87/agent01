export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AIModel {
  name: string;
  size: number;
  modified_at: string;
}

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "partial";
  checks: {
    connection: boolean;
    models: boolean;
    generation: boolean;
  };
  details: {
    baseURL: string;
    model: string;
    availableModels: string[];
    error?: string;
  };
}

export interface RequestMetrics {
  startTime: number;
  endTime?: number;
  tokenUsage?: TokenUsage;
  error?: string;
}

export type ConnectionStatus = "checking" | "connected" | "disconnected";
export type ChatStatus = "idle" | "submitted" | "streaming";
