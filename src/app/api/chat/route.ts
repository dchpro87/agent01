/*
 * Chat API Route - Supports multimodal content following AI SDK v4 patterns
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
import { tools } from "@/lib/tools-main";
import { z } from "zod";
import { OllamaModelOptions } from "@/types/ollama";
import { CHROMADB_DEFAULTS } from "@/constraints/chromadb-constraints";
import {
  checkModelSupportsTools,
  ERROR_MESSAGES,
  VALIDATION_LIMITS,
  VALIDATION_ERROR_MESSAGES,
  HTTP_STATUS,
  HTTP_HEADERS,
  DEFAULT_SYSTEM_PROMPTS,
  MAX_CHAT_STEPS,
  DEFAULT_CHAT_STEPS,
} from "@/constraints/chat-constraints";

// Create configured OpenAI provider instance for Ollama compatibility
const openai = createOpenAI({
  baseURL: aiConfig.ollama.baseURL + "/v1",
  apiKey: "ollama", // Ollama doesn't require a real API key
  compatibility: "compatible", // Use compatible mode for 3rd party providers
});

// Simplified function to pass through message content (thinking functionality removed)
function cleanThinkingTags(
  content: string | Array<Record<string, unknown>>
): string | Array<Record<string, unknown>> {
  // Simply return content as-is since thinking functionality has been removed
  return content;
}

// Simplified function to query active ChromaDB collections
async function queryActiveCollections(
  collections: string[],
  query: string,
  chunksToRetrieve: number = CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE
): Promise<
  Array<{ id: string; document?: string; metadata?: Record<string, unknown> }>
> {
  if (!collections.length) return [];

  const allResults: Array<{
    id: string;
    document?: string;
    metadata?: Record<string, unknown>;
  }> = [];

  const queryPromises = collections.map(async (collectionName) => {
    try {
      const response = await fetch("http://localhost:3000/api/chromadb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "query_collection",
          collection: collectionName,
          query_texts: [query],
          n_results: chunksToRetrieve,
          generate_ollama_embeddings: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.success && data.results ? data.results : [];
      }
    } catch (error) {
      console.error(`Failed to query collection ${collectionName}:`, error);
    }
    return [];
  });

  try {
    const results = await Promise.all(queryPromises);
    results.forEach((result) => allResults.push(...result));
    return allResults.slice(0, chunksToRetrieve);
  } catch (error) {
    console.error("Error querying ChromaDB collections:", error);
    return [];
  }
}

// AI SDK compatible validation schema
const RequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system", "tool"]),
        content: z.union([
          z.string().min(1, ERROR_MESSAGES.MESSAGE_CONTENT_EMPTY),
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
            .min(1, ERROR_MESSAGES.CONTENT_PARTS_EMPTY),
        ]),
        // AI SDK v4 handles experimental_attachments automatically
        experimental_attachments: z
          .array(
            z.object({
              name: z.string(),
              contentType: z.string(),
              url: z.string().url(), // Ensure valid URL format (including data URLs)
            })
          )
          .optional(),
      })
    )
    .min(1, ERROR_MESSAGES.AT_LEAST_ONE_MESSAGE),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  modelOptions: z.record(z.unknown()).optional(),
  toolsEnabled: z.boolean().optional(),
  activeCollections: z.array(z.string()).optional(),
  chunksToRetrieve: z.number().min(1).max(30).optional(),
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
          error: ERROR_MESSAGES.INVALID_AI_CONFIG,
          details: configValidation.errors,
        }),
        {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON },
        }
      );
    }

    const requestBody = await req.json();
    console.log("---------------💥💥💥💥-------------------");
    console.log("🔍 Request body received:");
    console.log("- Messages count:", requestBody.messages?.length || 0);

    // Check for attachments in messages
    const hasAttachments = requestBody.messages?.some(
      (m: { experimental_attachments?: unknown[] }) =>
        m.experimental_attachments && m.experimental_attachments.length > 0
    );
    console.log("- Has attachments:", !!hasAttachments);

    if (hasAttachments) {
      const attachments = requestBody.messages.flatMap(
        (m: {
          experimental_attachments?: Array<{
            name: string;
            contentType: string;
            url: string;
          }>;
        }) => m.experimental_attachments || []
      );
      console.log(
        "- Attachment details:",
        attachments.map(
          (a: { name: string; contentType: string; url: string }) => ({
            name: a.name,
            contentType: a.contentType,
            urlLength: a.url?.length || 0,
            urlStart: a.url?.substring(0, 50) + "...",
          })
        )
      );
    }

    // Validate request using AI SDK compatible schema
    const validationResult = RequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: ERROR_MESSAGES.INVALID_REQUEST_FORMAT,
          details: validationResult.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        }),
        {
          status: HTTP_STATUS.BAD_REQUEST,
          headers: { "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON },
        }
      );
    }

    const {
      messages,
      model: requestModel,
      systemPrompt,
      modelOptions,
      toolsEnabled = true,
      activeCollections = [],
      chunksToRetrieve = CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE,
    } = validationResult.data;

    // Clean thinking tags from assistant messages only
    const cleanedMessages = messages.map((msg) => ({
      ...msg,
      content:
        msg.role === "assistant" && typeof msg.content === "string"
          ? cleanThinkingTags(msg.content)
          : msg.content,
    })) as CoreMessage[];

    console.log("\n-------------------------------------------");
    console.log(
      "📨 Messages to be sent to AI SDK:",
      JSON.stringify(cleanedMessages, null, 2)
    );
    console.log("-------------------------------------------");

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
          error: ERROR_MESSAGES.INVALID_MODEL_OPTIONS,
          details: modelOptionsErrors,
        }),
        {
          status: HTTP_STATUS.BAD_REQUEST,
          headers: { "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON },
        }
      );
    }

    // Build system prompt with context
    const baseSystemPrompt =
      systemPrompt?.trim() ||
      (shouldUseTools
        ? DEFAULT_SYSTEM_PROMPTS.WITH_TOOLS
        : DEFAULT_SYSTEM_PROMPTS.WITHOUT_TOOLS(selectedModel));

    // Add current timestamp
    const now = new Date();
    const timestamp = `The current date and time is ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}`;

    let finalSystemPrompt = `${baseSystemPrompt}\n\n${timestamp}`;

    // Add tool instruction if tools are enabled
    if (shouldUseTools) {
      finalSystemPrompt +=
        "\n\nUse any of the available tools paying attention to what parameters are required. After calling a tool and receiving the result, you MUST provide a clear and direct answer to the user using the information returned by the tool. Do not end the conversation after tool execution - always provide a final response summarizing the results.";
    } else {
      finalSystemPrompt +=
        "\n\nThe Assistant has NO access to tools of any kind. User should enable Tools icon in the top right of the UI.";
    }

    // Add ChromaDB context if available
    if (activeCollections.length > 0 && cleanedMessages.length > 0) {
      const lastUserMessage = cleanedMessages[cleanedMessages.length - 1];
      if (lastUserMessage.role === "user") {
        try {
          const query =
            typeof lastUserMessage.content === "string"
              ? lastUserMessage.content
              : "search query";

          const relevantDocs = await queryActiveCollections(
            activeCollections,
            query,
            chunksToRetrieve
          );
          console.log("🧨 Relevant documents found:", relevantDocs);

          if (relevantDocs.length > 0) {
            const contextPrompt = `\n\nRelevant context from knowledge base:\n${relevantDocs
              .map((doc, i) => `[${i + 1}] ${doc.document || doc.id}`)
              .join(
                "\n\n"
              )}\n\nAlways use this context to provide a more informed response.`;

            finalSystemPrompt += contextPrompt;
          }
        } catch (error) {
          console.error("Failed to query ChromaDB collections:", error);
          // Continue without context if ChromaDB fails
        }
      }
    }

    AILogger.startRequest(requestId, selectedModel);

    // Test Ollama connection using OpenAI-compatible endpoint
    try {
      const testResponse = await fetch(`${config.baseURL}/v1/models`, {
        signal: abortController.signal,
      });
      if (!testResponse.ok) {
        throw new Error(`Ollama connection failed: ${testResponse.status}`);
      }
    } catch (connectionError) {
      if (abortController.signal.aborted) {
        return new Response(ERROR_MESSAGES.REQUEST_ABORTED, {
          status: HTTP_STATUS.REQUEST_ABORTED,
        });
      }
      return new Response(
        JSON.stringify({
          error: ERROR_MESSAGES.OLLAMA_CONNECTION_FAILED,
          details:
            connectionError instanceof Error
              ? connectionError.message
              : "Unknown connection error",
        }),
        {
          status: HTTP_STATUS.SERVICE_UNAVAILABLE,
          headers: { "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON },
        }
      );
    }

    console.log("-------------------------------------------\n");
    console.log(`💥 System Prompt: ${finalSystemPrompt}\n`);
    console.log("-------------------------------------------\n");
    console.log("finalOptions:", finalOptions);
    console.log("-------------------------------------------");

    if (shouldUseTools) {
      const localToolNames = Object.keys(tools);
      console.log("🛠️  Available local tools:", localToolNames);
    }

    // Create streamText configuration following AI SDK v4 best practices
    const streamConfig = {
      model: openai(selectedModel),
      messages: cleanedMessages,
      system: finalSystemPrompt,
      maxRetries: config.maxRetries,
      abortSignal: abortController.signal,

      // Core AI SDK v4 parameters
      temperature: finalOptions.temperature || config.temperature,
      maxTokens: finalOptions.maxTokens || finalOptions.num_predict,
      topK: finalOptions.top_k,
      topP: finalOptions.top_p,
      presencePenalty: finalOptions.repeat_penalty,
      // frequencyPenalty: finalOptions.repeat_penalty,
      seed: finalOptions.seed,
      maxSteps: shouldUseTools ? MAX_CHAT_STEPS : DEFAULT_CHAT_STEPS,
      stopSequences: finalOptions.stop,

      // Add tools only if supported
      ...(shouldUseTools && { tools }),
      toolChoice: shouldUseTools ? ("auto" as const) : ("none" as const),

      // Provider-specific options for Ollama
      providerOptions: {
        openai: {
          // Map Ollama-specific options to OpenAI provider format
          ...(finalOptions.num_ctx && {
            // Pass num_ctx as context_length in the request body
            extra_body: {
              num_ctx: finalOptions.num_ctx,
            },
          }),
        },
      },

      // Enhanced callbacks for better tool handling
      onStepFinish: ({
        text,
        toolCalls,
        toolResults,
      }: {
        text?: string;
        toolCalls?: Array<{ toolName: string; args: Record<string, unknown> }>;
        toolResults?: Array<{ toolName: string; result: unknown }>;
        usage?: Record<string, unknown>;
      }) => {
        console.log(`📡 Step finished - Text: ${text?.substring(0, 100)}...`);
        console.log(`📡 Tool calls: ${toolCalls?.length || 0}`);
        console.log(`📡 Tool results: ${toolResults?.length || 0}`);
        if (toolCalls && toolCalls.length > 0) {
          console.log(
            "📡 Tool calls:",
            toolCalls.map(
              (tc: { toolName: string; args: Record<string, unknown> }) => ({
                name: tc.toolName,
                args: tc.args,
              })
            )
          );
        }
        if (toolResults && toolResults.length > 0) {
          console.log(
            "📡 Tool results:",
            toolResults.map((tr: { toolName: string; result: unknown }) => ({
              name: tr.toolName,
              resultLength: JSON.stringify(tr.result).length,
            }))
          );
        }
      },

      onFinish: (event: {
        usage?: {
          promptTokens?: number;
          completionTokens?: number;
          totalTokens?: number;
        };
        response?: {
          messages?: Array<unknown>;
        };
      }) => {
        AILogger.finishRequest(requestId, {
          promptTokens: event.usage?.promptTokens,
          completionTokens: event.usage?.completionTokens,
          totalTokens: event.usage?.totalTokens,
        });
        console.log("🏁 Request completed:", requestId, event.usage);
        if (event.response?.messages) {
          console.log(
            "🏁 Final response messages:",
            event.response.messages.length
          );
        }
      },

      onError: (error: unknown) => {
        console.error(`❌ Error in request ${requestId}:`, error);
        AILogger.finishRequest(
          requestId,
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );
      },
    };

    // Use AI SDK streamText with clean configuration
    const result = streamText(streamConfig);

    // Return AI SDK streaming response with clean configuration
    return result.toDataStreamResponse({
      headers: {
        "Cache-Control": HTTP_HEADERS.CACHE_CONTROL_NO_CACHE,
        Connection: HTTP_HEADERS.CONNECTION_KEEP_ALIVE,
        "X-Request-ID": requestId,
        "X-Model": selectedModel,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      AILogger.finishRequest(
        requestId,
        undefined,
        new Error(ERROR_MESSAGES.REQUEST_ABORTED)
      );
      return new Response(ERROR_MESSAGES.REQUEST_ABORTED, {
        status: HTTP_STATUS.REQUEST_ABORTED,
      });
    }

    console.error(`❌ Request ${requestId} failed:`, error);
    AILogger.finishRequest(
      requestId,
      undefined,
      error instanceof Error ? error : new Error("Unknown error")
    );

    return new Response(
      JSON.stringify({
        error: ERROR_MESSAGES.CHAT_REQUEST_FAILED,
        details: error instanceof Error ? error.message : "Unknown error",
        requestId,
      }),
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { "Content-Type": HTTP_HEADERS.CONTENT_TYPE_JSON },
      }
    );
  } finally {
    console.log(`🏁 Request ${requestId} processing completed`);
  }
}

const validateModelOptions = (options: OllamaModelOptions) => {
  const errors: string[] = [];

  const tokenLimit = options.maxTokens || options.num_predict;
  if (
    tokenLimit &&
    (tokenLimit < VALIDATION_LIMITS.MAX_TOKENS_MIN ||
      tokenLimit > VALIDATION_LIMITS.MAX_TOKENS_MAX)
  ) {
    errors.push(VALIDATION_ERROR_MESSAGES.MAX_TOKENS_RANGE);
  }

  if (
    options.num_ctx &&
    (options.num_ctx < VALIDATION_LIMITS.NUM_CTX_MIN ||
      options.num_ctx > VALIDATION_LIMITS.NUM_CTX_MAX)
  ) {
    errors.push(VALIDATION_ERROR_MESSAGES.NUM_CTX_RANGE);
  }

  if (
    options.temperature &&
    (options.temperature < VALIDATION_LIMITS.TEMPERATURE_MIN ||
      options.temperature > VALIDATION_LIMITS.TEMPERATURE_MAX)
  ) {
    errors.push(VALIDATION_ERROR_MESSAGES.TEMPERATURE_RANGE);
  }

  if (options.top_p !== undefined) {
    if (
      options.top_p < VALIDATION_LIMITS.TOP_P_MIN ||
      options.top_p > VALIDATION_LIMITS.TOP_P_MAX
    ) {
      errors.push(VALIDATION_ERROR_MESSAGES.TOP_P_RANGE);
    }
    const decimalPlaces = (options.top_p.toString().split(".")[1] || "").length;
    if (decimalPlaces > VALIDATION_LIMITS.TOP_P_MAX_DECIMALS) {
      errors.push(VALIDATION_ERROR_MESSAGES.TOP_P_DECIMALS);
    }
  }

  return errors;
};
