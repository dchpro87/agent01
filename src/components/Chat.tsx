"use client";

import { useChat } from "@ai-sdk/react";
import type { Message } from "@ai-sdk/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CHROMADB_DEFAULTS } from "@/constraints/chromadb-constraints";
import {
  SUPPORTED_FILE_TYPES,
  MAX_CHAT_STEPS,
  DEFAULT_CHAT_STEPS,
} from "@/constraints/chat-constraints";

import {
  Send,
  User,
  RotateCcw,
  X,
  Brain,
  Paperclip,
  Database,
  RotateCw,
} from "lucide-react";
import ModelSelector from "./ModelSelector";
import SystemPromptSelector from "./SystemPromptSelector";
import ModelConfigSelector from "./ModelConfigSelector";
import ToolSwitch from "./ToolSwitch";
import ContextWindowManager from "./ContextWindowManager";
import MessageComponent from "./Message";

// Import custom hooks
import { useConnectionStatus, usePersistedPreferences } from "@/hooks";

// Import utilities
import {
  getFileIcon,
  formatFileSize,
  processFiles,
  validateFiles,
  markdownComponents,
  parseThinkingTags,
} from "@/utils";

// Import types
import type { ToolInvocation, MessagePart } from "@/types/chat";

// Memoized Markdown renderer to reduce expensive operations
const MemoizedMarkdown = React.memo(({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeHighlight]}
    components={markdownComponents}
  >
    {content}
  </ReactMarkdown>
));

MemoizedMarkdown.displayName = "MemoizedMarkdown";

// Memoized thinking tag parser component
const MemoizedThinkingParser = React.memo(
  ({ content }: { content: string }) => {
    const parts = parseThinkingTags(content);
    const hasThinkingParts = parts.some((part) => part.type === "think");

    return (
      <>
        {parts.map((part, index) => {
          const isLastContentPart =
            part.type === "content" && index === parts.length - 1;
          const shouldShowHr =
            hasThinkingParts && isLastContentPart && index > 0;

          return (
            <div key={index} className='transition-all duration-300 ease-out'>
              {part.type === "think" ? (
                <div className='mb-3 p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20 transition-all duration-300 ease-out'>
                  <div className='text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide flex items-center gap-2'>
                    <Brain className='w-4 h-4' />
                    Thinking
                  </div>
                  <div className='text-purple-800 dark:text-purple-200 text-sm transition-all duration-300 ease-out'>
                    <MemoizedMarkdown content={part.text} />
                  </div>
                </div>
              ) : (
                <>
                  {shouldShowHr && (
                    <hr className='my-4 border-gray-300 dark:border-gray-600' />
                  )}
                  <div className='transition-all duration-300 ease-out'>
                    <MemoizedMarkdown content={part.text} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </>
    );
  }
);

MemoizedThinkingParser.displayName = "MemoizedThinkingParser";

// Add Message parts type - more comprehensive to match AI SDK
interface MessagePartType {
  type:
    | "text"
    | "tool-invocation"
    | "step-start"
    | "reasoning"
    | "source"
    | "file";
  text?: string;
  toolInvocation?: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: "partial-call" | "call" | "result";
    result?: unknown;
  };
  reasoning?: string;
}

// Enhanced assistant message component that handles thinking tags and tool invocations
const AssistantMessage = React.memo(
  ({
    content,
    toolInvocations,
  }: {
    content: string;
    toolInvocations?: ToolInvocation[];
  }) => {
    // If we have tool invocations, we need to integrate them into the flow
    if (toolInvocations && toolInvocations.length > 0) {
      const parts = parseThinkingTags(content);
      const integratedParts: MessagePart[] = [];
      let toolIndex = 0;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        integratedParts.push(part);

        // After thinking sections, insert tool invocations if available
        if (part.type === "think" && toolIndex < toolInvocations.length) {
          integratedParts.push({
            type: "tool",
            toolInvocation: toolInvocations[toolIndex],
          });
          toolIndex++;
        }
      }

      // Add any remaining tool invocations at the end
      while (toolIndex < toolInvocations.length) {
        integratedParts.push({
          type: "tool",
          toolInvocation: toolInvocations[toolIndex],
        });
        toolIndex++;
      }

      return (
        <>
          {integratedParts.map((part, index) => {
            const isLastContentPart =
              part.type === "content" && index === integratedParts.length - 1;
            const hasThinkingOrToolParts = integratedParts.some(
              (p) => p.type === "think" || p.type === "tool"
            );
            const shouldShowHr =
              hasThinkingOrToolParts && isLastContentPart && index > 0;

            return (
              <div key={index} className='transition-all duration-300 ease-out'>
                {part.type === "think" ? (
                  <div className='mb-3 p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20 transition-all duration-300 ease-out'>
                    <div className='text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide flex items-center gap-2'>
                      <Brain className='w-4 h-4' />
                      Thinking
                    </div>
                    <div className='text-purple-800 dark:text-purple-200 text-sm transition-all duration-300 ease-out'>
                      <MemoizedMarkdown content={part.text} />
                    </div>
                  </div>
                ) : part.type === "tool" ? (
                  <div className='mb-3 border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 transition-all duration-300 ease-out'>
                    <div className='text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide'>
                      🔧 Tool: {part.toolInvocation.toolName}
                    </div>
                    {part.toolInvocation.args &&
                      Object.keys(part.toolInvocation.args).length > 0 && (
                        <div className='text-xs text-blue-700 dark:text-blue-300 mb-2'>
                          <strong>Arguments:</strong>{" "}
                          {JSON.stringify(part.toolInvocation.args, null, 2)}
                        </div>
                      )}
                    {part.toolInvocation.state === "result" &&
                      "result" in part.toolInvocation && (
                        <div className='text-sm text-blue-800 dark:text-blue-200'>
                          <strong>Result:</strong>{" "}
                          {String(part.toolInvocation.result)}
                        </div>
                      )}
                    {part.toolInvocation.state === "call" && (
                      <div className='text-xs text-blue-600 dark:text-blue-400'>
                        <em>Calling tool...</em>
                      </div>
                    )}
                    {part.toolInvocation.state === "partial-call" && (
                      <div className='text-xs text-blue-600 dark:text-blue-400'>
                        <em>Preparing tool call...</em>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {shouldShowHr && (
                      <hr className='my-4 border-gray-300 dark:border-gray-600' />
                    )}
                    <div className='transition-all duration-300 ease-out'>
                      <MemoizedMarkdown content={part.text} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      );
    }

    // Fallback to optimized thinking parser
    return (
      <div className='transition-all duration-300 ease-out'>
        <MemoizedThinkingParser content={content} />
      </div>
    );
  }
);

AssistantMessage.displayName = "AssistantMessage";

// Component to render message parts (AI SDK recommended approach)
const MessageParts = React.memo(
  ({
    parts,
    addToolResult,
  }: {
    parts: MessagePartType[];
    addToolResult: (result: { toolCallId: string; result: string }) => void;
  }) => {
    // Check if there are any thinking or tool parts to determine if HR should be shown
    const hasThinkingOrToolParts = parts.some((part) => {
      if (part.type === "tool-invocation") return true;
      if (part.type === "text" && part.text) {
        const textParts = parseThinkingTags(part.text);
        return textParts.some((textPart) => textPart.type === "think");
      }
      return false;
    });

    return (
      <>
        {parts.map((part, index) => {
          switch (part.type) {
            case "text":
              // Handle thinking tags in text content with memoized parser
              const isLastTextPart = index === parts.length - 1;
              const textParts = parseThinkingTags(part.text || "");
              const hasThinkingInText = textParts.some(
                (textPart) => textPart.type === "think"
              );
              const shouldShowHrForText =
                hasThinkingOrToolParts &&
                isLastTextPart &&
                index > 0 &&
                !hasThinkingInText;

              return (
                <div
                  key={index}
                  className='transition-all duration-300 ease-out'
                >
                  {shouldShowHrForText && (
                    <hr className='my-4 border-gray-300 dark:border-gray-600' />
                  )}
                  <MemoizedThinkingParser content={part.text || ""} />
                </div>
              );

            case "tool-invocation":
              const toolInvocation = part.toolInvocation;
              if (!toolInvocation) return null;

              return (
                <div
                  key={index}
                  className='mb-3 border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 transition-all duration-300 ease-out'
                >
                  <div className='text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide'>
                    🔧 Tool: {toolInvocation.toolName}
                  </div>

                  {/* Handle different tool invocation states */}
                  {toolInvocation.state === "partial-call" && (
                    <div className='text-xs text-blue-600 dark:text-blue-400'>
                      <em>Preparing tool call...</em>
                      {toolInvocation.args &&
                        Object.keys(toolInvocation.args).length > 0 && (
                          <div className='mt-1'>
                            <strong>Arguments (partial):</strong>
                            <pre className='text-xs bg-blue-100 dark:bg-blue-800 p-1 rounded mt-1'>
                              {JSON.stringify(toolInvocation.args, null, 2)}
                            </pre>
                          </div>
                        )}
                    </div>
                  )}

                  {toolInvocation.state === "call" && (
                    <div>
                      {/* Handle interactive confirmation tool */}
                      {toolInvocation.toolName === "askForConfirmation" && (
                        <div className='text-sm text-blue-800 dark:text-blue-200'>
                          <div className='mb-2'>
                            <strong>Confirmation Required:</strong>
                          </div>
                          <div className='mb-2 p-2 bg-blue-100 dark:bg-blue-800 rounded'>
                            {String(toolInvocation.args.message || "")}
                          </div>
                          <div className='text-xs text-blue-600 dark:text-blue-400 mb-2'>
                            <strong>Action:</strong>{" "}
                            {String(toolInvocation.args.action || "")}
                          </div>
                          <div className='flex gap-2'>
                            <button
                              onClick={() =>
                                addToolResult({
                                  toolCallId: toolInvocation.toolCallId,
                                  result: "Yes, confirmed.",
                                })
                              }
                              className='px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm'
                            >
                              Yes
                            </button>
                            <button
                              onClick={() =>
                                addToolResult({
                                  toolCallId: toolInvocation.toolCallId,
                                  result: "No, denied.",
                                })
                              }
                              className='px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm'
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Handle other tools in call state */}
                      {toolInvocation.toolName !== "askForConfirmation" && (
                        <div className='text-xs text-blue-600 dark:text-blue-400'>
                          <em>Calling tool...</em>
                          {toolInvocation.args &&
                            Object.keys(toolInvocation.args).length > 0 && (
                              <div className='mt-1'>
                                <strong>Arguments:</strong>
                                <pre className='text-xs bg-blue-100 dark:bg-blue-800 p-1 rounded mt-1'>
                                  {JSON.stringify(toolInvocation.args, null, 2)}
                                </pre>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {toolInvocation.state === "result" && (
                    <div className='text-sm text-blue-800 dark:text-blue-200'>
                      {toolInvocation.args &&
                        Object.keys(toolInvocation.args).length > 0 && (
                          <div className='text-xs text-blue-700 dark:text-blue-300 mb-2'>
                            <strong>Arguments:</strong>
                            <pre className='text-xs bg-blue-100 dark:bg-blue-800 p-1 rounded mt-1'>
                              {JSON.stringify(toolInvocation.args, null, 2)}
                            </pre>
                          </div>
                        )}
                      <div>
                        <strong>Result:</strong>
                        <div className='mt-1 p-2 bg-blue-100 dark:bg-blue-800 rounded'>
                          <MemoizedMarkdown
                            content={String(toolInvocation.result || "")}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );

            case "step-start":
              // Step boundaries without visual separator
              return null;

            default:
              // Handle unknown part types
              return (
                <div key={index} className='text-gray-500 text-sm'>
                  <em>Unknown message part type: {part.type}</em>
                  <pre className='text-xs mt-1 bg-gray-100 p-2 rounded'>
                    {JSON.stringify(part, null, 2)}
                  </pre>
                </div>
              );
          }
        })}
      </>
    );
  }
);

MessageParts.displayName = "MessageParts";

// Component to preview attached files before sending
const AttachmentPreview = React.memo(
  ({ files, onRemove }: { files: File[]; onRemove: () => void }) => {
    return (
      <div className='border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            {files.length} file{files.length !== 1 ? "s" : ""} attached
          </span>
          <button
            onClick={onRemove}
            className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            title='Remove all attachments'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
        <div className='flex flex-wrap gap-2'>
          {files.map((file, index) => (
            <div
              key={index}
              className='flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm'
            >
              {getFileIcon(file.type)}
              <span className='text-gray-700 dark:text-gray-300 truncate max-w-32'>
                {file.name}
              </span>
              <span className='text-gray-500 dark:text-gray-400 text-xs'>
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

AttachmentPreview.displayName = "AttachmentPreview";

// Component to display attachments in messages
const MessageAttachments = React.memo(
  ({
    attachments,
  }: {
    attachments?: Array<{
      name?: string;
      contentType?: string;
      url: string;
    }>;
  }) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className='mt-3 space-y-2'>
        {attachments.map((attachment, index) => {
          if (attachment.contentType?.startsWith("image/")) {
            return (
              <div
                key={index}
                className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'
              >
                <div className='relative max-w-full max-h-96'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.url}
                    alt={attachment.name || "Attached image"}
                    className='max-w-full h-auto max-h-96 object-contain'
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
                {attachment.name && (
                  <div className='px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400'>
                    {attachment.name}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div
                key={index}
                className='flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'
              >
                {getFileIcon(attachment.contentType || "")}
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  {attachment.name || "Attached file"}
                </span>
                {attachment.contentType && (
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    ({attachment.contentType})
                  </span>
                )}
              </div>
            );
          }
        })}
      </div>
    );
  }
);

MessageAttachments.displayName = "MessageAttachments";

// Simplified message item component
const MessageItem = React.memo(
  ({
    message,
    connectionStatus,
    onResend,
    isStreaming,
    addToolResult,
  }: {
    message: Message;
    connectionStatus: { status: string };
    onResend?: (message: Message) => void;
    isStreaming?: boolean;
    addToolResult: (result: { toolCallId: string; result: string }) => void;
  }) => (
    <div
      className={`flex gap-4 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.role === "assistant" && (
        <div className='flex-shrink-0'>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
              connectionStatus.status === "connected"
                ? "bg-green-500"
                : "bg-gray-500"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src='/ollama.svg'
              alt='Ollama'
              className='w-4 h-4 text-white'
              style={{ filter: "invert(1)" }}
            />
          </div>
        </div>
      )}

      <div
        className={`max-w-3xl px-4 py-3 rounded-2xl transition-all duration-300 ease-out ${
          message.role === "user"
            ? "bg-blue-500 text-white ml-12 relative"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
        }`}
      >
        {/* Resend button for user messages */}
        {message.role === "user" && onResend && (
          <button
            onClick={() => onResend(message)}
            disabled={isStreaming}
            className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${
              isStreaming
                ? "bg-blue-400 cursor-not-allowed opacity-50"
                : "bg-blue-600 hover:bg-blue-700 opacity-100"
            } text-white`}
            title={
              isStreaming ? "Cannot resend while streaming" : "Edit message"
            }
          >
            <RotateCw className='w-4 h-4' />
          </button>
        )}

        <div
          className={`prose prose-sm max-w-none dark:prose-invert transition-all duration-300 ease-out ${
            message.role === "user" && onResend ? "pr-8" : ""
          }`}
        >
          {message.role === "assistant" ? (
            <>
              {/* Render message parts (recommended by AI SDK) */}
              {message.parts && message.parts.length > 0 ? (
                <>
                  <MessageParts
                    parts={message.parts as MessagePartType[]}
                    addToolResult={addToolResult}
                  />
                </>
              ) : (
                /* Fallback to legacy content rendering */
                <>
                  <AssistantMessage
                    content={message.content}
                    toolInvocations={message.toolInvocations}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <MemoizedMarkdown content={message.content} />
              {/* Render user attachments */}
              <MessageAttachments
                attachments={message.experimental_attachments}
              />
            </>
          )}
        </div>
      </div>

      {message.role === "user" && (
        <div className='flex-shrink-0'>
          <div className='w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center'>
            <User className='w-4 h-4 text-white' />
          </div>
        </div>
      )}
    </div>
  )
);

MessageItem.displayName = "MessageItem";

// Main Chat component - significantly simplified
export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[] | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);

  // Context window dialog state
  const [isContextDialogOpen, setIsContextDialogOpen] =
    useState<boolean>(false);

  // Active collections for context augmentation
  const [activeCollections, setActiveCollections] = useState<Set<string>>(
    new Set()
  );

  // Number of chunks to retrieve from each collection
  const [chunksToRetrieve, setChunksToRetrieve] = useState<number>(
    CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE
  );

  // Use custom hooks for cleaner state management
  const connectionStatus = useConnectionStatus();
  const preferences = usePersistedPreferences();

  // Memoize collections data
  const activeCollectionsArray = useMemo(
    () => Array.from(activeCollections),
    [activeCollections]
  );

  // Enhanced chat hook usage with proper tool handling
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    stop,
    setMessages,
    addToolResult,
  } = useChat({
    api: "/api/chat",
    maxSteps:
      preferences.toolsEnabled && preferences.modelSupportsTools
        ? MAX_CHAT_STEPS
        : DEFAULT_CHAT_STEPS, // Allow for tool calls and follow-up responses only if tools are enabled
    body: {
      model: preferences.selectedModel,
      systemPrompt: preferences.systemPrompt,
      modelOptions: preferences.modelOptions,
      toolsEnabled: preferences.toolsEnabled,
      activeCollections: activeCollectionsArray,
      chunksToRetrieve: chunksToRetrieve,
    },
    // Handle client-side tools that should be automatically executed
    async onToolCall({ toolCall }) {
      console.log("Client-side tool call:", toolCall);

      // Example: Handle getCurrentTime as a client-side tool
      if (toolCall.toolName === "getCurrentTime") {
        const args = toolCall.args as { timezone?: string };

        try {
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            weekday: "long",
            ...(args.timezone && { timeZone: args.timezone }),
          };
          const timeString = now.toLocaleString("en-US", options);
          const timezoneInfo = args.timezone
            ? ` in ${args.timezone}`
            : " (local time)";
          return `The current date and time${timezoneInfo} is: ${timeString}`;
        } catch (error) {
          return `Error getting time: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
        }
      }

      // Return undefined for tools that should be handled server-side
      return undefined;
    },
    onError: (err) => {
      console.error("💥Chat error:", err);
      connectionStatus.checkConnection();
    },
    onFinish: () => {
      connectionStatus.checkConnection();
    },
    onResponse: async (response) => {
      if (response.status === 503) {
        connectionStatus.checkConnection();
      } else if (response.ok) {
        connectionStatus.checkConnection();
      }
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Focus input after streaming completes
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [status, messages.length]);

  // Memoize expensive calculations
  const isDisabled = useMemo(
    () =>
      status === "streaming" ||
      status === "submitted" ||
      connectionStatus.status === "disconnected",
    [status, connectionStatus.status]
  );

  const isStreaming = useMemo(
    () => status === "streaming" || status === "submitted",
    [status]
  );

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      connectionStatus.checkConnection();

      // Convert File[] to DataTransfer/FileList format for the API
      let fileList: FileList | undefined;
      if (attachedFiles && attachedFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        attachedFiles.forEach((file) => dataTransfer.items.add(file));
        fileList = dataTransfer.files;
      }

      handleSubmit(e, {
        experimental_attachments: fileList,
        allowEmptySubmit: true, // Allow sending files without text
      });
      // Clear attachments and file error after sending
      setAttachedFiles(null);
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [attachedFiles, handleSubmit, connectionStatus]
  );

  const handleReset = useCallback(() => {
    if (status === "streaming" || status === "submitted") {
      stop();
    }
    setMessages([]);
    setAttachedFiles(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    connectionStatus.checkConnection();
  }, [status, stop, setMessages, connectionStatus]);

  const handleCancel = useCallback(() => {
    stop();
  }, [stop]);

  const handleResend = useCallback(
    (message: Message) => {
      // Prevent resending if currently streaming
      if (isStreaming) {
        return;
      }

      // Extract content from the message - AI SDK Message.content is typically a string
      let messageContent = "";
      if (typeof message.content === "string") {
        messageContent = message.content;
      } else {
        // For non-string content, convert to string representation
        messageContent = String(message.content);
      }

      // If there's no content to resend, show an error
      if (!messageContent.trim()) {
        setFileError("Cannot resend message: no text content found.");
        return;
      }

      // Clear any existing file error
      setFileError(null);

      // If the message has attachments, show a note about reattaching
      if (
        message.experimental_attachments &&
        message.experimental_attachments.length > 0
      ) {
        setFileError(
          "Note: Original attachments cannot be resent automatically. Please reattach files if needed."
        );
      }

      // Populate the input field with the message content
      // Use the handleInputChange function to update the input state
      const syntheticEvent = {
        target: { value: messageContent },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticEvent);

      // Focus the input field
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [isStreaming, handleInputChange]
  );

  // Memoize file input handler
  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setIsProcessingFiles(true);
        setFileError(null);

        try {
          // Process files (resize images)
          const processedFiles = await processFiles(e.target.files);

          // Validate processed files
          const validation = validateFiles(processedFiles);
          if (validation.isValid) {
            setAttachedFiles(processedFiles);
            setFileError(null);
          } else {
            setFileError(validation.error || "Invalid file");
            setAttachedFiles(null);
            // Clear the input so user can try again
            e.target.value = "";
          }
        } catch (error) {
          console.error("Error processing files:", error);
          setFileError("Failed to process files. Please try again.");
          setAttachedFiles(null);
          e.target.value = "";
        } finally {
          setIsProcessingFiles(false);
        }
      }
    },
    []
  );

  // Memoize attachment removal handler
  const handleRemoveAttachments = useCallback(() => {
    setAttachedFiles(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className='flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      {/* Header */}
      <div className='fixed top-0 left-0 right-0 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg transition-colors duration-200 bg-transparent'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src='/ollama.svg'
                  alt='Ollama'
                  className='w-8 h-8 transition-colors duration-200'
                  style={{
                    filter:
                      connectionStatus.status === "connected"
                        ? "invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(119%) contrast(119%)" // Green filter
                        : "invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)", // Gray filter
                  }}
                />
              </div>
              <div>
                <h1 className='text-xl font-semibold text-gray-900 dark:text-white'>
                  AI Monkey
                </h1>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {connectionStatus.serverInfo || "Ollama Disconnected"}
                </p>
              </div>

              {/* Reset Button */}
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  disabled={isStreaming}
                  className='ml-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                  title='Reset conversation'
                >
                  <RotateCcw className='w-4 h-4' />
                  Reset
                </button>
              )}
            </div>

            {/* Model Configuration */}
            <div className='flex-1 flex justify-center items-center gap-4'>
              <ModelSelector
                selectedModel={preferences.selectedModel}
                onModelChange={preferences.setSelectedModel}
                disabled={isDisabled}
              />
              <SystemPromptSelector
                selectedPrompt={preferences.systemPrompt}
                onPromptChange={preferences.setSystemPrompt}
                disabled={isDisabled}
              />
              <ModelConfigSelector
                selectedOptions={preferences.modelOptions}
                onOptionsChange={preferences.setModelOptions}
                disabled={isDisabled}
              />
              <ToolSwitch
                enabled={preferences.toolsEnabled}
                onChange={preferences.setToolsEnabled}
                disabled={isDisabled}
                modelSupportsTools={preferences.modelSupportsTools}
              />
              {/* Context Window Icon */}
              <div className='relative flex items-center gap-1'>
                <button
                  onClick={() => setIsContextDialogOpen(true)}
                  disabled={isDisabled}
                  className={`relative p-2 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeCollections.size > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  title={`Context Window Management${
                    activeCollections.size > 0
                      ? ` (${activeCollections.size} active, ${chunksToRetrieve} chunks each)`
                      : ` (${chunksToRetrieve} chunks per collection)`
                  }`}
                >
                  <Database className='w-5 h-5' />
                </button>
                {/* Collection count and chunk size indicators */}
                {activeCollections.size > 0 && (
                  <div className='flex items-center gap-1'>
                    <span className='bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium'>
                      {activeCollections.size}
                    </span>
                    <span className='bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium'>
                      {chunksToRetrieve}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Support Warning */}
      {preferences.selectedModel &&
        preferences.toolsEnabled &&
        !preferences.modelSupportsTools &&
        !preferences.isWarningDismissed && (
          <div className='fixed top-[73px] left-0 right-0 border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 z-30'>
            <div className='max-w-4xl mx-auto px-4 py-3'>
              <MessageComponent
                message={`${preferences.selectedModel} doesn't support tools/function calling. Features like getting current time won't be available. Consider using models like llama3.2, qwen2.5, or mistral for full functionality.`}
                type='warning'
                isVisible={true}
                onClose={() => preferences.setIsWarningDismissed(true)}
                autoHide={false}
              />
            </div>
          </div>
        )}

      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto ${
          preferences.selectedModel &&
          preferences.toolsEnabled &&
          !preferences.modelSupportsTools &&
          !preferences.isWarningDismissed
            ? "pt-[130px]" // Header + warning
            : "pt-[73px]" // Just header
        } ${
          (attachedFiles && attachedFiles.length > 0) || error || fileError
            ? "pb-[240px]" // Extra bottom padding when attachment preview or error is shown
            : "pb-[140px]" // Normal bottom padding
        }`}
      >
        <div className='max-w-4xl mx-auto px-4 py-6'>
          {messages.length === 0 ? (
            <div className='text-center pt-24 pb-32'>
              <h2 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                Welcome to your AI Assistant
              </h2>
              <p className='text-gray-500 dark:text-gray-400 mb-4'>
                Start a conversation by typing a message below.
              </p>

              {connectionStatus.status === "disconnected" && (
                <div className='max-w-md mx-auto p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
                  <h3 className='text-sm font-medium text-amber-800 dark:text-amber-200 mb-2'>
                    Ollama Connection Required
                  </h3>
                  <p className='text-sm text-amber-700 dark:text-amber-300 mb-3'>
                    Make sure Ollama is running and has a model installed.
                  </p>
                  <div className='text-xs text-amber-600 dark:text-amber-400 space-y-1'>
                    <div>
                      1. Install Ollama from{" "}
                      <a
                        href='https://ollama.ai'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='underline'
                      >
                        ollama.ai
                      </a>
                    </div>
                    <div>
                      2. Run:{" "}
                      <code className='bg-amber-100 dark:bg-amber-800 px-1 rounded'>
                        ollama pull llama3.2:3b
                      </code>
                    </div>
                    <div>
                      3. Start:{" "}
                      <code className='bg-amber-100 dark:bg-amber-800 px-1 rounded'>
                        ollama serve
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-6'>
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  connectionStatus={connectionStatus}
                  onResend={handleResend}
                  isStreaming={isStreaming}
                  addToolResult={addToolResult}
                />
              ))}

              {/* Loading indicator - only show when waiting for response, not when streaming */}
              {isStreaming &&
                messages.length > 0 &&
                messages[messages.length - 1].role === "user" && (
                  <div className='flex gap-4 justify-start'>
                    <div className='flex-shrink-0'>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                          connectionStatus.status === "connected"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src='/ollama.svg'
                          alt='Ollama'
                          className='w-4 h-4 text-white'
                          style={{ filter: "invert(1)" }}
                        />
                      </div>
                    </div>
                    <div className='max-w-3xl px-4 py-3 rounded-2xl transition-all duration-300 ease-out bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'>
                      <div className='flex items-center gap-2'>
                        <div className='flex space-x-1'>
                          <div className='w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                          <div className='w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                          <div className='w-2 h- bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce'></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* File size error message */}
      {fileError && (
        <div className='fixed bottom-[140px] left-0 right-0 z-40'>
          <div className='max-w-4xl mx-auto px-4 py-2'>
            <MessageComponent
              message={fileError}
              type='error'
              isVisible={!!fileError}
              onClose={() => setFileError(null)}
              autoHide={true}
              autoHideDelay={5000}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className='fixed bottom-[140px] left-0 right-0 z-40'>
          <div className='max-w-4xl mx-auto px-4 py-2'>
            <MessageComponent
              message={`Error: ${error.message}`}
              type='error'
              isVisible={!!error}
              onClose={() => {
                // Clear the error by reloading the page or taking appropriate action
                window.location.reload();
              }}
              autoHide={true}
              autoHideDelay={5000}
            />
          </div>
        </div>
      )}

      {/* Attachment preview */}
      {attachedFiles && attachedFiles.length > 0 && (
        <div className='fixed bottom-[140px] left-0 right-0 z-40'>
          <AttachmentPreview
            files={attachedFiles}
            onRemove={handleRemoveAttachments}
          />
        </div>
      )}

      {/* Input form */}
      <div className='fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-30'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
          {/* Hidden file input */}
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept={SUPPORTED_FILE_TYPES}
            className='hidden'
            disabled={isDisabled || isProcessingFiles}
          />

          <form onSubmit={handleFormSubmit} className='flex gap-3'>
            <div className='flex-1 relative'>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder={
                  connectionStatus.status === "disconnected"
                    ? "Please check Ollama connection..."
                    : "Type your message..."
                }
                className='w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[52px] max-h-32 disabled:opacity-50'
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
                disabled={isDisabled}
              />

              {/* Attachment button */}
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                disabled={isDisabled || isProcessingFiles}
                className='absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                title={
                  isProcessingFiles
                    ? "Processing files..."
                    : "Attach files (images, PDFs)"
                }
              >
                {isProcessingFiles ? (
                  <div className='w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin' />
                ) : (
                  <Paperclip className='w-5 h-5' />
                )}
              </button>
            </div>

            <button
              type={isStreaming ? "button" : "submit"}
              onClick={isStreaming ? handleCancel : undefined}
              disabled={
                (!isStreaming &&
                  !input.trim() &&
                  (!attachedFiles || attachedFiles.length === 0)) ||
                connectionStatus.status === "disconnected" ||
                isProcessingFiles
              }
              className={`px-4 py-3 rounded-xl transition-colors duration-200 flex items-center justify-center min-w-[52px] ${
                isStreaming
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : isProcessingFiles
                  ? "bg-yellow-500 text-white cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white"
              }`}
              title={
                isStreaming
                  ? "Cancel request"
                  : isProcessingFiles
                  ? "Processing files..."
                  : "Send message"
              }
            >
              {isStreaming ? (
                <X className='w-5 h-5' />
              ) : isProcessingFiles ? (
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : (
                <Send className='w-5 h-5' />
              )}
            </button>
          </form>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 text-center'>
            Press Enter to send, Shift+Enter for new line • Supports images &
            PDFs • Images are automatically resized to 896x896px for optimal
            processing
          </p>
        </div>
      </div>

      {/* Context Window Management Dialog */}
      <ContextWindowManager
        isOpen={isContextDialogOpen}
        onClose={() => setIsContextDialogOpen(false)}
        activeCollections={activeCollections}
        onActiveCollectionsChange={setActiveCollections}
        chunksToRetrieve={chunksToRetrieve}
        onChunksToRetrieveChange={setChunksToRetrieve}
      />
    </div>
  );
}
