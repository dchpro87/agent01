import { aiConfig } from "@/lib/ai-config";

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
