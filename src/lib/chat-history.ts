import {
  ChatThread,
  ChatHistoryPreview,
  ChatHistoryOptions,
} from "@/types/chat";
import type { Message } from "@ai-sdk/react";

const DB_NAME = "ChatHistoryDB";
const DB_VERSION = 1;
const STORE_NAME = "chatThreads";

class ChatHistoryManager {
  private db: IDBDatabase | null = null;
  private options: ChatHistoryOptions;

  constructor(options: ChatHistoryOptions = {}) {
    this.options = {
      maxThreads: 50,
      maxMessagesPerThread: 100,
      ...options,
    };
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create chat threads store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });

          // Create indexes for efficient querying
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
          store.createIndex("title", "title", { unique: false });
        }
      };
    });
  }

  // Generate a title from the first user message
  private generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find((msg) => msg.role === "user");
    if (!firstUserMessage) {
      return "New Chat";
    }

    let content = "";
    if (typeof firstUserMessage.content === "string") {
      content = firstUserMessage.content;
    } else {
      // For non-string content, try to extract text
      content = String(firstUserMessage.content);
    }

    // Truncate and clean up the title
    const title = content.trim().slice(0, 50);
    return title || "New Chat";
  }

  // Save a chat thread
  async saveThread(chatId: string, messages: Message[]): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const now = new Date();
      const title = this.generateTitle(messages);

      // Limit messages if necessary
      const limitedMessages = messages.slice(
        -this.options.maxMessagesPerThread!
      );

      const chatThread: ChatThread = {
        id: chatId,
        title,
        messages: limitedMessages,
        createdAt: now,
        updatedAt: now,
        messageCount: limitedMessages.length,
      };

      // Check if thread already exists to preserve createdAt
      const getRequest = store.get(chatId);
      getRequest.onsuccess = () => {
        const existingThread = getRequest.result;
        if (existingThread) {
          chatThread.createdAt = existingThread.createdAt;
        }

        const putRequest = store.put(chatThread);

        putRequest.onsuccess = () => {
          // Clean up old threads if we exceed the limit
          this.cleanupOldThreads().then(() => resolve());
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to save chat thread"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to check existing thread"));
      };
    });
  }

  // Load a specific chat thread
  async loadThread(chatId: string): Promise<ChatThread | null> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(chatId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error("Failed to load chat thread"));
      };
    });
  }

  // Get all chat thread previews (sorted by most recent)
  async getThreadPreviews(): Promise<ChatHistoryPreview[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("updatedAt");
      const request = index.openCursor(null, "prev"); // Most recent first

      const previews: ChatHistoryPreview[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const thread: ChatThread = cursor.value;

          // Extract last message preview
          let lastMessage = "";
          if (thread.messages.length > 0) {
            const lastMsg = thread.messages[thread.messages.length - 1];
            if (typeof lastMsg.content === "string") {
              lastMessage =
                lastMsg.content.slice(0, 100) +
                (lastMsg.content.length > 100 ? "..." : "");
            } else {
              // For non-string content, convert to string
              const contentStr = String(lastMsg.content);
              lastMessage =
                contentStr.slice(0, 100) +
                (contentStr.length > 100 ? "..." : "");
            }
          }

          previews.push({
            id: thread.id,
            title: thread.title,
            lastMessage,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            messageCount: thread.messageCount,
          });

          cursor.continue();
        } else {
          resolve(previews);
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to load chat history"));
      };
    });
  }

  // Delete a chat thread
  async deleteThread(chatId: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(chatId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete chat thread"));
      };
    });
  }

  // Clean up old threads if we exceed the maximum
  private async cleanupOldThreads(): Promise<void> {
    if (!this.options.maxThreads) return;

    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("updatedAt");
      const request = index.openCursor(null, "prev"); // Most recent first

      const threadsToDelete: string[] = [];
      let count = 0;

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          count++;
          if (count > this.options.maxThreads!) {
            threadsToDelete.push(cursor.value.id);
          }
          cursor.continue();
        } else {
          // Delete excess threads
          const deletePromises = threadsToDelete.map((id) => {
            return new Promise<void>((resolveDelete, rejectDelete) => {
              const deleteRequest = store.delete(id);
              deleteRequest.onsuccess = () => resolveDelete();
              deleteRequest.onerror = () =>
                rejectDelete(new Error(`Failed to delete thread ${id}`));
            });
          });

          Promise.all(deletePromises)
            .then(() => resolve())
            .catch(reject);
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to cleanup old threads"));
      };
    });
  }

  // Clear all chat history
  async clearAllHistory(): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to clear chat history"));
      };
    });
  }
}

// Export a singleton instance
export const chatHistoryManager = new ChatHistoryManager();
