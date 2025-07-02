/*
 * Chat API Route - Supports multimodal content following AI SDK v5 patterns
 *
 * This implementation follows the official AI SDK documentation patterns for:
 * - Multimodal message handling
 * - Proper error handling
 * - Stream response patterns
 * - Content processing
 */

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, CoreMessage } from "ai";
import { AILogger, generateRequestId } from "@/lib/ai-middleware";
import { aiConfig, validateConfig } from "@/lib/ai-config";
import { tools } from "@/lib/tools";
import { z } from "zod";
import { OllamaModelOptions } from "@/types/ollama";

// Function to clean thinking tags from message content
function cleanThinkingTags(
  content: string | Array<Record<string, unknown>>
): string | Array<Record<string, unknown>> {
  if (typeof content === "string") {
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

      result =
        result.slice(0, thinkStart) +
        result.slice(thinkEnd + thinkEndTag.length);
    }

    return result.trim();
  }

  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part.type === "text" && typeof part.text === "string") {
        return {
          ...part,
          text: cleanThinkingTags(part.text) as string,
        };
      }
      return part;
    });
  }

  return content;
}

// Function to check if a model supports tools/function calling
function checkModelSupportsTools(modelName: string): boolean {
  const toolSupportedModels = [
    "llama3.2",
    "llama3.1",
    "llama3",
    "llama2",
    "qwen2.5",
    "qwen2",
    "qwen",
    "mistral",
    "mixtral",
    "codellama",
    "phi3",
    "gemma2",
  ];

  const lowerModelName = modelName.toLowerCase();
  const noToolSupport = ["gemma:1b", "gemma2:1b", "tinyllama", "orca-mini"];

  if (
    noToolSupport.some((model) => lowerModelName.includes(model.toLowerCase()))
  ) {
    return false;
  }

  return toolSupportedModels.some((model) =>
    lowerModelName.includes(model.toLowerCase())
  );
}

// AI SDK compatible validation schema
const RequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system", "tool"]),
        content: z.union([
          z.string().min(1, "Message content cannot be empty"),
          z
            .array(
              z.object({
                type: z.string(),
                text: z.string().optional(),
                image: z
                  .union([
                    z.string(),
                    z.instanceof(Buffer),
                    z.instanceof(Uint8Array),
                  ])
                  .optional(),
                data: z
                  .union([
                    z.string(),
                    z.instanceof(Buffer),
                    z.instanceof(Uint8Array),
                  ])
                  .optional(),
                mimeType: z.string().optional(),
                filename: z.string().optional(),
              })
            )
            .min(1, "Content parts array cannot be empty"),
        ]),
        // AI SDK v5 handles experimental_attachments automatically
        experimental_attachments: z
          .array(
            z.object({
              name: z.string(),
              contentType: z.string(),
              url: z.string(),
            })
          )
          .optional(),
      })
    )
    .min(1, "At least one message is required"),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  modelOptions: z.record(z.unknown()).optional(),
  toolsEnabled: z.boolean().optional(),
});

export async function POST(req: Request) {
  const requestId = generateRequestId();

  try {
    const abortController = new AbortController();

    req.signal?.addEventListener("abort", () => {
      console.log(`🚫 Request ${requestId} aborted by client`);
      abortController.abort();
    });

    // Validate configuration
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
    console.log(
      "🔍 💥💥💥💥Request body received:",
      JSON.stringify(requestBody, null, 2)
    );

    // Validate request using AI SDK compatible schema
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
      toolsEnabled = true,
    } = validationResult.data;

    // Clean thinking tags from assistant messages only
    const cleanedMessages = messages.map((msg) => ({
      ...msg,
      content:
        msg.role === "assistant" && typeof msg.content === "string"
          ? cleanThinkingTags(msg.content)
          : msg.content,
    })) as CoreMessage[];

    console.log(
      "📨 Messages to be sent to AI SDK:",
      JSON.stringify(cleanedMessages, null, 2)
    );

    const { ollama: config } = aiConfig;
    const selectedModel = requestModel || config.model;
    const supportsTools = checkModelSupportsTools(selectedModel);
    const shouldUseTools = toolsEnabled && supportsTools;

    const finalOptions = {
      ...config.defaultOptions,
      ...modelOptions,
    };

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

    const defaultSystemPrompt = shouldUseTools
      ? `You are a helpful AI assistant. Provide clear, accurate, and helpful responses.`
      : `You are a helpful AI assistant. Note: This model (${selectedModel}) does not support tool/function calling or tools are disabled.`;

    const finalSystemPrompt =
      systemPrompt && systemPrompt.trim() ? systemPrompt : defaultSystemPrompt;

    AILogger.startRequest(requestId, selectedModel);

    // Test Ollama connection
    try {
      const testResponse = await fetch(`${config.baseURL}/api/tags`, {
        signal: abortController.signal,
      });
      if (!testResponse.ok) {
        throw new Error(`Ollama connection failed: ${testResponse.status}`);
      }
    } catch (connectionError) {
      if (abortController.signal.aborted) {
        return new Response("Request aborted", { status: 499 });
      }
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

    const ollama = createOpenAI({
      baseURL: `${config.baseURL}/v1`,
      apiKey: "ollama",
      compatibility: "compatible",
    });

    // Use AI SDK streamText with proper configuration
    const result = streamText({
      model: ollama(selectedModel),
      messages: cleanedMessages,
      system: finalSystemPrompt,
      maxRetries: config.maxRetries,
      abortSignal: abortController.signal,
      temperature: finalOptions.temperature || config.temperature,
      maxSteps: shouldUseTools ? 3 : 1,
      ...(shouldUseTools && { tools }),
      // AI SDK v5 handles experimental_attachments automatically
      // No need for manual processing
      onFinish: (event) => {
        AILogger.finishRequest(requestId, {
          promptTokens: event.usage?.promptTokens,
          completionTokens: event.usage?.completionTokens,
          totalTokens: event.usage?.totalTokens,
        });
      },
      onError: (error) => {
        console.error(`❌ Streaming error for request ${requestId}:`, error);
        AILogger.finishRequest(
          requestId,
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );
      },
    });

    // Return proper AI SDK streaming response
    return result.toDataStreamResponse({
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Request-ID": requestId,
        "X-Model": selectedModel,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      AILogger.finishRequest(
        requestId,
        undefined,
        new Error("Request aborted")
      );
      return new Response("Request aborted", { status: 499 });
    }

    console.error(`❌ Request ${requestId} failed:`, error);
    AILogger.finishRequest(
      requestId,
      undefined,
      error instanceof Error ? error : new Error("Unknown error")
    );

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
        requestId,
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
    const decimalPlaces = (options.top_p.toString().split(".")[1] || "").length;
    if (decimalPlaces > 1) {
      errors.push("top_p can only have 1 decimal place");
    }
  }

  return errors;
};
