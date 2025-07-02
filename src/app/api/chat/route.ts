import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { AILogger, generateRequestId } from "@/lib/ai-middleware";
import { aiConfig, validateConfig } from "@/lib/ai-config";
import { tools } from "@/lib/tools";
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

    const {
      messages,
      model: requestModel,
      systemPrompt,
      modelOptions,
    } = validationResult.data;

    // Clean thinking tags from messages to avoid wasting context
    const cleanedMessages = messages.map((msg) => ({
      ...msg,
      content:
        msg.role === "assistant" ? cleanThinkingTags(msg.content) : msg.content,
    }));

    // Get configuration from environment variables, allowing model override
    const { ollama: config } = aiConfig;
    const selectedModel = requestModel || config.model;

    // Check if the model supports tools/function calling early
    const supportsTools = checkModelSupportsTools(selectedModel);

    // Merge model options with configuration defaults
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
    const defaultSystemPrompt = supportsTools
      ? `You are a helpful AI assistant. Provide clear, accurate, and helpful responses.

When you need to get current date/time information, use the getCurrentTime tool. After calling the tool and receiving the result, provide a direct answer to the user using the information returned by the tool. Do not call the tool multiple times for the same information.

Important: After receiving a tool result, provide your final answer immediately. Do not continue thinking or call tools again unless the user asks a new question.`
      : `You are a helpful AI assistant. Provide clear, accurate, and helpful responses.

Note: This model (${selectedModel}) does not support tool/function calling, so I cannot access real-time information like current date/time or perform external actions. I'll do my best to help you with general knowledge and assistance.`;

    const finalSystemPrompt =
      systemPrompt && systemPrompt.trim() ? systemPrompt : defaultSystemPrompt;

    // Start logging for this request
    AILogger.startRequest(requestId, selectedModel);

    console.log("Chat API - baseURL:", config.baseURL);
    console.log("Chat API - model:", selectedModel);
    console.log("Chat API - supports tools:", supportsTools);
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
      compatibility: "compatible", // Use compatible mode for third-party providers
      name: "ollama", // Set provider name for better debugging
    });

    // Create the model instance
    const modelInstance = ollama(selectedModel, {
      // Ollama-specific options that should be passed to the model
      structuredOutputs: false,
    });

    // Prepare standard AI SDK parameters
    const streamParams = {
      model: modelInstance,
      messages: cleanedMessages,
      system: finalSystemPrompt,
      maxRetries: config.maxRetries,
      abortSignal: abortController.signal,
      // Standard AI SDK parameters
      ...(finalOptions.seed && { seed: finalOptions.seed }),
      ...(finalOptions.top_k && { topK: finalOptions.top_k }),
      ...(finalOptions.frequency_penalty && {
        frequencyPenalty: finalOptions.frequency_penalty,
      }),
      ...(finalOptions.presence_penalty && {
        presencePenalty: finalOptions.presence_penalty,
      }),
      // AI SDK standard: maxTokens (replaces Ollama's num_predict)
      ...(finalOptions.maxTokens && { maxTokens: finalOptions.maxTokens }),
      // Support legacy num_predict for backward compatibility
      ...(!finalOptions.maxTokens &&
        finalOptions.num_predict && { maxTokens: finalOptions.num_predict }),
      // Standard stopSequences parameter (mapped from Ollama's stop)
      ...(finalOptions.stop && { stopSequences: finalOptions.stop }),
      // Pass Ollama-specific options via providerOptions
      providerOptions: {
        openai: {
          ...(finalOptions.num_ctx && { num_ctx: finalOptions.num_ctx }),
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
          ...(finalOptions.num_thread && {
            num_thread: finalOptions.num_thread,
          }),
          ...(finalOptions.tfs_z && { tfs_z: finalOptions.tfs_z }),
          ...(finalOptions.mirostat && { mirostat: finalOptions.mirostat }),
          ...(finalOptions.mirostat_tau && {
            mirostat_tau: finalOptions.mirostat_tau,
          }),
          ...(finalOptions.mirostat_eta && {
            mirostat_eta: finalOptions.mirostat_eta,
          }),
        },
      },
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

    // Add temperature or topP to the streamParams
    const finalStreamParams = hasCustomTopP
      ? {
          ...streamParams,
          topP: finalOptions.top_p,
        }
      : {
          ...streamParams,
          temperature: finalOptions.temperature || config.temperature,
        };

    console.log(
      "💥finalStreamParams:",
      JSON.stringify(finalStreamParams, null, 2)
    );

    const result = streamText({
      ...finalStreamParams,
      maxSteps: supportsTools ? 3 : 1, // Only allow multiple steps if tools are supported
      toolChoice: supportsTools ? "auto" : undefined, // Only enable tool choice if supported
      toolCallStreaming: supportsTools ? true : undefined, // Only enable tool streaming if supported
      ...(supportsTools && { tools }), // Only include tools if the model supports them
      onFinish: (event) => {
        // Log completion with actual token usage
        console.log("🏁 Request finished:", {
          finishReason: event.finishReason,
          totalSteps: event.steps?.length,
          toolCalls: event.toolCalls?.map((tc) => ({
            toolName: tc.toolName,
            args: tc.args,
          })),
          toolResults: event.toolResults?.map((tr) => ({
            toolName: tr.toolName,
            result: tr.result,
          })),
          hasText: !!event.text,
          textLength: event.text?.length,
        });
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
      getErrorMessage: (error) => {
        // Enhanced error handling for better debugging
        if (error == null) {
          return "Unknown error occurred";
        }

        if (typeof error === "string") {
          return error;
        }

        if (error instanceof Error) {
          // Handle specific tool-related errors
          if (
            error.message.includes("tool") ||
            error.message.includes("function")
          ) {
            return `Model "${selectedModel}" doesn't support tools/function calling. Please use a model that supports tools (e.g., llama3.2:3b, qwen2.5, mistral).`;
          }

          // Handle other common errors
          if (
            error.message.includes("connection") ||
            error.message.includes("ECONNREFUSED")
          ) {
            return "Failed to connect to Ollama server. Please ensure Ollama is running.";
          }

          if (
            error.message.includes("model") &&
            error.message.includes("not found")
          ) {
            return `Model "${selectedModel}" not found. Please pull the model first using: ollama pull ${selectedModel}`;
          }

          return error.message;
        }

        return JSON.stringify(error);
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

  // Check maxTokens (AI SDK standard) or num_predict (legacy)
  const tokenLimit = options.maxTokens || options.num_predict;
  if (tokenLimit && (tokenLimit < 1 || tokenLimit > 32000)) {
    errors.push("maxTokens/num_predict must be between 1 and 32000");
  }

  if (options.num_ctx && (options.num_ctx < 1 || options.num_ctx > 32000)) {
    errors.push("num_ctx must be between 1 and 32000");
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
