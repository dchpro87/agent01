"use client";

import { useState } from "react";
import { ChatHistoryPreview } from "@/types/chat";
import { MessageSquare, Trash2, Plus, X } from "lucide-react";

interface ChatSidebarProps {
  chatThreads: ChatHistoryPreview[];
  currentChatId: string;
  isLoading: boolean;
  onSelectThread: (chatId: string) => void;
  onDeleteThread: (chatId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({
  chatThreads,
  currentChatId,
  isLoading,
  onSelectThread,
  onDeleteThread,
  onNewChat,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);
  const [deletingThread, setDeletingThread] = useState<string | null>(null);

  const handleThreadClick = (threadId: string) => {
    // Prevent unnecessary calls if already selected
    if (threadId === currentChatId) {
      return;
    }
    onSelectThread(threadId);

    // Close sidebar on mobile after selection for better UX
    if (window.innerWidth < 1024) {
      // lg breakpoint
      onClose();
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation(); // Prevent thread selection
    setDeletingThread(threadId);

    try {
      await onDeleteThread(threadId);
    } finally {
      setDeletingThread(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Chat History
            </h2>
            <div className='flex items-center gap-1'>
              {/* Close button - only visible on mobile/tablet */}
              <button
                onClick={onClose}
                className='lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                title='Close Sidebar'
              >
                <X className='w-5 h-5' />
              </button>
              {/* New chat button */}
              <button
                onClick={onNewChat}
                className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                title='New Chat'
              >
                <Plus className='w-5 h-5' />
              </button>
            </div>
          </div>

          {/* Chat threads list */}
          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              <div className='p-4 text-center'>
                <div className='animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2' />
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Loading chat history...
                </p>
              </div>
            ) : chatThreads.length === 0 ? (
              <div className='p-4 text-center'>
                <MessageSquare className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3' />
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  No chat history yet
                </p>
                <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                  Start a conversation to see it here
                </p>
              </div>
            ) : (
              <div className='p-2 space-y-1'>
                {chatThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentChatId === thread.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                    }`}
                    onClick={() => handleThreadClick(thread.id)}
                    onMouseEnter={() => setHoveredThread(thread.id)}
                    onMouseLeave={() => setHoveredThread(null)}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1 min-w-0'>
                        <h3 className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                          {thread.title}
                        </h3>
                        {thread.lastMessage && (
                          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2'>
                            {thread.lastMessage}
                          </p>
                        )}
                        <div className='flex items-center gap-2 mt-2'>
                          <span className='text-xs text-gray-400 dark:text-gray-500'>
                            {formatDate(new Date(thread.updatedAt))}
                          </span>
                          <span className='text-xs text-gray-400 dark:text-gray-500'>
                            •
                          </span>
                          <span className='text-xs text-gray-400 dark:text-gray-500'>
                            {thread.messageCount} message
                            {thread.messageCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      {(hoveredThread === thread.id ||
                        currentChatId === thread.id) && (
                        <button
                          onClick={(e) => handleDeleteClick(e, thread.id)}
                          disabled={deletingThread === thread.id}
                          className='p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50'
                          title='Delete chat'
                        >
                          {deletingThread === thread.id ? (
                            <div className='w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin' />
                          ) : (
                            <Trash2 className='w-4 h-4' />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
