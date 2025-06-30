"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { OllamaModelOptions } from "@/types/ollama";

import {
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  X,
  Brain,
} from "lucide-react";
import ModelSelector from "./ModelSelector";
import SystemPromptSelector from "./SystemPromptSelector";
import ModelConfigSelector from "./ModelConfigSelector";

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
    "You are Sarah, a helpful AI assistant with a warm and nurturing personality. You're naturally organized, detail-oriented, and always ready to lend a helping hand. Provide clear, accurate, and helpful responses with a caring touch. If you need more clarification, say so, or ask for it."
  );
  const [modelOptions, setModelOptions] = useState<OllamaModelOptions>({
    temperature: 0.7,
    top_k: 40,
    top_p: 0.9,
    repeat_penalty: 1.1,
    num_ctx: 4096,
    num_predict: 512,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    const savedPrompt = localStorage.getItem("selectedSystemPrompt");
    const savedOptions = localStorage.getItem("modelOptions");

    if (savedModel) setSelectedModel(savedModel);
    if (savedPrompt) setSystemPrompt(savedPrompt);
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

  return {
    selectedModel,
    setSelectedModel,
    systemPrompt,
    setSystemPrompt,
    modelOptions,
    setModelOptions,
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
function parseThinkingTags(content: string) {
  const parts = [];
  const thinkStartTag = "<think>";
  const thinkEndTag = "</think>";
  let currentIndex = 0;

  while (currentIndex < content.length) {
    const thinkStart = content.indexOf(thinkStartTag, currentIndex);

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
    const thinkContentStart = thinkStart + thinkStartTag.length;
    const thinkEnd = content.indexOf(thinkEndTag, thinkContentStart);

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
      currentIndex = thinkEnd + thinkEndTag.length;
    }
  }

  return parts.length > 0 ? parts : [{ type: "content", text: content }];
}

// Simplified assistant message component
const AssistantMessage = React.memo(({ content }: { content: string }) => {
  const parts = parseThinkingTags(content);

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
});

AssistantMessage.displayName = "AssistantMessage";

// Simplified message item component
const MessageItem = React.memo(
  ({ message }: { message: { id: string; role: string; content: string } }) => (
    <div
      className={`flex gap-4 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.role === "assistant" && (
        <div className='flex-shrink-0'>
          <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
            <Bot className='w-4 h-4 text-white' />
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
            <AssistantMessage content={message.content} />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
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
    body: {
      model: preferences.selectedModel,
      systemPrompt: preferences.systemPrompt,
      modelOptions: preferences.modelOptions,
    },
    onError: (err) => {
      console.error("Chat error:", err);
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
    handleSubmit(e);
  };

  const handleReset = () => {
    if (status === "streaming" || status === "submitted") {
      stop();
    }
    setMessages([]);
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
              <div className='p-2 bg-blue-500 rounded-lg'>
                <Bot className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-xl font-semibold text-gray-900 dark:text-white'>
                  AI Assistant
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Powered by Ollama
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
            </div>

            {/* Connection Status */}
            <div className='flex items-start gap-2'>
              {connectionStatus.status === "checking" && (
                <div className='flex items-center gap-2'>
                  <Loader2 className='w-4 h-4 animate-spin text-yellow-500' />
                  <span className='text-sm text-yellow-600 dark:text-yellow-400'>
                    Connecting...
                  </span>
                </div>
              )}
              {connectionStatus.status === "connected" && (
                <div className='flex flex-col items-start'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500' />
                    <span className='text-sm text-green-600 dark:text-green-400'>
                      Connected
                    </span>
                  </div>
                  {connectionStatus.serverInfo && (
                    <span className='text-[8px] text-gray-500 dark:text-gray-400 ml-6'>
                      {connectionStatus.serverInfo}
                    </span>
                  )}
                </div>
              )}
              {connectionStatus.status === "disconnected" && (
                <div className='flex items-center gap-2'>
                  <AlertCircle className='w-4 h-4 text-red-500' />
                  <span className='text-sm text-red-600 dark:text-red-400'>
                    Disconnected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-4xl mx-auto px-4 py-6'>
          {messages.length === 0 ? (
            <div className='text-center py-12'>
              <Bot className='w-12 h-12 text-gray-400 mx-auto mb-4' />
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
                <MessageItem key={message.id} message={message} />
              ))}

              {/* Loading indicator - only show when waiting for response, not when streaming */}
              {isStreaming &&
                messages.length > 0 &&
                messages[messages.length - 1].role === "user" && (
                  <div className='flex gap-4 justify-start'>
                    <div className='flex-shrink-0'>
                      <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                        <Bot className='w-4 h-4 text-white' />
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

      {/* Input form */}
      <div className='border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
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
                className='w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[52px] max-h-32 disabled:opacity-50'
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
                disabled={isDisabled}
              />
            </div>
            <button
              type={isStreaming ? "button" : "submit"}
              onClick={isStreaming ? handleCancel : undefined}
              disabled={
                !isStreaming &&
                (!input.trim() || connectionStatus.status === "disconnected")
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
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
