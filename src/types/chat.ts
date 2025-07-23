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
