import type { Message } from "@ai-sdk/react";
import { User, RotateCw } from "lucide-react";
import AssistantMessage from "./AssistantMessage";
import MessageParts from "./MessageParts";
import MessageAttachments from "./MessageAttachments";

// Add Message parts type - more comprehensive to match AI SDK
interface MessagePartType {
  type:
    | "text"
    | "tool-invocation"
    | "step-start"
    | "reasoning"
    | "source"
    | "file";
  text?: string;
  toolInvocation?: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: "partial-call" | "call" | "result";
    result?: unknown;
  };
  reasoning?: string;
}

interface MessageItemProps {
  message: Message;
  connectionStatus: { status: string };
  onResend?: (message: Message) => void;
  isStreaming?: boolean;
  addToolResult: (result: { toolCallId: string; result: string }) => void;
}

export default function MessageItem({
  message,
  connectionStatus,
  onResend,
  isStreaming,
  addToolResult,
}: MessageItemProps) {
  return (
    <div
      className={`flex gap-4 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.role === "assistant" && (
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
      )}

      <div
        className={`max-w-3xl px-4 py-3 rounded-2xl transition-all duration-300 ease-out ${
          message.role === "user"
            ? "bg-blue-500 text-white ml-12 relative"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
        }`}
      >
        {/* Resend button for user messages */}
        {message.role === "user" && onResend && (
          <button
            onClick={() => onResend(message)}
            disabled={isStreaming}
            className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${
              isStreaming
                ? "bg-blue-400 cursor-not-allowed opacity-50"
                : "bg-blue-600 hover:bg-blue-700 opacity-100"
            } text-white`}
            title={
              isStreaming ? "Cannot resend while streaming" : "Edit message"
            }
          >
            <RotateCw className='w-4 h-4' />
          </button>
        )}

        <div
          className={`prose prose-sm max-w-none dark:prose-invert transition-all duration-300 ease-out ${
            message.role === "user" && onResend ? "pr-8" : ""
          }`}
        >
          {message.role === "assistant" ? (
            <>
              {/* Render message parts (recommended by AI SDK) */}
              {message.parts && message.parts.length > 0 ? (
                <>
                  <MessageParts
                    parts={message.parts as MessagePartType[]}
                    addToolResult={addToolResult}
                  />
                </>
              ) : (
                /* Fallback to legacy content rendering */
                <>
                  <AssistantMessage
                    content={message.content}
                    toolInvocations={message.toolInvocations}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <div className='whitespace-pre-wrap break-words'>
                {message.content}
              </div>
              {/* Render user attachments */}
              <MessageAttachments
                attachments={message.experimental_attachments}
              />
            </>
          )}
        </div>
      </div>

      {message.role === "user" && (
        <div className='flex-shrink-0'>
          <div className='w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center'>
            <User className='w-4 h-4 text-white' />
          </div>
        </div>
      )}
    </div>
  );
}
