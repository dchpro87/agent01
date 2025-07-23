"use client";

import { useChat } from "@ai-sdk/react";
import type { Message } from "@ai-sdk/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { CHROMADB_DEFAULTS } from "@/constraints/chromadb-constraints";
import {
  SUPPORTED_FILE_TYPES,
  MAX_CHAT_STEPS,
  DEFAULT_CHAT_STEPS,
} from "@/constraints/chat-constraints";

import { Send, RotateCcw, X, Paperclip, Database } from "lucide-react";

import ModelSelector from "./ModelSelector";
import SystemPromptSelector from "./SystemPromptSelector";
import ModelConfigSelector from "./ModelConfigSelector";
import ToolSwitch from "./ToolSwitch";
import ContextWindowManager from "./ContextWindowManager";
import MessageComponent from "./Message";
import MessageItem from "./MessageItem";
import AttachmentPreview from "./AttachmentPreview";

// Import custom hooks
import { useConnectionStatus, usePersistedPreferences } from "@/hooks";

// Import utilities
import { processFiles, validateFiles } from "@/utils";

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
