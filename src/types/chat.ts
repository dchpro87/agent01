import type { Message } from "@ai-sdk/react";

// Type definitions for tool invocations (based on AI SDK structure)
export type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
};

// Type definitions for message parts
export type ContentPart = {
  type: "content";
  text: string;
};

export type ToolPart = {
  type: "tool";
  toolInvocation: ToolInvocation;
};

export type MessagePart = ContentPart | ToolPart;

// Chat History Types
export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatHistoryPreview {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatHistoryOptions {
  maxThreads?: number;
  maxMessagesPerThread?: number;
}
