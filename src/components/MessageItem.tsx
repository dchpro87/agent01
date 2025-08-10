import type { Message } from '@ai-sdk/react';
import { RotateCw } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AssistantMessage from './AssistantMessage';
import MessageParts from './MessageParts';
import MessageAttachments from './MessageAttachments';

// Add Message parts type - more comprehensive to match AI SDK
interface MessagePartType {
  type:
    | 'text'
    | 'text-delta'
    | 'tool-invocation'
    | 'tool-call'
    | 'tool-result'
    | 'step-start'
    | 'reasoning'
    | 'source'
    | 'file';
  text?: string;
  textDelta?: string; // For streaming text deltas
  toolInvocation?: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: 'partial-call' | 'call' | 'result';
    result?: unknown;
  };
  // AI SDK tool call format
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  reasoning?: string;
  source?: unknown;
  // File content
  base64?: string;
  uint8Array?: Uint8Array;
  mimeType?: string;
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
  // connectionStatus,
  onResend,
  isStreaming,
  addToolResult,
}: MessageItemProps) {
  return (
    <div
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-3xl px-4 py-3 rounded-2xl transition-all duration-300 ease-out ${
          message.role === 'user'
            ? 'bg-blue-500 text-white relative'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
        }`}
      >
        {/* Resend button for user messages */}
        {message.role === 'user' && onResend && (
          <button
            onClick={() => onResend(message)}
            disabled={isStreaming}
            className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${
              isStreaming
                ? 'bg-blue-400 cursor-not-allowed opacity-50'
                : 'bg-blue-600 hover:bg-blue-700 opacity-100'
            } text-white`}
            title={
              isStreaming ? 'Cannot resend while streaming' : 'Edit message'
            }
          >
            <RotateCw className='w-4 h-4' />
          </button>
        )}

        <div
          className={`prose prose-sm max-w-none dark:prose-invert transition-all duration-300 ease-out ${
            message.role === 'user' && onResend ? 'pr-8' : ''
          }`}
        >
          {message.role === 'assistant' ? (
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
              <div className='prose prose-sm dark:prose-invert max-w-none'>
                <Markdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </Markdown>
              </div>
              {/* Render user attachments */}
              <MessageAttachments
                attachments={message.experimental_attachments}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
