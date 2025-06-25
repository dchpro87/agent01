import { createOllama } from "ollama-ai-provider";
import { generateText } from "ai";
import { aiConfig } from "./ai-config";

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface HealthCheckResult {
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

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: "unhealthy",
    checks: {
      connection: false,
      models: false,
      generation: false,
    },
    details: {
      baseURL: aiConfig.ollama.baseURL,
      model: aiConfig.ollama.model,
      availableModels: [],
    },
  };

  try {
    // Check 1: Basic connection
    const connectionResponse = await fetch(
      `${aiConfig.ollama.baseURL}/api/tags`
    );
    if (connectionResponse.ok) {
      result.checks.connection = true;

      // Check 2: Available models
      const modelsData =
        (await connectionResponse.json()) as OllamaTagsResponse;
      result.details.availableModels =
        modelsData.models?.map((m: OllamaModel) => m.name) || [];

      const hasTargetModel = result.details.availableModels.includes(
        aiConfig.ollama.model
      );
      result.checks.models = hasTargetModel;

      if (hasTargetModel) {
        // Check 3: Simple generation test
        try {
          const ollama = createOllama({ baseURL: aiConfig.ollama.baseURL });
          await generateText({
            model: ollama(aiConfig.ollama.model),
            prompt: "Say 'test' and nothing else.",
            maxTokens: 5,
          });
          result.checks.generation = true;
        } catch (genError) {
          result.details.error = `Generation test failed: ${
            genError instanceof Error ? genError.message : "Unknown error"
          }`;
        }
      } else {
        result.details.error = `Model ${
          aiConfig.ollama.model
        } not found. Available: ${result.details.availableModels.join(", ")}`;
      }
    } else {
      result.details.error = `Connection failed: ${connectionResponse.status} ${connectionResponse.statusText}`;
    }
  } catch (error) {
    result.details.error = `Health check failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }

  // Determine overall status
  if (
    result.checks.connection &&
    result.checks.models &&
    result.checks.generation
  ) {
    result.status = "healthy";
  } else if (result.checks.connection) {
    result.status = "partial";
  }

  return result;
}

export async function suggestModelInstallation(): Promise<string[]> {
  const suggestions = [
    "# To install the default model, run:",
    `ollama pull ${aiConfig.ollama.model}`,
    "",
    "# Other recommended models:",
    "ollama pull llama3.2:1b    # Lightweight, fast",
    "ollama pull llama3.2:3b    # Good balance",
    "ollama pull llama3.2:8b    # Higher quality",
    "",
    "# To list available models:",
    "ollama list",
  ];

  return suggestions;
}
