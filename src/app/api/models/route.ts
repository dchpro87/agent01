import { aiConfig } from "@/lib/ai-config";

// Function to check if a model supports tools/function calling
function checkModelSupportsTools(modelName: string): boolean {
  // List of models known to support tools/function calling
  const toolSupportedModels = [
    // Llama models that support tools
    "llama3.2",
    "llama3.1",
    "llama3",
    "llama2",
    // Qwen models
    "qwen2.5",
    "qwen2",
    "qwen",
    // Mistral models
    "mistral",
    "mixtral",
    // Other models that support tools
    "codellama",
    "phi3",
    "gemma2",
    // Add more models as needed
  ];

  // Check if the model name contains any of the supported model patterns
  const lowerModelName = modelName.toLowerCase();

  // Models that are known NOT to support tools
  const noToolSupport = [
    "gemma:1b",
    "gemma2:1b",
    "gemma3:1b", // Small Gemma models
    "tinyllama",
    "orca-mini", // Very small models
  ];

  // First check if it's explicitly in the no-support list
  if (
    noToolSupport.some((model) => lowerModelName.includes(model.toLowerCase()))
  ) {
    return false;
  }

  // Then check if it's in the supported list
  return toolSupportedModels.some((model) =>
    lowerModelName.includes(model.toLowerCase())
  );
}

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

    // Extract model names from the response
    const models =
      data.models?.map((model: OllamaModel) => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
        supportsTools: checkModelSupportsTools(model.name),
      })) || [];

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
