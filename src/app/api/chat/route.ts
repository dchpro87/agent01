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
import { streamText, CoreMessage, experimental_createMCPClient } from "ai";

import { AILogger, generateRequestId } from "@/lib/ai-middleware";
import { aiConfig, validateConfig } from "@/lib/ai-config";
import { tools } from "@/lib/tools-main";
import { z } from "zod";
import { OllamaModelOptions } from "@/types/ollama";
import { CHROMADB_DEFAULTS } from "@/constraints/chromadb-constraints";
import {
  THINK_START_TAG,
  THINK_END_TAG,
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

// Function to create MCP client and get tools
async function getMCPTools() {
  try {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      console.warn("⚠️  FIRECRAWL_API_KEY not found in environment variables");
      return { tools: {}, clients: [] };
    }

    const client = await experimental_createMCPClient({
      transport: {
        type: "sse",
        url: `https://mcp.firecrawl.dev/${firecrawlApiKey}/sse`,
      },
    });

    const mcpTools = await client.tools();

    console.log("🔧 MCP Tools retrieved:", Object.keys(mcpTools));

    return { tools: mcpTools, clients: [client] };
  } catch (error) {
    console.error("❌ Failed to connect to MCP server:", error);
    return { tools: {}, clients: [] };
  }
}

// Function to clean thinking tags from message content
function cleanThinkingTags(
  content: string | Array<Record<string, unknown>>
): string | Array<Record<string, unknown>> {
  if (typeof content === "string") {
    let result = content;

    while (true) {
      const thinkStart = result.indexOf(THINK_START_TAG);
      if (thinkStart === -1) break;

      const thinkEnd = result.indexOf(
        THINK_END_TAG,
        thinkStart + THINK_START_TAG.length
      );
      if (thinkEnd === -1) break;

      result =
        result.slice(0, thinkStart) +
        result.slice(thinkEnd + THINK_END_TAG.length);
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

// Function to query active ChromaDB collections
async function queryActiveCollections(
  collections: string[],
  query: string,
  chunksToRetrieve: number = CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE
): Promise<
  Array<{ id: string; document?: string; metadata?: Record<string, unknown> }>
> {
  const allResults: Array<{
    id: string;
    document?: string;
    metadata?: Record<string, unknown>;
  }> = [];

  try {
    // Use the same base URL as the ChromaDB API route
    for (const collectionName of collections) {
      try {
        const response = await fetch("http://localhost:3000/api/chromadb", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "query_collection",
            collection: collectionName,
            query_texts: [query],
            n_results: chunksToRetrieve, // Use dynamic value
            generate_ollama_embeddings: true, // Use our custom embedding function
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.results) {
            allResults.push(...data.results);
          }
        }
      } catch (error) {
        console.error(`Failed to query collection ${collectionName}:`, error);
        // Continue with other collections
      }
    }

    // Sort by relevance if available, otherwise just return all results
    return allResults.slice(0, chunksToRetrieve); // Limit total results to user-configured amount
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
  let mcpClients: Array<{ close: () => Promise<void> }> = [];

  try {
    const abortController = new AbortController();

    req.signal?.addEventListener("abort", () => {
      console.log(`🚫 Request ${requestId} aborted by client`);
      abortController.abort();
    });

    // Get MCP tools early in the process
    const { tools: mcpTools, clients } = await getMCPTools();
    mcpClients = clients;

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
    console.log("-------------------------------------------");
    console.log(
      "🔍 💥Request body received:",
      JSON.stringify(requestBody, null, 2)
    );

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

    const defaultSystemPrompt = shouldUseTools
      ? DEFAULT_SYSTEM_PROMPTS.WITH_TOOLS
      : DEFAULT_SYSTEM_PROMPTS.WITHOUT_TOOLS(selectedModel);

    const baseSystemPrompt =
      systemPrompt && systemPrompt.trim() ? systemPrompt : defaultSystemPrompt;

    // Inject current date and time
    const now = new Date();
    const dateTimeString = `The current date and time is ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}`;

    const finalSystemPrompt = `${baseSystemPrompt}\n\n${dateTimeString}`;

    // Append tool-use instruction for selected personalities
    let finalSystemPromptWithContext = finalSystemPrompt;
    if (shouldUseTools) {
      const toolUseInstruction =
        "Use any of the available tools paying attention to what parameters are required. After calling a tool and receiving the result, you MUST provide a clear and direct answer to the user using the information returned by the tool. Do not end the conversation after tool execution - always provide a final response summarizing the results.";
      finalSystemPromptWithContext = `${finalSystemPrompt}\n\n${toolUseInstruction}`;
    }

    if (activeCollections.length > 0 && cleanedMessages.length > 0) {
      const lastUserMessage = cleanedMessages[cleanedMessages.length - 1];
      if (lastUserMessage.role === "user") {
        try {
          const relevantDocs = await queryActiveCollections(
            activeCollections,
            typeof lastUserMessage.content === "string"
              ? lastUserMessage.content
              : "search query",
            chunksToRetrieve
          );

          console.log("🧨 Relevant documents found:", relevantDocs);

          if (relevantDocs.length > 0) {
            const contextPrompt = `\n\nRelevant context from knowledge base:\n${relevantDocs
              .map(
                (doc: { id: string; document?: string }, i: number) =>
                  `[${i + 1}] ${doc.document || doc.id}`
              )
              .join(
                "\n\n"
              )}\n\Always use this context to provide a more informed response.`;

            finalSystemPromptWithContext = finalSystemPrompt + contextPrompt;
          }
        } catch (error) {
          console.error("Failed to query ChromaDB collections:", error);
          // Continue without context augmentation if ChromaDB fails
        }
      }
    }

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

    const ollama = createOpenAI({
      baseURL: `${config.baseURL}/v1`,
      apiKey: "ollama",
      compatibility: "compatible",
    });

    console.log("-------------------------------------------\n");
    console.log(`💥 System Prompt: ${finalSystemPromptWithContext}\n`);
    console.log("finalOptions:", finalOptions);
    console.log("-------------------------------------------");

    // Merge local tools with MCP tools
    const allTools = shouldUseTools ? { ...tools, ...mcpTools } : {};

    if (shouldUseTools) {
      const localToolNames = Object.keys(tools);
      const mcpToolNames = Object.keys(mcpTools);
      const overlapping = localToolNames.filter((name) =>
        mcpToolNames.includes(name)
      );

      if (overlapping.length > 0) {
        console.log(
          "⚠️  Tool name conflicts (MCP tools will override local):",
          overlapping
        );
      }

      console.log("🛠️  Local tools:", localToolNames);
      console.log("🌐 MCP tools:", mcpToolNames);
      console.log("🔧 Total available tools:", Object.keys(allTools));
    }

    // Use AI SDK streamText with proper configuration
    const result = streamText({
      model: ollama(selectedModel),
      messages: cleanedMessages,
      system: finalSystemPromptWithContext,
      maxRetries: config.maxRetries,
      abortSignal: abortController.signal,
      temperature: finalOptions.temperature || config.temperature,
      maxTokens: finalOptions.maxTokens || finalOptions.num_predict,
      topK: finalOptions.top_k,
      topP: finalOptions.top_p,
      presencePenalty: finalOptions.presence_penalty,
      frequencyPenalty: finalOptions.frequency_penalty,
      seed: finalOptions.seed,
      maxSteps: shouldUseTools ? MAX_CHAT_STEPS : DEFAULT_CHAT_STEPS,
      ...(shouldUseTools && { tools: allTools }),

      // Ollama-specific parameters passed through provider options (replaces experimental_providerMetadata in v4.2+)
      providerOptions: {
        ollama: {
          // Ollama-specific parameters that AI SDK doesn't directly support
          options: Object.fromEntries(
            Object.entries({
              repeat_penalty: finalOptions.repeat_penalty,
              repeat_last_n: finalOptions.repeat_last_n,
              num_ctx: finalOptions.num_ctx,
              num_keep: finalOptions.num_keep,
              num_batch: finalOptions.num_batch,
              num_gpu: finalOptions.num_gpu,
              main_gpu: finalOptions.main_gpu,
              numa: finalOptions.numa,
              use_mmap: finalOptions.use_mmap,
              num_thread: finalOptions.num_thread,
              tfs_z: finalOptions.tfs_z,
              mirostat: finalOptions.mirostat,
              mirostat_tau: finalOptions.mirostat_tau,
              mirostat_eta: finalOptions.mirostat_eta,
              penalize_newline: finalOptions.penalize_newline,
              min_p: finalOptions.min_p,
              typical_p: finalOptions.typical_p,
              stop: finalOptions.stop,
            }).filter(([, value]) => value !== undefined)
          ) as Record<string, number | boolean | string[]>,
        },
      },
      // AI SDK v5 handles experimental_attachments automatically
      // No need for manual processing
      onFinish: (event) => {
        AILogger.finishRequest(requestId, {
          promptTokens: event.usage?.promptTokens,
          completionTokens: event.usage?.completionTokens,
          totalTokens: event.usage?.totalTokens,
        });

        // Close MCP clients after streaming is complete
        if (mcpClients.length > 0) {
          Promise.all(mcpClients.map((client) => client.close()))
            .then(() =>
              console.log("🧹 MCP clients closed successfully after streaming")
            )
            .catch((closeError) =>
              console.error(
                "❌ Error closing MCP clients after streaming:",
                closeError
              )
            );
        }
      },
      onError: (error) => {
        console.error(`❌ Streaming error for request ${requestId}:`, error);
        AILogger.finishRequest(
          requestId,
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );

        // Close MCP clients on error as well
        if (mcpClients.length > 0) {
          Promise.all(mcpClients.map((client) => client.close()))
            .then(() =>
              console.log("🧹 MCP clients closed successfully after error")
            )
            .catch((closeError) =>
              console.error(
                "❌ Error closing MCP clients after error:",
                closeError
              )
            );
        }
      },
    });

    // Return proper AI SDK streaming response
    return result.toDataStreamResponse({
      headers: {
        "Cache-Control": HTTP_HEADERS.CACHE_CONTROL_NO_CACHE,
        Connection: HTTP_HEADERS.CONNECTION_KEEP_ALIVE,
        "X-Request-ID": requestId,
        "X-Model": selectedModel,
      },
    });
  } catch (error) {
    // Close MCP clients on early failure (before streaming starts)
    if (mcpClients.length > 0) {
      try {
        await Promise.all(mcpClients.map((client) => client.close()));
        console.log("🧹 MCP clients closed successfully after early failure");
      } catch (closeError) {
        console.error(
          "❌ Error closing MCP clients after early failure:",
          closeError
        );
      }
    }

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
    // MCP clients are now closed in onFinish/onError callbacks
    // to avoid closing them while tools might still be executing
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
