import { OllamaModelOptions } from "./ollama";

export interface AppConfig {
  ollama: {
    baseURL: string;
    model: string;
    temperature: number;
    maxRetries: number;
    defaultOptions: OllamaModelOptions;
  };
  streaming: {
    timeout: number;
    keepAlive: boolean;
  };
  logging: {
    enabled: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
  };
  serpApi?: {
    apiKey: string;
    timeout?: number;
  };
}
