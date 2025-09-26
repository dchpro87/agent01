import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { Message } from "@ai-sdk/react";
import {
  extractMainTextContent,
  copyMessageFromDOM,
} from "@/utils/message-text-extractor";

interface CopyMessageButtonProps {
  message: Message;
  className?: string;
}

export default function CopyMessageButton({
  message,
  className = "",
}: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Extract only the main text content (no reasoning/thinking parts)
      const textToCopy = extractMainTextContent(message);

      if (!textToCopy.trim()) {
        return; // Nothing to copy
      }

      // Try to copy with formatting preservation from DOM
      const success = await copyMessageFromDOM(textToCopy);

      if (success) {
        setCopied(true);
        // Reset the copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  // Don't render for empty messages or user messages (they already have resend button)
  const textContent = extractMainTextContent(message);
  if (!textContent.trim() || message.role === "user") {
    return null;
  }

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        absolute bottom-2 right-2 p-2 rounded-lg transition-all duration-200
        ${
          copied
            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        }
        ${isHovered || copied ? "opacity-100" : "opacity-70"}
        shadow-sm hover:shadow-md
        ${className}
      `}
      title={copied ? "Copied!" : "Copy message"}
      aria-label={
        copied ? "Message copied to clipboard" : "Copy message to clipboard"
      }
    >
      {copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
    </button>
  );
}
