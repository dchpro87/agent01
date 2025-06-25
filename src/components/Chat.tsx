"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
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

// Component to handle assistant messages with thinking tags
function AssistantMessage({ content }: { content: string }) {
  // Parse the content to extract thinking sections and regular content
  const parseContent = (text: string) => {
    const parts = [];
    let currentIndex = 0;

    // Find all <think>...</think> tags (complete)
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    let match;

    while ((match = thinkRegex.exec(text)) !== null) {
      // Add content before the thinking tag
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index).trim();
        if (beforeText) {
          parts.push({ type: "content", text: beforeText });
        }
      }

      // Add the thinking content
      const thinkContent = match[1].trim();
      if (thinkContent) {
        parts.push({ type: "think", text: thinkContent });
      }

      currentIndex = match.index + match[0].length;
    }

    // Check for incomplete thinking tag (streaming)
    const remainingText = text.slice(currentIndex);
    const incompleteThinkMatch = remainingText.match(/<think>([\s\S]*)$/);

    if (incompleteThinkMatch) {
      // Add content before the incomplete thinking tag
      const beforeIncomplete = remainingText
        .slice(0, incompleteThinkMatch.index)
        .trim();
      if (beforeIncomplete) {
        parts.push({ type: "content", text: beforeIncomplete });
      }

      // Add the incomplete thinking content
      const incompleteThinkContent = incompleteThinkMatch[1];
      parts.push({
        type: "think",
        text: incompleteThinkContent,
        incomplete: true,
      });
    } else if (currentIndex < text.length) {
      // Add remaining content after the last thinking tag
      const remainingContent = remainingText.trim();
      if (remainingContent) {
        parts.push({ type: "content", text: remainingContent });
      }
    }

    // If no thinking tags found, treat as regular content
    if (parts.length === 0) {
      parts.push({ type: "content", text: text });
    }

    return parts;
  };

  const parts = parseContent(content);

  return (
    <>
      {parts.map((part, index) => (
        <div key={index}>
          {part.type === "think" ? (
            <div className='mb-3 p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20'>
              <div className='text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide flex items-center gap-2'>
                <Brain className='w-4 h-4 animate-pulse' />
                {part.incomplete && (
                  <div className='flex space-x-1'>
                    <div className='w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                    <div className='w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                    <div className='w-1 h-1 bg-purple-400 rounded-full animate-bounce'></div>
                  </div>
                )}
              </div>
              <div className='text-purple-800 dark:text-purple-200 text-sm'>
                {part.text.split("\n").map((line, lineIndex) => (
                  <p key={lineIndex} className='mb-2 last:mb-0'>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            part.text.split("\n").map((line, lineIndex) => (
              <p key={`${index}-${lineIndex}`} className='mb-2 last:mb-0'>
                {line}
              </p>
            ))
          )}
        </div>
      ))}
    </>
  );
}

export default function Chat() {
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      model: selectedModel,
    },
    onError: (err) => {
      console.error("Chat error:", err);
      setConnectionStatus("disconnected");
    },
    onFinish: () => {
      setConnectionStatus("connected");
    },
    // Custom headers for better streaming
    headers: {
      "Content-Type": "application/json",
    },
    // Handle network errors gracefully
    onResponse: async (response) => {
      if (response.status === 503) {
        setConnectionStatus("disconnected");
      } else if (response.status === 500) {
        // Server error, but connection might be ok
        console.warn("Server error occurred");
      } else if (response.ok) {
        setConnectionStatus("connected");
      }
    },
  });
  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/health");

        if (response.ok || response.status === 206) {
          const data = await response.json();
          if (data.status === "healthy" || data.status === "partial") {
            setConnectionStatus("connected");
          } else {
            setConnectionStatus("disconnected");
          }
        } else {
          setConnectionStatus("disconnected");
        }
      } catch {
        setConnectionStatus("disconnected");
      }
    };

    checkConnection();
  }, []);

  // Auto-scroll to bottom when messages change or when streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  // Focus input field after streaming is complete
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      // Small delay to ensure the UI has updated
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [status, messages.length]);

  const handleReset = () => {
    // Stop any ongoing requests
    if (status === "streaming" || status === "submitted") {
      stop();
    }
    // Clear all messages
    setMessages([]);
    // Reset connection status check
    setConnectionStatus("checking");
    // Re-check connection
    setTimeout(async () => {
      try {
        const response = await fetch("/api/health");
        if (response.ok || response.status === 206) {
          const data = await response.json();
          if (data.status === "healthy" || data.status === "partial") {
            setConnectionStatus("connected");
          } else {
            setConnectionStatus("disconnected");
          }
        } else {
          setConnectionStatus("disconnected");
        }
      } catch {
        setConnectionStatus("disconnected");
      }
    }, 100);
  };

  const handleCancel = () => {
    stop();
    setConnectionStatus("connected"); // Reset to connected since we're just canceling, not losing connection
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    setConnectionStatus("checking");
    handleSubmit(e);
  };

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
                  disabled={status === "streaming" || status === "submitted"}
                  className='ml-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                  title='Reset conversation'
                >
                  <RotateCcw className='w-4 h-4' />
                  Reset
                </button>
              )}
            </div>

            {/* Model Selector */}
            <div className='flex-1 flex justify-center'>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={
                  status === "streaming" ||
                  status === "submitted" ||
                  connectionStatus === "disconnected"
                }
              />
            </div>

            {/* Connection Status */}
            <div className='flex items-center gap-2'>
              {connectionStatus === "checking" && (
                <>
                  <Loader2 className='w-4 h-4 animate-spin text-yellow-500' />
                  <span className='text-sm text-yellow-600 dark:text-yellow-400'>
                    Connecting...
                  </span>
                </>
              )}
              {connectionStatus === "connected" && (
                <>
                  <CheckCircle className='w-4 h-4 text-green-500' />
                  <span className='text-sm text-green-600 dark:text-green-400'>
                    Connected
                  </span>
                </>
              )}
              {connectionStatus === "disconnected" && (
                <>
                  <AlertCircle className='w-4 h-4 text-red-500' />
                  <span className='text-sm text-red-600 dark:text-red-400'>
                    Disconnected
                  </span>
                </>
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

              {connectionStatus === "disconnected" && (
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
                <div
                  key={message.id}
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
                        message.content.split("\n").map((line, index) => (
                          <p key={index} className='mb-2 last:mb-0'>
                            {line}
                          </p>
                        ))
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
              ))}

              {/* Show loading dots when waiting for assistant response */}
              {(status === "submitted" ||
                (status === "streaming" &&
                  messages.length > 0 &&
                  messages[messages.length - 1]?.role === "user")) && (
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
                  connectionStatus === "disconnected"
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
                disabled={
                  status === "streaming" ||
                  status === "submitted" ||
                  connectionStatus === "disconnected"
                }
              />
            </div>
            <button
              type={
                status === "streaming" || status === "submitted"
                  ? "button"
                  : "submit"
              }
              onClick={
                status === "streaming" || status === "submitted"
                  ? handleCancel
                  : undefined
              }
              disabled={
                status !== "streaming" &&
                status !== "submitted" &&
                (!input.trim() || connectionStatus === "disconnected")
              }
              className={`px-4 py-3 rounded-xl transition-colors duration-200 flex items-center justify-center min-w-[52px] ${
                status === "streaming" || status === "submitted"
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50 ring-2 ring-red-500/20 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                  : "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white"
              }`}
              title={
                status === "streaming" || status === "submitted"
                  ? "Cancel request"
                  : "Send message"
              }
            >
              {status === "streaming" || status === "submitted" ? (
                <div className='relative'>
                  <X className='w-5 h-5' />
                  <div className='absolute inset-0 w-5 h-5 animate-ping'>
                    <X className='w-5 h-5 opacity-30' />
                  </div>
                </div>
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
