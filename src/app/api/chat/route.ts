import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { AILogger, generateRequestId } from "@/lib/ai-middleware";
import { aiConfig, validateConfig } from "@/lib/ai-config";
import { z } from "zod";
import { OllamaModelOptions } from "@/types/ollama";

// Function to clean thinking tags from message content
function cleanThinkingTags(content: string): string {
  const thinkStartTag = "<think>";
  const thinkEndTag = "</think>";
  let result = content;

  while (true) {
    const thinkStart = result.indexOf(thinkStartTag);
    if (thinkStart === -1) break;

    const thinkEnd = result.indexOf(
      thinkEndTag,
      thinkStart + thinkStartTag.length
    );
    if (thinkEnd === -1) break;

    // Remove the thinking section including the tags
    result =
      result.slice(0, thinkStart) + result.slice(thinkEnd + thinkEndTag.length);
  }

  return result.trim();
}

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

    // Clean thinking tags from messages to avoid wasting context
    const cleanedMessages = messages.map((msg) => ({
      ...msg,
      content:
        msg.role === "assistant" ? cleanThinkingTags(msg.content) : msg.content,
    }));

    // Get configuration from environment variables, allowing model override
    const { ollama: config } = aiConfig;
    const selectedModel = model || config.model; // Merge model options with configuration defaults
    const finalOptions = {
      ...config.defaultOptions,
      ...modelOptions,
    };

    // Validate model options
    const modelOptionsErrors = validateModelOptions(finalOptions);
    if (modelOptionsErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid model options",
          details: modelOptionsErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
    console.log(
      "Chat API - cleaned messages:",
      JSON.stringify(cleanedMessages, null, 2)
    );

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

    // Prepare model parameters - use either temperature OR topP as recommended by Ollama
    const modelParams = {
      model: ollama(selectedModel, {
        // Pass Ollama-specific options directly to the model
        structuredOutputs: false,
        ...(finalOptions.num_ctx && { num_ctx: finalOptions.num_ctx }),
        ...(finalOptions.num_predict && {
          num_predict: finalOptions.num_predict,
        }),
        ...(finalOptions.repeat_penalty && {
          repeat_penalty: finalOptions.repeat_penalty,
        }),
        ...(finalOptions.repeat_last_n && {
          repeat_last_n: finalOptions.repeat_last_n,
        }),
        ...(finalOptions.min_p && { min_p: finalOptions.min_p }),
        ...(finalOptions.typical_p && { typical_p: finalOptions.typical_p }),
        ...(finalOptions.num_keep && { num_keep: finalOptions.num_keep }),
        ...(finalOptions.penalize_newline !== undefined && {
          penalize_newline: finalOptions.penalize_newline,
        }),
        ...(finalOptions.numa !== undefined && { numa: finalOptions.numa }),
        ...(finalOptions.num_batch && { num_batch: finalOptions.num_batch }),
        ...(finalOptions.num_gpu && { num_gpu: finalOptions.num_gpu }),
        ...(finalOptions.main_gpu && { main_gpu: finalOptions.main_gpu }),
        ...(finalOptions.use_mmap !== undefined && {
          use_mmap: finalOptions.use_mmap,
        }),
        ...(finalOptions.num_thread && { num_thread: finalOptions.num_thread }),
        ...(finalOptions.tfs_z && { tfs_z: finalOptions.tfs_z }),
        ...(finalOptions.mirostat && { mirostat: finalOptions.mirostat }),
        ...(finalOptions.mirostat_tau && {
          mirostat_tau: finalOptions.mirostat_tau,
        }),
        ...(finalOptions.mirostat_eta && {
          mirostat_eta: finalOptions.mirostat_eta,
        }),
        ...(finalOptions.stop && { stop: finalOptions.stop }),
      }),
      messages: cleanedMessages,
      topK: finalOptions.top_k,
      frequencyPenalty: finalOptions.frequency_penalty,
      presencePenalty: finalOptions.presence_penalty,
      seed: finalOptions.seed,
      // Use the provided system prompt or default
      system: finalSystemPrompt,
      // Enable automatic retries for transient failures
      maxRetries: config.maxRetries,
      // Add abort signal to handle cancellation
      abortSignal: abortController.signal,
    } as const;

    // Set either temperature OR topP, not both (Ollama recommendation)
    // Priority: if top_p is explicitly set and greater than 0, use top_p
    // Otherwise, use temperature
    const hasCustomTopP =
      finalOptions.top_p !== undefined && finalOptions.top_p > 0;

    console.log("🔍 Parameter selection:", {
      "finalOptions.top_p": finalOptions.top_p,
      hasCustomTopP: hasCustomTopP,
      "config.temperature": config.temperature,
      "finalOptions.temperature": finalOptions.temperature,
    });

    const streamParams = hasCustomTopP
      ? {
          ...modelParams,
          topP: finalOptions.top_p,
        }
      : {
          ...modelParams,
          temperature: finalOptions.temperature || config.temperature,
        };

    console.log("💥streamParams:", JSON.stringify(streamParams, null, 2));

    const result = streamText({
      ...streamParams,
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

const validateModelOptions = (options: OllamaModelOptions) => {
  const errors: string[] = [];

  if (
    options.num_predict &&
    (options.num_predict < 1 || options.num_predict > 8192)
  ) {
    errors.push("num_predict must be between 1 and 8192");
  }

  if (options.num_ctx && (options.num_ctx < 1 || options.num_ctx > 8192)) {
    errors.push("num_ctx must be between 1 and 8192");
  }

  if (
    options.temperature &&
    (options.temperature < 0 || options.temperature > 2)
  ) {
    errors.push("temperature must be between 0 and 2");
  }

  if (options.top_p !== undefined) {
    if (options.top_p < 0 || options.top_p > 1) {
      errors.push("top_p must be between 0 and 1");
    }
    // Check if it has more than 1 decimal place
    const decimalPlaces = (options.top_p.toString().split(".")[1] || "").length;
    if (decimalPlaces > 1) {
      errors.push("top_p can only have 1 decimal place");
    }
  }

  return errors;
};
