"use client";

import { useChat } from "@ai-sdk/react";
import type { Message } from "@ai-sdk/react";
import { useState, useEffect, useRef, useMemo } from "react";

import { CHROMADB_DEFAULTS } from "@/constraints/chromadb-constraints";
import {
  SUPPORTED_FILE_TYPES,
  MAX_CHAT_STEPS,
  DEFAULT_CHAT_STEPS,
  MAX_FILE_SIZE_DISPLAY,
} from "@/constraints/chat-constraints";

import { Send, RotateCcw, X, Paperclip, Database, Menu } from "lucide-react";

import ModelSelector from "./ModelSelector";
import SystemPromptSelector from "./SystemPromptSelector";
import ModelConfigSelector from "./ModelConfigSelector";
import ToolSwitch from "./ToolSwitch";
import ContextWindowManager from "./ContextWindowManager";
import MessageComponent from "./Message";
import MessageItem from "./MessageItem";
import AttachmentPreview from "./AttachmentPreview";
import ThemeToggle from "./ThemeToggle";
import ChatSidebar from "@/components/ChatSidebar";

// Import custom hooks
import {
  useConnectionStatus,
  usePersistedPreferences,
  useChatHistory,
} from "@/hooks";

// Import utilities
import { processFiles, validateFiles } from "@/utils";

// Main Chat component - significantly simplified
export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sidebar state - open by default on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Track when we're loading a thread to prevent auto-save race conditions
  const [isLoadingThread, setIsLoadingThread] = useState<boolean>(false);

  // Generate a unique chat ID that persists across component re-renders
  const [chatId, setChatId] = useState(
    () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  // Chat history management
  const {
    chatThreads,
    isLoading: isHistoryLoading,
    error: historyError,
    saveThread,
    loadThread,
    deleteThread,
    refreshHistory,
  } = useChatHistory();

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[] | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [dragCounter, setDragCounter] = useState<number>(0);

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

  // Enhanced chat hook usage with proper tool and attachment handling
  // Note: The useChat hook needs to be reinitialized when chatId changes
  // to ensure the correct chat session is maintained
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
    id: chatId, // Use unique chat ID for this chat session
    api: "/api/chat",
    maxSteps:
      preferences.toolsEnabled && preferences.modelSupportsTools
        ? MAX_CHAT_STEPS
        : DEFAULT_CHAT_STEPS, // Allow for tool calls and follow-up responses only if tools are enabled
    sendExtraMessageFields: true, // Enable sending experimental_attachments and other extra fields
    body: {
      model: preferences.selectedModel,
      systemPrompt: preferences.systemPrompt,
      modelOptions: preferences.modelOptions,
      toolsEnabled: preferences.toolsEnabled,
      activeCollections: activeCollectionsArray,
      chunksToRetrieve: chunksToRetrieve,
      chatId: chatId, // Pass the chat ID to the API
    },
    onError: (err) => {
      console.error("💥Chat error:", err);
      connectionStatus.checkConnection();
      // Clear file processing state on error
      setIsProcessingFiles(false);
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

  // Chat history handlers
  const handleSelectThread = async (threadId: string) => {
    console.log("🔄 Selecting thread:", threadId, "current chatId:", chatId);

    // Don't do anything if already selecting this thread
    if (threadId === chatId) {
      return;
    }

    try {
      setIsLoadingThread(true);

      // Stop any current streaming
      if (isStreaming) {
        stop();
      }

      const thread = await loadThread(threadId);
      console.log(
        "📥 Loaded thread:",
        thread?.id,
        "messages count:",
        thread?.messages.length
      );

      if (thread) {
        // Clear messages first to ensure clean state
        setMessages([]);

        // Update the chat ID
        setChatId(threadId);
        console.log("🆔 Set chatId to:", threadId);

        // Then load the thread messages after a brief delay to ensure state sync
        setTimeout(() => {
          console.log("💬 Setting messages:", thread.messages.length);
          setMessages(thread.messages);
        }, 50);

        // Clear current attachments and errors
        setAttachedFiles(null);
        setFileError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error loading chat thread:", error);
      setFileError("Failed to load chat thread");
    } finally {
      setIsLoadingThread(false);
    }
  };

  const handleNewChat = () => {
    setIsLoadingThread(true);

    // Generate new chat ID
    const newChatId = `chat_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setChatId(newChatId);

    // Reset chat state
    if (isStreaming) {
      stop();
    }
    setMessages([]);
    setAttachedFiles(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
      setIsLoadingThread(false);
      refreshHistory(); // Ensure chat history updates after new chat
    }, 100);
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread(threadId);

      // If we deleted the current thread, start a new chat
      if (threadId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat thread:", error);
      setFileError("Failed to delete chat thread");
    }
  };

  // Auto-save chat when messages change (debounced)
  useEffect(() => {
    if (messages.length > 0 && !isLoadingThread) {
      const timeoutId = setTimeout(() => {
        console.log(
          "💾 Auto-saving thread:",
          chatId,
          "with",
          messages.length,
          "messages"
        );
        // Only save if we're not currently loading a thread
        // to prevent overwriting during thread switching
        saveThread(chatId, messages);
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [messages, chatId, saveThread, isLoadingThread]);

  const handleReset = async () => {
    // Use the new chat handler instead of just resetting
    handleNewChat();

    // Clear PDF attachments associated with the old chat ID
    try {
      console.log(`🗑️ Clearing PDF attachments for chat ID: ${chatId}`);
      const response = await fetch("/api/clear-pdf-attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log("✅ PDF attachments cleared successfully:", result.message);
      } else {
        console.error("❌ Failed to clear PDF attachments:", result.error);
      }
    } catch (error) {
      console.error("❌ Error clearing PDF attachments:", error);
      // Don't show user error for this background operation
    }
  };

  const handleCancel = () => {
    stop();
  };

  const handleResend = (message: Message) => {
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
  };

  // Memoize file input handler
  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
  };

  // Attachment removal handler
  const handleRemoveAttachments = () => {
    setAttachedFiles(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragOver(false);
    setDragCounter(0);

    if (isDisabled || isProcessingFiles) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      return;
    }

    setIsProcessingFiles(true);
    setFileError(null);

    try {
      // Process files (resize images)
      const fileList = files as unknown as FileList;
      const processedFiles = await processFiles(fileList);

      // Validate processed files
      const validation = validateFiles(processedFiles);
      if (validation.isValid) {
        setAttachedFiles(processedFiles);
        setFileError(null);
      } else {
        setFileError(validation.error || "Invalid file");
        setAttachedFiles(null);
      }
    } catch (error) {
      console.error("Error processing dropped files:", error);
      setFileError("Failed to process files. Please try again.");
      setAttachedFiles(null);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // Convert files to attachment format for AI SDK
  const convertFilesToAttachments = async (files: File[]) => {
    const attachments = await Promise.all(
      files.map(async (file) => {
        // Create a data URL for the file
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        return {
          name: file.name,
          contentType: file.type,
          url: dataUrl,
        };
      })
    );
    return attachments;
  };

  // Enhanced form submission handler with attachments
  const handleFormSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    if (isStreaming) {
      handleCancel();
      return;
    }

    // Check if we have input or attachments
    if (!input.trim() && (!attachedFiles || attachedFiles.length === 0)) {
      return;
    }

    try {
      // Prepare attachments if any
      let attachments:
        | Array<{ name: string; contentType: string; url: string }>
        | undefined;
      if (attachedFiles && attachedFiles.length > 0) {
        attachments = await convertFilesToAttachments(attachedFiles);
      }

      // Submit with attachments
      await handleSubmit(e || new Event("submit"), {
        experimental_attachments: attachments,
      });

      // Clear attachments after successful submission
      setAttachedFiles(null);
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error submitting with attachments:", error);
      setFileError("Failed to submit message with attachments");
    }
  };

  return (
    <div className='flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      {/* Chat Sidebar */}
      <ChatSidebar
        chatThreads={chatThreads}
        currentChatId={chatId}
        isLoading={isHistoryLoading}
        onSelectThread={handleSelectThread}
        onDeleteThread={handleDeleteThread}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-80" : "lg:ml-0"
        }`}
      >
        {/* Header */}
        <div
          className={`fixed top-0 right-0 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40 transition-all duration-300 ${
            isSidebarOpen ? "lg:left-80" : "left-0"
          }`}
        >
          <div className='max-w-7xl mx-auto px-6 py-4'>
            <div className='flex items-center gap-6'>
              {/* Left Section - Menu Button, Logo and Title */}
              <div className='flex items-center gap-3 min-w-0 flex-shrink-0'>
                {/* Sidebar toggle button - visible on all screen sizes */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                  title='Toggle chat history'
                >
                  <Menu className='w-5 h-5' />
                </button>

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
                <div className='min-w-0'>
                  <h1 className='text-xl font-semibold text-gray-900 dark:text-white truncate'>
                    AI Monkey
                  </h1>
                  <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                    {connectionStatus.serverInfo || "Ollama Disconnected"}
                  </p>
                </div>

                {/* Reset Button */}
                {messages.length > 0 && (
                  <button
                    onClick={handleReset}
                    disabled={isStreaming}
                    className='px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0'
                    title='Reset conversation'
                  >
                    <RotateCcw className='w-4 h-4' />
                    Reset
                  </button>
                )}
              </div>

              {/* Center Section - Model Configuration with Equal Spacing */}
              <div className='flex-1 flex items-center justify-center max-w-5xl mx-auto'>
                <div className='flex items-center gap-4'>
                  <div className='w-54'>
                    <ModelSelector
                      selectedModel={preferences.selectedModel}
                      onModelChange={preferences.setSelectedModel}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className='w-54'>
                    <SystemPromptSelector
                      selectedPrompt={preferences.systemPrompt}
                      onPromptChange={preferences.setSystemPrompt}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className='w-54'>
                    <ModelConfigSelector
                      selectedOptions={preferences.modelOptions}
                      onOptionsChange={preferences.setModelOptions}
                      disabled={isDisabled}
                    />
                  </div>
                  <div className='w-20 flex justify-center'>
                    <ToolSwitch
                      enabled={preferences.toolsEnabled}
                      onChange={preferences.setToolsEnabled}
                      disabled={isDisabled}
                      modelSupportsTools={preferences.modelSupportsTools}
                    />
                  </div>

                  {/* Context Window Icon */}
                  <div className='relative flex items-center gap-1 w-20 justify-center'>
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

              {/* Right Section - Theme Toggle */}
              <div className='flex items-center flex-shrink-0'>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Tool Support Warning */}
        {preferences.selectedModel &&
          preferences.toolsEnabled &&
          !preferences.modelSupportsTools &&
          !preferences.isWarningDismissed && (
            <div className='fixed top-[85px] left-0 right-0 border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 z-30'>
              <div className='max-w-7xl mx-auto px-6 py-3'>
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
              ? "pt-[142px]" // Header + warning
              : "pt-[85px]" // Just header
          } ${messages.length === 0 ? "pb-6" : "pb-32"} relative`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragOver && (
            <div className='absolute inset-0 bg-blue-500/10 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-blue-500'>
              <div className='bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-blue-500'>
                <div className='text-center'>
                  <div className='w-12 h-12 mx-auto mb-3 text-blue-500'>
                    <svg
                      fill='currentColor'
                      viewBox='0 0 20 20'
                      className='w-full h-full'
                    >
                      <path
                        fillRule='evenodd'
                        d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <p className='text-lg font-medium text-gray-900 dark:text-white mb-1'>
                    Drop files here
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Images and PDFs supported (max {MAX_FILE_SIZE_DISPLAY})
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className='max-w-4xl mx-auto px-6 py-6'>
            {/* Show connection status info for new conversations */}
            {messages.length === 0 &&
              connectionStatus.status === "disconnected" && (
                <div className='text-center pt-24 pb-8'>
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
                </div>
              )}

            <div className='space-y-8'>
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
                  <div className='flex justify-start'>
                    <div className='max-w-3xl px-4 py-3 rounded-2xl transition-all duration-300 ease-out bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'>
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

              {/* Inline Message Input - transitions from center to bottom */}
              {messages.length === 0 && (
                <div className='flex justify-center items-center min-h-[50vh] transition-all duration-700 ease-in-out'>
                  <div className='w-full max-w-2xl'>
                    {/* File size error message */}
                    {(fileError || historyError) && (
                      <div className='mb-4'>
                        <MessageComponent
                          message={fileError || historyError || ""}
                          type='error'
                          isVisible={!!(fileError || historyError)}
                          onClose={() => {
                            setFileError(null);
                            // Note: historyError is managed by the hook
                          }}
                          autoHide={true}
                          autoHideDelay={5000}
                        />
                      </div>
                    )}

                    {/* Error message */}
                    {error && (
                      <div className='mb-4'>
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
                    )}

                    {/* Attachment preview */}
                    {attachedFiles && attachedFiles.length > 0 && (
                      <div className='mb-4'>
                        <AttachmentPreview
                          files={attachedFiles}
                          onRemove={handleRemoveAttachments}
                        />
                      </div>
                    )}

                    {/* Input form */}
                    <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm'>
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

                      <form onSubmit={handleFormSubmit}>
                        <div className='relative'>
                          <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            placeholder={"Type your message..."}
                            className='w-full px-4 py-3 pr-24 border-0 rounded-xl bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[100px] max-h-64 disabled:opacity-50'
                            rows={4}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleFormSubmit();
                              }
                            }}
                            disabled={isDisabled}
                            style={{
                              height: "auto",
                              minHeight: "100px",
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = "auto";
                              target.style.height =
                                Math.min(target.scrollHeight, 256) + "px";
                            }}
                          />

                          {/* Attachment button */}
                          <button
                            type='button'
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isDisabled || isProcessingFiles}
                            className='absolute right-12 top-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600'
                            title={
                              isProcessingFiles
                                ? "Processing files..."
                                : "Attach files (images, PDFs)"
                            }
                          >
                            {isProcessingFiles ? (
                              <div className='w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin' />
                            ) : (
                              <Paperclip className='w-4 h-4' />
                            )}
                          </button>

                          {/* Send button */}
                          <button
                            type={isStreaming ? "button" : "submit"}
                            onClick={isStreaming ? handleCancel : undefined}
                            disabled={
                              (!isStreaming &&
                                !input.trim() &&
                                (!attachedFiles ||
                                  attachedFiles.length === 0)) ||
                              connectionStatus.status === "disconnected" ||
                              isProcessingFiles
                            }
                            className={`absolute right-2 top-4 p-2 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                              isStreaming
                                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50"
                                : isProcessingFiles
                                ? "bg-yellow-500 text-white cursor-not-allowed"
                                : (!input.trim() &&
                                    (!attachedFiles ||
                                      attachedFiles.length === 0)) ||
                                  connectionStatus.status === "disconnected"
                                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                : "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
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
                              <X className='w-4 h-4' />
                            ) : isProcessingFiles ? (
                              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                            ) : (
                              <Send className='w-4 h-4' />
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
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

        {/* Fixed Bottom Input Field - appears when conversation has started */}
        {messages.length > 0 && (
          <div
            className={`fixed bottom-0 right-0 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:to-transparent z-30 transition-all duration-700 ease-in-out ${
              isSidebarOpen ? "lg:left-80" : "left-0"
            }`}
          >
            <div className='max-w-4xl mx-auto px-6 pb-6 pt-4'>
              <div className='w-full max-w-2xl mx-auto'>
                {/* File size error message */}
                {(fileError || historyError) && (
                  <div className='mb-4'>
                    <MessageComponent
                      message={fileError || historyError || ""}
                      type='error'
                      isVisible={!!(fileError || historyError)}
                      onClose={() => {
                        setFileError(null);
                        // Note: historyError is managed by the hook
                      }}
                      autoHide={true}
                      autoHideDelay={5000}
                    />
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className='mb-4'>
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
                )}

                {/* Attachment preview */}
                {attachedFiles && attachedFiles.length > 0 && (
                  <div className='mb-4'>
                    <AttachmentPreview
                      files={attachedFiles}
                      onRemove={handleRemoveAttachments}
                    />
                  </div>
                )}

                {/* Input form */}
                <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg'>
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

                  <form onSubmit={handleFormSubmit}>
                    <div className='relative'>
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        placeholder={"Type your message..."}
                        className='w-full px-4 py-3 pr-24 border-0 rounded-xl bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[100px] max-h-64 disabled:opacity-50'
                        rows={4}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleFormSubmit();
                          }
                        }}
                        disabled={isDisabled}
                        style={{
                          height: "auto",
                          minHeight: "100px",
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "auto";
                          target.style.height =
                            Math.min(target.scrollHeight, 256) + "px";
                        }}
                      />

                      {/* Attachment button */}
                      <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isDisabled || isProcessingFiles}
                        className='absolute right-12 top-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600'
                        title={
                          isProcessingFiles
                            ? "Processing files..."
                            : "Attach files (images, PDFs)"
                        }
                      >
                        {isProcessingFiles ? (
                          <div className='w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin' />
                        ) : (
                          <Paperclip className='w-4 h-4' />
                        )}
                      </button>

                      {/* Send button */}
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
                        className={`absolute right-2 top-4 p-2 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                          isStreaming
                            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50"
                            : isProcessingFiles
                            ? "bg-yellow-500 text-white cursor-not-allowed"
                            : (!input.trim() &&
                                (!attachedFiles ||
                                  attachedFiles.length === 0)) ||
                              connectionStatus.status === "disconnected"
                            ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
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
                          <X className='w-4 h-4' />
                        ) : isProcessingFiles ? (
                          <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        ) : (
                          <Send className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
}
