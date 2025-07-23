import { createOpenAI } from "@ai-sdk/openai";
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
    // Check 1: Basic connection using OpenAI-compatible endpoint
    const connectionResponse = await fetch(
      `${aiConfig.ollama.baseURL}/v1/models`
    );
    if (connectionResponse.ok) {
      result.checks.connection = true;

      // Check 2: Available models via Ollama tags endpoint (fallback to original API)
      const modelsResponse = await fetch(`${aiConfig.ollama.baseURL}/api/tags`);
      if (modelsResponse.ok) {
        const modelsData = (await modelsResponse.json()) as OllamaTagsResponse;
        result.details.availableModels =
          modelsData.models?.map((m: OllamaModel) => m.name) || [];

        const hasTargetModel = result.details.availableModels.includes(
          aiConfig.ollama.model
        );
        result.checks.models = hasTargetModel;

        if (hasTargetModel) {
          // Check 3: Simple generation test
          try {
            const openai = createOpenAI({
              baseURL: aiConfig.ollama.baseURL + "/v1",
              apiKey: "ollama", // Ollama doesn't require a real API key
              compatibility: "compatible", // Use compatible mode for 3rd party providers
            });
            await generateText({
              model: openai(aiConfig.ollama.model),
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
        result.details.error = `Models endpoint failed: ${modelsResponse.status} ${modelsResponse.statusText}`;
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
