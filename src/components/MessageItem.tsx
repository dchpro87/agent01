import type { Message } from '@ai-sdk/react';
import { RotateCw, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AssistantMessage from './AssistantMessage';
import MessageParts from './MessageParts';
import MessageAttachments from './MessageAttachments';
import {
  extractMainTextContent,
  copyMessageFromDOM,
} from '@/utils/message-text-extractor';

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
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const textContent = extractMainTextContent(message);
    const success = await copyMessageFromDOM(textContent, e.currentTarget);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700 relative'
        }`}
      >
        {/* Resend and Copy buttons for user messages */}
        {message.role === 'user' && (
          <div className='absolute top-2 right-2 flex gap-1'>
            {onResend && (
              <button
                onClick={() => onResend(message)}
                disabled={isStreaming}
                className={`p-1 rounded-full transition-all duration-200 ${
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
            <button
              onClick={handleCopy}
              className='p-1 rounded-full transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white'
              title='Copy message'
            >
              {copied ? (
                <Check className='w-4 h-4' />
              ) : (
                <Copy className='w-4 h-4' />
              )}
            </button>
          </div>
        )}

        {/* Copy button for assistant messages */}
        {message.role === 'assistant' && (
          <button
            onClick={handleCopy}
            className='absolute top-2 right-2 p-1 rounded-full transition-all duration-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            title='Copy message'
          >
            {copied ? (
              <Check className='w-4 h-4' />
            ) : (
              <Copy className='w-4 h-4' />
            )}
          </button>
        )}

        <div
          className={`prose prose-sm max-w-none dark:prose-invert transition-all duration-300 ease-out ${
            message.role === 'user' ? 'pr-16' : 'pr-10'
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
