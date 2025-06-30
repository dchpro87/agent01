'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { OllamaModelOptions } from '@/types/ollama';

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
} from 'lucide-react';
import ModelSelector from './ModelSelector';
import SystemPromptSelector from './SystemPromptSelector';
import ModelConfigSelector from './ModelConfigSelector';

// Shared markdown components for performance
const markdownComponents: Components = {
  // Your existing markdown components...
  p: ({ children, ...props }) => (
    <p className='mb-2 last:mb-0' {...props}>
      {children}
    </p>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className?.includes('language-');
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
  // ...rest of your markdown components
};

// Thinking box components for performance
const thinkingComponents: Components = {
  ...markdownComponents,
  code: ({ children, className, ...props }) => {
    const isInline = !className?.includes('language-');
    return isInline ? (
      <code
        className='bg-purple-100 dark:bg-purple-800 px-1 py-0.5 rounded text-xs font-mono'
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
      className='bg-purple-100 dark:bg-purple-800 p-2 rounded mt-2 mb-2 overflow-x-auto text-xs'
      {...props}
    >
      {children}
    </pre>
  ),
};

// Optimized component to handle assistant messages with thinking tags
const AssistantMessage = React.memo(({ content }: { content: string }) => {
  // Parse thinking tags with useMemo to prevent re-parsing on every render
  const parts = React.useMemo(() => {
    const results = [];
    let currentIndex = 0;

    // Simple split approach for parsing <think> tags
    const thinkStartTag = '<think>';
    const thinkEndTag = '</think>';

    while (currentIndex < content.length) {
      const thinkStart = content.indexOf(thinkStartTag, currentIndex);

      if (thinkStart === -1) {
        // No more thinking tags, add remaining content
        const remaining = content.slice(currentIndex).trim();
        if (remaining) {
          results.push({ type: 'content', text: remaining });
        }
        break;
      }

      // Add content before thinking tag
      if (thinkStart > currentIndex) {
        const beforeText = content.slice(currentIndex, thinkStart).trim();
        if (beforeText) {
          results.push({ type: 'content', text: beforeText });
        }
      }

      // Find end of thinking tag
      const thinkContentStart = thinkStart + thinkStartTag.length;
      const thinkEnd = content.indexOf(thinkEndTag, thinkContentStart);

      if (thinkEnd === -1) {
        // Incomplete thinking tag (streaming)
        const thinkContent = content.slice(thinkContentStart);
        if (thinkContent) {
          results.push({ type: 'think', text: thinkContent, incomplete: true });
        }
        break;
      } else {
        // Complete thinking tag
        const thinkContent = content.slice(thinkContentStart, thinkEnd).trim();
        if (thinkContent) {
          results.push({
            type: 'think',
            text: thinkContent,
            incomplete: false,
          });
        }
        currentIndex = thinkEnd + thinkEndTag.length;
      }
    }

    // If no parts found, treat as regular content
    if (results.length === 0) {
      results.push({ type: 'content', text: content });
    }

    return results;
  }, [content]);

  return (
    <>
      {parts.map((part, index) => (
        <div key={index}>
          {part.type === 'think' ? (
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
              <div className='text-purple-800 dark:text-purple-200 text-sm prose prose-sm max-w-none dark:prose-invert'>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={thinkingComponents}
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

AssistantMessage.displayName = 'AssistantMessage';

// Memoized message component to prevent unnecessary re-renders
const MessageItem = React.memo(
  ({ message }: { message: { id: string; role: string; content: string } }) => (
    <div
      className={`flex gap-4 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.role === 'assistant' && (
        <div className='flex-shrink-0'>
          <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
            <Bot className='w-4 h-4 text-white' />
          </div>
        </div>
      )}

      <div
        className={`max-w-3xl px-4 py-3 rounded-2xl ${
          message.role === 'user'
            ? 'bg-blue-500 text-white ml-12'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className='prose prose-sm max-w-none dark:prose-invert'>
          {message.role === 'assistant' ? (
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

      {message.role === 'user' && (
        <div className='flex-shrink-0'>
          <div className='w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center'>
            <User className='w-4 h-4 text-white' />
          </div>
        </div>
      )}
    </div>
  )
);

MessageItem.displayName = 'MessageItem';

// The main Chat component with state update optimizations
export default function Chat() {
  const [connectionStatus, setConnectionStatus] = useState<
    'checking' | 'connected' | 'disconnected'
  >('checking');
  const [serverInfo, setServerInfo] = useState<string>('');

  // Initialize state with default values
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are Sarah, a helpful AI assistant with a warm and nurturing personality. You're naturally organized, detail-oriented, and always ready to lend a helping hand. Provide clear, accurate, and helpful responses with a caring touch. If you need more clarification, say so, or ask for it."
  );
  const [modelOptions, setModelOptions] = useState<OllamaModelOptions>({
    temperature: 0.7,
    top_k: 40,
    top_p: 0.9,
    repeat_penalty: 1.1,
    num_ctx: 2048,
    num_predict: 512,
  });
  // Reference to ensure updates don't cause infinite loops
  const isUpdatingRef = useRef(false);
  const previousMessagesRef = useRef<
    Array<{ id: string; role: string; content: string }>
  >([]);
  const originalContentRef = useRef<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to update messages in a way that avoids React update loops
  const safeSetMessages = (
    newMessages: Array<{ id: string; role: string; content: string }>
  ) => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    window.requestAnimationFrame(() => {
      setDisplayMessages(newMessages);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    });
  };

  // Use this state for UI display with thinking tags
  const [displayMessages, setDisplayMessages] = useState<
    Array<{ id: string; role: string; content: string }>
  >([]);

  // Load values from localStorage after component mounts
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
      setSelectedModel(savedModel);
    }

    const savedPrompt = localStorage.getItem('selectedSystemPrompt');
    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
    }

    const savedOptions = localStorage.getItem('modelOptions');
    if (savedOptions) {
      try {
        setModelOptions(JSON.parse(savedOptions));
      } catch (error) {
        console.error('Failed to parse saved model options:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (systemPrompt) {
      localStorage.setItem('selectedSystemPrompt', systemPrompt);
    }
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem('modelOptions', JSON.stringify(modelOptions));
  }, [modelOptions]);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Use the AI SDK's chat hook
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
    api: '/api/chat',
    body: {
      model: selectedModel,
      systemPrompt: systemPrompt,
      modelOptions: modelOptions,
    },
    onError: (err) => {
      // Safely handle errors
      setTimeout(() => {
        console.error('Chat error:', err);
        setConnectionStatus('disconnected');
      }, 0);
    },
    onFinish: (message) => {
      // Avoid state updates inside React's render cycle
      setTimeout(() => {
        setConnectionStatus('connected');

        // Store original content with thinking parts for assistant messages
        if (message.role === 'assistant') {
          originalContentRef.current.set(message.id, message.content);
        }
      }, 0);
    },
    headers: {
      'Content-Type': 'application/json',
    },
    onResponse: async (response) => {
      // Clone response state to avoid closures with stale values
      const responseStatus = response.status;
      const responseOk = response.ok;

      // Handle response outside of React's rendering cycle
      setTimeout(async () => {
        if (responseStatus === 503) {
          setConnectionStatus('disconnected');
          setServerInfo('');
        } else if (responseStatus === 500) {
          console.warn('Server error occurred');
        } else if (responseOk) {
          setConnectionStatus('connected');

          // Get server info if needed
          if (!serverInfo) {
            try {
              const healthResponse = await fetch('/api/health');
              if (healthResponse.ok) {
                const data = await healthResponse.json();
                if (data.details?.baseURL) {
                  const url = new URL(data.details.baseURL);
                  setServerInfo(`${url.hostname}:${url.port || '80'}`);
                }
              }
            } catch {
              // Ignore fetch errors
            }
          }
        }
      }, 0);
    },
  });

  // THIS IS THE KEY CHANGE: Process messages to display with thinking tags
  useEffect(() => {
    // Skip if already updating or no changes
    if (isUpdatingRef.current) return;
    if (
      messages.length === previousMessagesRef.current.length &&
      messages.every(
        (msg, i) =>
          msg.id === previousMessagesRef.current[i]?.id &&
          msg.content === previousMessagesRef.current[i]?.content
      )
    ) {
      return;
    }

    // Update reference for comparison in next cycle
    previousMessagesRef.current = messages;

    // Map messages for display, showing original content with thinking tags
    const updatedDisplayMessages = messages.map((message) => {
      if (
        message.role === 'assistant' &&
        originalContentRef.current.has(message.id)
      ) {
        const originalContent = originalContentRef.current.get(message.id);
        if (originalContent && originalContent.includes('<think>')) {
          return { ...message, content: originalContent };
        }
      }
      return message;
    });

    // Use our safe update function to avoid React update depth issues
    safeSetMessages(updatedDisplayMessages);
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, status]);

  // Focus input field after streaming completes
  useEffect(() => {
    if (status === 'ready' && displayMessages.length > 0) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, displayMessages.length]);

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok || response.status === 206) {
          const data = await response.json();
          if (data.status === 'healthy' || data.status === 'partial') {
            setConnectionStatus('connected');
            if (data.details?.baseURL) {
              try {
                const url = new URL(data.details.baseURL);
                setServerInfo(`${url.hostname}:${url.port || '80'}`);
              } catch {
                setServerInfo(data.details.baseURL);
              }
            }
          } else {
            setConnectionStatus('disconnected');
            setServerInfo('');
          }
        } else {
          setConnectionStatus('disconnected');
          setServerInfo('');
        }
      } catch {
        setConnectionStatus('disconnected');
        setServerInfo('');
      }
    };
    checkConnection();
  }, []);

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    setConnectionStatus('checking');
    handleSubmit(e);
  };

  // Reset conversation
  const handleReset = () => {
    if (status === 'streaming' || status === 'submitted') {
      stop();
    }

    // Clear messages
    setMessages([]);
    safeSetMessages([]);
    originalContentRef.current.clear();

    // Re-check connection
    setConnectionStatus('checking');
    setTimeout(async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok || response.status === 206) {
          const data = await response.json();
          if (data.status === 'healthy' || data.status === 'partial') {
            setConnectionStatus('connected');
            if (data.details?.baseURL) {
              try {
                const url = new URL(data.details.baseURL);
                setServerInfo(`${url.hostname}:${url.port || '80'}`);
              } catch {
                setServerInfo(data.details.baseURL);
              }
            }
          } else {
            setConnectionStatus('disconnected');
            setServerInfo('');
          }
        } else {
          setConnectionStatus('disconnected');
          setServerInfo('');
        }
      } catch {
        setConnectionStatus('disconnected');
        setServerInfo('');
      }
    }, 100);
  };

  // Cancel streaming
  const handleCancel = () => {
    stop();
    setConnectionStatus('connected');
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
              {displayMessages.length > 0 && (
                <button
                  onClick={handleReset}
                  disabled={status === 'streaming' || status === 'submitted'}
                  className='ml-4 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                  title='Reset conversation'
                >
                  <RotateCcw className='w-4 h-4' />
                  Reset
                </button>
              )}
            </div>
            {/* Model Selector, System Prompt, and Configuration */}
            <div className='flex-1 flex justify-center items-center gap-4'>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={
                  status === 'streaming' ||
                  status === 'submitted' ||
                  connectionStatus === 'disconnected'
                }
              />
              <SystemPromptSelector
                selectedPrompt={systemPrompt}
                onPromptChange={setSystemPrompt}
                disabled={
                  status === 'streaming' ||
                  status === 'submitted' ||
                  connectionStatus === 'disconnected'
                }
              />
              <ModelConfigSelector
                selectedOptions={modelOptions}
                onOptionsChange={setModelOptions}
                disabled={
                  status === 'streaming' ||
                  status === 'submitted' ||
                  connectionStatus === 'disconnected'
                }
              />
            </div>
            {/* Connection Status */}
            <div className='flex items-start gap-2'>
              {connectionStatus === 'checking' && (
                <div className='flex items-center gap-2'>
                  <Loader2 className='w-4 h-4 animate-spin text-yellow-500' />
                  <span className='text-sm text-yellow-600 dark:text-yellow-400'>
                    Connecting...
                  </span>
                </div>
              )}
              {connectionStatus === 'connected' && (
                <div className='flex flex-col items-start'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500' />
                    <span className='text-sm text-green-600 dark:text-green-400'>
                      Connected
                    </span>
                  </div>
                  {serverInfo && (
                    <span className='text-[8px] text-gray-500 dark:text-gray-400 ml-6'>
                      {serverInfo}
                    </span>
                  )}
                </div>
              )}
              {connectionStatus === 'disconnected' && (
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
          {displayMessages.length === 0 ? (
            <div className='text-center py-12'>
              <Bot className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <h2 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                Welcome to your AI Assistant
              </h2>
              <p className='text-gray-500 dark:text-gray-400 mb-4'>
                Start a conversation by typing a message below.
              </p>

              {connectionStatus === 'disconnected' && (
                <div className='max-w-md mx-auto p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
                  <h3 className='text-sm font-medium text-amber-800 dark:text-amber-200 mb-2'>
                    Ollama Connection Required
                  </h3>
                  <p className='text-sm text-amber-700 dark:text-amber-300 mb-3'>
                    Make sure Ollama is running and has a model installed.
                  </p>
                  <div className='text-xs text-amber-600 dark:text-amber-400 space-y-1'>
                    <div>
                      1. Install Ollama from{' '}
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
                      2. Run:{' '}
                      <code className='bg-amber-100 dark:bg-amber-800 px-1 rounded'>
                        ollama pull llama3.2:3b
                      </code>
                    </div>
                    <div>
                      3. Start:{' '}
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
              {displayMessages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}

              {/* Loading indicator for assistant response */}
              {(status === 'submitted' ||
                (status === 'streaming' &&
                  displayMessages.length > 0 &&
                  displayMessages[displayMessages.length - 1]?.role ===
                    'user')) && (
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
                  connectionStatus === 'disconnected'
                    ? 'Please check Ollama connection...'
                    : 'Type your message...'
                }
                className='w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[52px] max-h-32 disabled:opacity-50'
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
                disabled={
                  status === 'streaming' ||
                  status === 'submitted' ||
                  connectionStatus === 'disconnected'
                }
              />
            </div>
            <button
              type={
                status === 'streaming' || status === 'submitted'
                  ? 'button'
                  : 'submit'
              }
              onClick={
                status === 'streaming' || status === 'submitted'
                  ? handleCancel
                  : undefined
              }
              disabled={
                status !== 'streaming' &&
                status !== 'submitted' &&
                (!input.trim() || connectionStatus === 'disconnected')
              }
              className={`px-4 py-3 rounded-xl transition-colors duration-200 flex items-center justify-center min-w-[52px] ${
                status === 'streaming' || status === 'submitted'
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50 ring-2 ring-red-500/20 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                  : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white'
              }`}
              title={
                status === 'streaming' || status === 'submitted'
                  ? 'Cancel request'
                  : 'Send message'
              }
            >
              {status === 'streaming' || status === 'submitted' ? (
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
