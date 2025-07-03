"use client";

import { useChat } from "@ai-sdk/react";
import type { Message } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { OllamaModelOptions } from "@/types/ollama";
import {
  TOOL_SUPPORTED_MODELS,
  NO_TOOL_SUPPORT_MODELS,
  THINK_START_TAG,
  THINK_END_TAG,
  SUPPORTED_FILE_TYPES,
  MAX_CHAT_STEPS,
  DEFAULT_CHAT_STEPS,
} from "@/constants/chat-constants";
import { DEFAULT_OPTIONS } from "@/constants/model-config";
import { PREDEFINED_PROMPTS } from "@/constants/predefined-system-prompts";

import {
  Send,
  User,
  AlertCircle,
  RotateCcw,
  X,
  Brain,
  Paperclip,
  FileText,
  Image as ImageIcon,
  File,
} from "lucide-react";
import ModelSelector from "./ModelSelector";
import SystemPromptSelector from "./SystemPromptSelector";
import ModelConfigSelector from "./ModelConfigSelector";
import ToolSwitch from "./ToolSwitch";

// Custom hook for connection status
function useConnectionStatus() {
  const [status, setStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [serverInfo, setServerInfo] = useState<string>("");

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/health");
      if (response.ok || response.status === 206) {
        const data = await response.json();
        if (data.status === "healthy" || data.status === "partial") {
          setStatus("connected");
          if (data.details?.baseURL) {
            try {
              const url = new URL(data.details.baseURL);
              setServerInfo(`${url.hostname}:${url.port || "80"}`);
            } catch {
              setServerInfo(data.details.baseURL);
            }
          }
        } else {
          setStatus("disconnected");
        }
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return { status, serverInfo, checkConnection };
}

// Custom hook for persisted preferences
function usePersistedPreferences() {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>(
    PREDEFINED_PROMPTS[0].prompt
  );
  const [modelOptions, setModelOptions] =
    useState<OllamaModelOptions>(DEFAULT_OPTIONS); // Default to "balanced" preset
  const [modelSupportsTools, setModelSupportsTools] = useState<boolean>(true);
  const [isWarningDismissed, setIsWarningDismissed] = useState<boolean>(false);
  const [toolsEnabled, setToolsEnabled] = useState<boolean>(true);

  // Function to check if a model supports tools (copied from API)
  const checkModelSupportsTools = (modelName: string): boolean => {
    const lowerModelName = modelName.toLowerCase();

    if (
      NO_TOOL_SUPPORT_MODELS.some((model) =>
        lowerModelName.includes(model.toLowerCase())
      )
    ) {
      return false;
    }

    return TOOL_SUPPORTED_MODELS.some((model) =>
      lowerModelName.includes(model.toLowerCase())
    );
  };

  // Update tool support when model changes
  useEffect(() => {
    if (selectedModel) {
      setModelSupportsTools(checkModelSupportsTools(selectedModel));
      // Reset warning dismissal when model changes
      setIsWarningDismissed(false);
    }
  }, [selectedModel]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    const savedPrompt = localStorage.getItem("selectedSystemPrompt");
    const savedOptions = localStorage.getItem("modelOptions");
    const savedToolsEnabled = localStorage.getItem("toolsEnabled");

    if (savedModel) setSelectedModel(savedModel);
    if (savedPrompt) setSystemPrompt(savedPrompt);
    if (savedToolsEnabled !== null)
      setToolsEnabled(savedToolsEnabled === "true");
    if (savedOptions) {
      try {
        setModelOptions(JSON.parse(savedOptions));
      } catch (error) {
        console.error("Failed to parse saved model options:", error);
      }
    }
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    if (selectedModel) localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (systemPrompt)
      localStorage.setItem("selectedSystemPrompt", systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem("modelOptions", JSON.stringify(modelOptions));
  }, [modelOptions]);

  // Save toolsEnabled to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("toolsEnabled", String(toolsEnabled));
  }, [toolsEnabled]);

  return {
    selectedModel,
    setSelectedModel,
    systemPrompt,
    setSystemPrompt,
    modelOptions,
    setModelOptions,
    modelSupportsTools,
    isWarningDismissed,
    setIsWarningDismissed,
    toolsEnabled,
    setToolsEnabled,
  };
}

// Simplified markdown components
const markdownComponents: Components = {
  p: ({ children, ...props }) => (
    <p className='mb-2 last:mb-0' {...props}>
      {children}
    </p>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className?.includes("language-");
    return isInline ? (
      <code
        className='bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono'
        {...props}
      >
        {children}
      </code>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className='bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-2 mb-2 overflow-x-auto'
      {...props}
    >
      {children}
    </pre>
  ),
};

// Simplified thinking tag parser
function parseThinkingTags(content: string): (ContentPart | ThinkPart)[] {
  const parts: (ContentPart | ThinkPart)[] = [];
  let currentIndex = 0;

  while (currentIndex < content.length) {
    const thinkStart = content.indexOf(THINK_START_TAG, currentIndex);

    if (thinkStart === -1) {
      // No more thinking tags, add remaining content
      const remaining = content.slice(currentIndex).trim();
      if (remaining) {
        parts.push({ type: "content", text: remaining });
      }
      break;
    }

    // Add content before thinking tag
    if (thinkStart > currentIndex) {
      const beforeText = content.slice(currentIndex, thinkStart).trim();
      if (beforeText) {
        parts.push({ type: "content", text: beforeText });
      }
    }

    // Find end of thinking tag
    const thinkContentStart = thinkStart + THINK_START_TAG.length;
    const thinkEnd = content.indexOf(THINK_END_TAG, thinkContentStart);

    if (thinkEnd === -1) {
      // Incomplete thinking tag (streaming)
      const thinkContent = content.slice(thinkContentStart);
      if (thinkContent) {
        parts.push({ type: "think", text: thinkContent });
      }
      break;
    } else {
      // Complete thinking tag
      const thinkContent = content.slice(thinkContentStart, thinkEnd).trim();
      if (thinkContent) {
        parts.push({ type: "think", text: thinkContent });
      }
      currentIndex = thinkEnd + THINK_END_TAG.length;
    }
  }

  return parts.length > 0 ? parts : [{ type: "content", text: content }];
}

// Type definitions for tool invocations (based on AI SDK structure)
type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
};

// Type definitions for our custom parts
type ContentPart = {
  type: "content";
  text: string;
};

type ThinkPart = {
  type: "think";
  text: string;
};

type ToolPart = {
  type: "tool";
  toolInvocation: ToolInvocation;
};

type MessagePart = ContentPart | ThinkPart | ToolPart;

// Enhanced assistant message component that handles thinking tags and tool invocations
const AssistantMessage = React.memo(
  ({
    content,
    toolInvocations,
  }: {
    content: string;
    toolInvocations?: ToolInvocation[];
  }) => {
    const parts = parseThinkingTags(content);

    // If we have tool invocations, we need to integrate them into the flow
    if (toolInvocations && toolInvocations.length > 0) {
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
          {integratedParts.map((part, index) => (
            <div key={index}>
              {part.type === "think" ? (
                <div className='mb-3 p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20'>
                  <div className='text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide flex items-center gap-2'>
                    <Brain className='w-4 h-4' />
                    Thinking
                  </div>
                  <div className='text-purple-800 dark:text-purple-200 text-sm'>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={markdownComponents}
                    >
                      {part.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : part.type === "tool" ? (
                <div className='mb-3 border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20'>
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {part.text}
                </ReactMarkdown>
              )}
            </div>
          ))}
        </>
      );
    }

    // Fallback to original behavior if no tool invocations
    return (
      <>
        {parts.map((part, index) => (
          <div key={index}>
            {part.type === "think" ? (
              <div className='mb-3 p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20'>
                <div className='text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide flex items-center gap-2'>
                  <Brain className='w-4 h-4' />
                  Thinking
                </div>
                <div className='text-purple-800 dark:text-purple-200 text-sm'>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={markdownComponents}
                  >
                    {part.text}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {part.text}
              </ReactMarkdown>
            )}
          </div>
        ))}
      </>
    );
  }
);

AssistantMessage.displayName = "AssistantMessage";

// Helper function to get file icon based on mime type
const getFileIcon = (contentType: string) => {
  if (contentType.startsWith("image/")) {
    return <ImageIcon className='w-4 h-4' />;
  }
  if (contentType.includes("pdf")) {
    return <FileText className='w-4 h-4' />;
  }
  if (contentType.includes("text/")) {
    return <FileText className='w-4 h-4' />;
  }
  return <File className='w-4 h-4' />;
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// Component to preview attached files before sending
const AttachmentPreview = React.memo(
  ({ files, onRemove }: { files: FileList; onRemove: () => void }) => {
    const fileArray = Array.from(files);

    return (
      <div className='border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            {fileArray.length} file{fileArray.length !== 1 ? "s" : ""} attached
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
          {fileArray.map((file, index) => (
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
  }: {
    message: Message;
    connectionStatus: { status: string };
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
        className={`max-w-3xl px-4 py-3 rounded-2xl ${
          message.role === "user"
            ? "bg-blue-500 text-white ml-12"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
        }`}
      >
        <div className='prose prose-sm max-w-none dark:prose-invert'>
          {message.role === "assistant" ? (
            <>
              {/* Render content with integrated tool invocations and thinking */}
              <AssistantMessage
                content={message.content}
                toolInvocations={message.toolInvocations}
              />
            </>
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
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
  const [attachedFiles, setAttachedFiles] = useState<FileList | null>(null);

  // Use custom hooks for cleaner state management
  const connectionStatus = useConnectionStatus();
  const preferences = usePersistedPreferences();

  // Simplified chat hook usage
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    stop,
    setMessages,
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

  const handleFormSubmit = (e: React.FormEvent) => {
    connectionStatus.checkConnection();
    handleSubmit(e, {
      experimental_attachments: attachedFiles || undefined,
      allowEmptySubmit: true, // Allow sending files without text
    });
    // Clear attachments after sending
    setAttachedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    if (status === "streaming" || status === "submitted") {
      stop();
    }
    setMessages([]);
    setAttachedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    connectionStatus.checkConnection();
  };

  const handleCancel = () => {
    stop();
  };

  const isDisabled =
    status === "streaming" ||
    status === "submitted" ||
    connectionStatus.status === "disconnected";
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className='flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      {/* Header */}
      <div className='border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'>
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
                  AI Assistant
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
            </div>
          </div>
        </div>
      </div>

      {/* Tool Support Warning */}
      {preferences.selectedModel &&
        preferences.toolsEnabled &&
        !preferences.modelSupportsTools &&
        !preferences.isWarningDismissed && (
          <div className='border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'>
            <div className='max-w-4xl mx-auto px-4 py-3'>
              <div className='flex items-center justify-between text-amber-800 dark:text-amber-200'>
                <div className='flex items-center gap-2'>
                  <AlertCircle className='w-4 h-4' />
                  <span className='text-sm'>
                    <strong>{preferences.selectedModel}</strong> doesn&apos;t
                    support tools/function calling. Features like getting
                    current time won&apos;t be available. Consider using models
                    like llama3.2, qwen2.5, or mistral for full functionality.
                  </span>
                </div>
                <button
                  onClick={() => preferences.setIsWarningDismissed(true)}
                  className='ml-4 p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full transition-colors'
                  aria-label='Close warning'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Messages */}
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-4xl mx-auto px-4 py-6'>
          {messages.length === 0 ? (
            <div className='text-center py-12'>
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
                    <div className='max-w-3xl px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'>
                      <div className='flex items-center gap-2'>
                        <div className='flex space-x-1'>
                          <div className='w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                          <div className='w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                          <div className='w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce'></div>
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

      {/* Error message */}
      {error && (
        <div className='max-w-4xl mx-auto px-4 py-2'>
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3'>
            <p className='text-red-600 dark:text-red-400 text-sm'>
              Error: {error.message}
            </p>
          </div>
        </div>
      )}

      {/* Attachment preview */}
      {attachedFiles && attachedFiles.length > 0 && (
        <AttachmentPreview
          files={attachedFiles}
          onRemove={() => {
            setAttachedFiles(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />
      )}

      {/* Input form */}
      <div className='border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
          {/* Hidden file input */}
          <input
            type='file'
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setAttachedFiles(e.target.files);
              }
            }}
            multiple
            accept={SUPPORTED_FILE_TYPES}
            className='hidden'
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
                disabled={isDisabled}
                className='absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                title='Attach files'
              >
                <Paperclip className='w-5 h-5' />
              </button>
            </div>

            <button
              type={isStreaming ? "button" : "submit"}
              onClick={isStreaming ? handleCancel : undefined}
              disabled={
                (!isStreaming &&
                  !input.trim() &&
                  (!attachedFiles || attachedFiles.length === 0)) ||
                connectionStatus.status === "disconnected"
              }
              className={`px-4 py-3 rounded-xl transition-colors duration-200 flex items-center justify-center min-w-[52px] ${
                isStreaming
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white"
              }`}
              title={isStreaming ? "Cancel request" : "Send message"}
            >
              {isStreaming ? (
                <X className='w-5 h-5' />
              ) : (
                <Send className='w-5 h-5' />
              )}
            </button>
          </form>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 text-center'>
            Press Enter to send, Shift+Enter for new line • Supports images,
            PDFs, and text files
          </p>
        </div>
      </div>
    </div>
  );
}
