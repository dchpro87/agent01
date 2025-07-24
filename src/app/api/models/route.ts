import { aiConfig } from "@/lib/ai-config";
import {
  getModelCapabilities,
  checkModelSupportsTools,
  checkModelSupportsVision,
  checkModelSupportsEmbedding,
  checkModelSupportsReasoning,
  getModelContextSize,
  getModelFamily,
  getModelDescription,
} from "@/constraints/chat-constraints";

export async function GET() {
  try {
    const response = await fetch(`${aiConfig.ollama.baseURL}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch models from Ollama",
          status: response.status,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    // Define type for Ollama model
    interface OllamaModel {
      name: string;
      size: number;
      modified_at: string;
    }

    // Extract model names from the response and enrich with capabilities
    const models =
      data.models?.map((model: OllamaModel) => {
        const capabilities = getModelCapabilities(model.name);

        return {
          name: model.name,
          size: model.size,
          modified_at: model.modified_at,
          // Enhanced model information from our single source of truth
          supportsTools: checkModelSupportsTools(model.name),
          supportsVision: checkModelSupportsVision(model.name),
          supportsEmbedding: checkModelSupportsEmbedding(model.name),
          supportsReasoning: checkModelSupportsReasoning(model.name),
          contextSize: getModelContextSize(model.name),
          family: getModelFamily(model.name),
          description: getModelDescription(model.name),
          // Include full capabilities object for detailed information
          capabilities,
        };
      }) || [];

    return new Response(
      JSON.stringify({
        models,
        default: aiConfig.ollama.model,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching models:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to Ollama server",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
