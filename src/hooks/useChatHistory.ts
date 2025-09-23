import { useState, useEffect, useCallback } from "react";
import type { Message } from "@ai-sdk/react";
import { ChatHistoryPreview, ChatThread } from "@/types/chat";
import { chatHistoryManager } from "@/lib/chat-history";

export function useChatHistory() {
  const [chatThreads, setChatThreads] = useState<ChatHistoryPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load chat history on mount
  const loadChatHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const threads = await chatHistoryManager.getThreadPreviews();
      setChatThreads(threads);
    } catch (err) {
      setError("Failed to load chat history");
      console.error("Error loading chat history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load history on mount
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Save a chat thread
  const saveThread = useCallback(
    async (chatId: string, messages: Message[]) => {
      try {
        await chatHistoryManager.saveThread(chatId, messages);
        // Reload the chat history to reflect changes
        await loadChatHistory();
      } catch (err) {
        setError("Failed to save chat thread");
        console.error("Error saving chat thread:", err);
      }
    },
    [loadChatHistory]
  );

  // Load a specific chat thread
  const loadThread = useCallback(
    async (chatId: string): Promise<ChatThread | null> => {
      try {
        setError(null);
        return await chatHistoryManager.loadThread(chatId);
      } catch (err) {
        setError("Failed to load chat thread");
        console.error("Error loading chat thread:", err);
        return null;
      }
    },
    []
  );

  // Delete a chat thread
  const deleteThread = useCallback(
    async (chatId: string) => {
      try {
        await chatHistoryManager.deleteThread(chatId);
        // Remove from local state immediately for better UX
        setChatThreads((prev) => prev.filter((thread) => thread.id !== chatId));
      } catch (err) {
        setError("Failed to delete chat thread");
        console.error("Error deleting chat thread:", err);
        // Reload on error to ensure consistency
        await loadChatHistory();
      }
    },
    [loadChatHistory]
  );

  // Clear all chat history
  const clearAllHistory = useCallback(async () => {
    try {
      await chatHistoryManager.clearAllHistory();
      setChatThreads([]);
    } catch (err) {
      setError("Failed to clear chat history");
      console.error("Error clearing chat history:", err);
    }
  }, []);

  return {
    chatThreads,
    isLoading,
    error,
    saveThread,
    loadThread,
    deleteThread,
    clearAllHistory,
    refreshHistory: loadChatHistory,
  };
}
