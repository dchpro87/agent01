import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { AILogger, generateRequestId } from "@/lib/ai-middleware";
import { aiConfig, validateConfig } from "@/lib/ai-config";
import { z } from "zod";

// Define the message schema for validation
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, "At least one message is required"),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  modelOptions: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  const requestId = generateRequestId();

  try {
    // Create an AbortController to handle request cancellation
    const abortController = new AbortController();

    // Handle client disconnection (when user cancels)
    req.signal?.addEventListener("abort", () => {
      console.log(`🚫 Request ${requestId} aborted by client`);
      abortController.abort();
    });

    // Validate configuration first
    const configValidation = validateConfig();
    if (!configValidation.isValid) {
      return new Response(
        JSON.stringify({
          error: "Invalid AI configuration",
          details: configValidation.errors,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const requestBody = await req.json();

    // Validate request body
    const validationResult = RequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: validationResult.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { messages, model, systemPrompt, modelOptions } =
      validationResult.data;

    // Get configuration from environment variables, allowing model override
    const { ollama: config } = aiConfig;
    const selectedModel = model || config.model;

    // Merge model options with configuration defaults
    const finalOptions = {
      ...config.defaultOptions,
      ...modelOptions,
    };

    // Default system prompt if none provided
    const defaultSystemPrompt =
      "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.";
    const finalSystemPrompt =
      systemPrompt && systemPrompt.trim() ? systemPrompt : defaultSystemPrompt;

    // Start logging for this request
    AILogger.startRequest(requestId, selectedModel);

    console.log("Chat API - baseURL:", config.baseURL);
    console.log("Chat API - model:", selectedModel);
    console.log("Chat API - options:", JSON.stringify(finalOptions, null, 2));
    console.log("Chat API - messages:", JSON.stringify(messages, null, 2));

    // Test Ollama connection before proceeding
    try {
      const testResponse = await fetch(`${config.baseURL}/api/tags`, {
        signal: abortController.signal,
      });
      if (!testResponse.ok) {
        throw new Error(`Ollama connection failed: ${testResponse.status}`);
      }
    } catch (connectionError) {
      if (abortController.signal.aborted) {
        console.log(`🚫 Connection test aborted for request ${requestId}`);
        return new Response("Request aborted", { status: 499 });
      }
      console.error("Ollama connection test failed:", connectionError);
      return new Response(
        JSON.stringify({
          error: "Failed to connect to Ollama server",
          details:
            connectionError instanceof Error
              ? connectionError.message
              : "Unknown connection error",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create OpenAI-compatible instance for Ollama
    const ollama = createOpenAI({
      baseURL: `${config.baseURL}/v1`,
      apiKey: "ollama", // Ollama doesn't require a real API key
    });

    const result = streamText({
      model: ollama(selectedModel),
      messages: messages,
      temperature: finalOptions.temperature || config.temperature,
      maxTokens: finalOptions.num_predict || config.maxTokens,
      topK: finalOptions.top_k,
      topP: finalOptions.top_p,
      frequencyPenalty: finalOptions.frequency_penalty,
      presencePenalty: finalOptions.presence_penalty,
      seed: finalOptions.seed,
      // Use the provided system prompt or default
      system: finalSystemPrompt,
      // Enable automatic retries for transient failures
      maxRetries: config.maxRetries,
      // Add abort signal to handle cancellation
      abortSignal: abortController.signal,
      onFinish: (event) => {
        // Log completion with actual token usage
        AILogger.finishRequest(requestId, {
          promptTokens: event.usage?.promptTokens,
          completionTokens: event.usage?.completionTokens,
          totalTokens: event.usage?.totalTokens,
        });
      },
    });

    return result.toDataStreamResponse({
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Request-ID": requestId,
        "X-Model": selectedModel,
        "X-Provider": "ollama",
      },
    });
  } catch (error) {
    // Handle abort cases
    if (error instanceof Error && error.name === "AbortError") {
      console.log(`🚫 Request ${requestId} was aborted`);
      AILogger.finishRequest(
        requestId,
        undefined,
        new Error("Request aborted")
      );
      return new Response("Request aborted", { status: 499 });
    }

    // Log the error
    AILogger.finishRequest(
      requestId,
      undefined,
      error instanceof Error ? error : new Error("Unknown error")
    );

    console.error("Chat API error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
