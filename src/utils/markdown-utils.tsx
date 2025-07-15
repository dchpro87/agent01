import React from "react";
import type { Components } from "react-markdown";
import { THINK_START_TAG, THINK_END_TAG } from "@/constraints/chat-constraints";
import type { ContentPart, ThinkPart } from "@/types/chat";

// Simplified markdown components
export const markdownComponents: Components = {
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
export function parseThinkingTags(
  content: string
): (ContentPart | ThinkPart)[] {
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
