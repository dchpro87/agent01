import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Add Message parts type - more comprehensive to match AI SDK
interface MessagePartType {
  type:
    | "text"
    | "text-delta"
    | "tool-invocation"
    | "tool-call"
    | "tool-result"
    | "step-start"
    | "reasoning"
    | "source"
    | "file";
  text?: string;
  textDelta?: string; // For streaming text deltas
  toolInvocation?: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: "partial-call" | "call" | "result";
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

interface MessagePartsProps {
  parts: MessagePartType[];
  addToolResult: (result: { toolCallId: string; result: string }) => void;
}

// Helper function to render tool results based on their type and structure
const renderToolResult = (
  result: unknown,
  toolName: string
): React.JSX.Element => {
  if (!result) {
    return <div className='text-gray-500 italic'>No result</div>;
  }

  // If result is a string, display it directly
  if (typeof result === "string") {
    return (
      <div className='prose prose-sm dark:prose-invert max-w-none'>
        <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
      </div>
    );
  }

  // If result is an object, handle it based on the tool type
  if (typeof result === "object") {
    try {
      // Handle search results specifically
      if (toolName === "searchWeb" && result && typeof result === "object") {
        const searchResult = result as {
          query?: string;
          engine?: string;
          location?: string;
          resultsCount?: number;
          results?:
            | string
            | Array<{
                title?: string;
                link?: string;
                snippet?: string;
                position?: number;
              }>;
          metadata?: {
            totalResults?: string;
            searchTime?: string;
          };
          timestamp?: string;
          searchId?: string;
        };

        return (
          <div className='space-y-3'>
            <div className='text-sm font-medium text-blue-700 dark:text-blue-300'>
              🔍 Search: &ldquo;{searchResult.query}&rdquo; via{" "}
              {searchResult.engine}
              {searchResult.location && searchResult.location !== "Global" && (
                <span> in {searchResult.location}</span>
              )}
            </div>

            {searchResult.metadata && (
              <div className='text-xs text-blue-600 dark:text-blue-400 mb-2'>
                📊 Found {searchResult.metadata.totalResults} results in{" "}
                {searchResult.metadata.searchTime}
                {searchResult.timestamp && (
                  <span className='ml-2'>at {searchResult.timestamp}</span>
                )}
              </div>
            )}

            {/* Handle both string and array results */}
            {searchResult.results && (
              <div className='space-y-2'>
                {typeof searchResult.results === "string" ? (
                  // Render formatted string results using Markdown
                  <div className='prose prose-sm dark:prose-invert max-w-none'>
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {searchResult.results}
                    </Markdown>
                  </div>
                ) : (
                  // Handle array results (for structured data)
                  <div className='space-y-2'>
                    {searchResult.results.slice(0, 5).map((item, index) => (
                      <div
                        key={index}
                        className='border-l-2 border-blue-300 pl-3 py-1'
                      >
                        {item.title && (
                          <div className='font-medium text-sm text-blue-800 dark:text-blue-200'>
                            {item.title}
                          </div>
                        )}
                        {item.snippet && (
                          <div className='text-xs text-gray-600 dark:text-gray-300 mt-1'>
                            {item.snippet}
                          </div>
                        )}
                        {item.link && (
                          <div className='text-xs text-blue-500 dark:text-blue-400 mt-1 truncate'>
                            <a
                              href={item.link}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='hover:underline'
                            >
                              {item.link}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                    {searchResult.results.length > 5 && (
                      <div className='text-xs text-gray-500 italic'>
                        ... and {searchResult.results.length - 5} more results
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // Handle BMI calculation results
      if (toolName === "calculateBMI" && result && typeof result === "object") {
        const bmiResult = result as {
          height?: number;
          weight?: number;
          bmi?: number;
          category?: string;
          healthAdvice?: string;
        };

        return (
          <div className='space-y-2'>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div>Height: {bmiResult.height}cm</div>
              <div>Weight: {bmiResult.weight}kg</div>
              <div className='font-medium'>BMI: {bmiResult.bmi}</div>
              <div className='font-medium'>Category: {bmiResult.category}</div>
            </div>
            {bmiResult.healthAdvice && (
              <div className='text-sm text-gray-600 dark:text-gray-300 mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded'>
                {bmiResult.healthAdvice}
              </div>
            )}
          </div>
        );
      }

      // Handle document summarizer results
      if (
        toolName === "documentSummarizer" &&
        result &&
        typeof result === "object"
      ) {
        const summaryResult = result as {
          document?: string;
          summary?: string;
          keyPoints?: string[];
          wordCount?: number;
        };

        return (
          <div className='space-y-2'>
            {summaryResult.document && (
              <div className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                Document: {summaryResult.document}
              </div>
            )}
            {summaryResult.summary && (
              <div className='text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded'>
                <strong>Summary:</strong> {summaryResult.summary}
              </div>
            )}
            {summaryResult.keyPoints && summaryResult.keyPoints.length > 0 && (
              <div className='text-sm'>
                <strong>Key Points:</strong>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  {summaryResult.keyPoints.map((point, index) => (
                    <li key={index} className='text-xs'>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summaryResult.wordCount && (
              <div className='text-xs text-gray-500'>
                Word count: {summaryResult.wordCount}
              </div>
            )}
          </div>
        );
      }

      // For other structured results, show a formatted JSON view
      return (
        <div className='space-y-2'>
          <div className='text-sm'>
            <strong>Structured Result ({toolName}):</strong>
          </div>
          <pre className='text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap'>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      );
    } catch {
      // Fallback to string representation if JSON parsing fails
      return (
        <div className='prose prose-sm dark:prose-invert max-w-none'>
          <Markdown remarkPlugins={[remarkGfm]}>{String(result)}</Markdown>
        </div>
      );
    }
  }

  // For other types (number, boolean, etc.), convert to string
  return (
    <div className='prose prose-sm dark:prose-invert max-w-none'>
      <Markdown remarkPlugins={[remarkGfm]}>{String(result)}</Markdown>
    </div>
  );
};

export default function MessageParts({
  parts,
  addToolResult,
}: MessagePartsProps) {
  return (
    <>
      {parts.map((part, index) => {
        switch (part.type) {
          case "text":
          case "text-delta":
            return (
              <div key={index} className='transition-all duration-300 ease-out'>
                <div className='prose prose-sm dark:prose-invert max-w-none'>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {part.text || part.textDelta || ""}
                  </Markdown>
                </div>
              </div>
            );

          case "reasoning":
            return (
              <div
                key={index}
                className='mb-3 border border-amber-200 dark:border-amber-700 rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20 transition-all duration-300 ease-out'
              >
                <div className='text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wide flex items-center gap-1'>
                  💭 Thinking
                </div>
                <div className='text-sm text-amber-800 dark:text-amber-200 leading-relaxed'>
                  <div className='prose prose-sm dark:prose-invert max-w-none font-mono text-xs bg-amber-100 dark:bg-amber-800/50 p-2 rounded italic'>
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {part.text || part.textDelta || part.reasoning || ""}
                    </Markdown>
                  </div>
                </div>
              </div>
            );

          case "tool-call":
            return (
              <div
                key={index}
                className='mb-3 border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 transition-all duration-300 ease-out'
              >
                <div className='text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide'>
                  🔧 Tool Call: {part.toolName}
                </div>
                <div className='text-sm text-blue-800 dark:text-blue-200'>
                  {part.args && Object.keys(part.args).length > 0 && (
                    <div className='mb-2'>
                      <strong>Arguments:</strong>
                      <pre className='text-xs bg-blue-100 dark:bg-blue-800 p-1 rounded mt-1'>
                        {JSON.stringify(part.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );

          case "tool-result":
            return (
              <div
                key={index}
                className='mb-3 border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 transition-all duration-300 ease-out'
              >
                <div className='text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide'>
                  🔧 Tool Result: {part.toolName}
                </div>
                <div className='text-sm text-blue-800 dark:text-blue-200'>
                  <div>
                    <strong>Result:</strong>
                    <div className='mt-1 p-2 bg-blue-100 dark:bg-blue-800 rounded'>
                      {renderToolResult(part.result, part.toolName || "")}
                    </div>
                  </div>
                </div>
              </div>
            );

          case "tool-invocation":
            const toolInvocation = part.toolInvocation;
            if (!toolInvocation) return null;

            return (
              <div
                key={index}
                className='mb-3 border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 transition-all duration-300 ease-out'
              >
                <div className='text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide'>
                  🔧 Tool: {toolInvocation.toolName}
                </div>

                {/* Handle different tool invocation states */}
                {toolInvocation.state === "partial-call" && (
                  <div className='text-xs text-blue-600 dark:text-blue-400'>
                    <em>Preparing tool call...</em>
                    {toolInvocation.args &&
                      Object.keys(toolInvocation.args).length > 0 && (
                        <div className='mt-1'>
                          <strong>Arguments (partial):</strong>
                          <pre className='text-xs bg-blue-100 dark:bg-blue-800 p-1 rounded mt-1'>
                            {JSON.stringify(toolInvocation.args, null, 2)}
                          </pre>
                        </div>
                      )}
                  </div>
                )}

                {toolInvocation.state === "call" && (
                  <div>
                    {/* Handle interactive confirmation tool */}
                    {toolInvocation.toolName === "askForConfirmation" && (
                      <div className='text-sm text-blue-800 dark:text-blue-200'>
                        <div className='mb-2'>
                          <strong>Confirmation Required:</strong>
                        </div>
                        <div className='mb-2 p-2 bg-blue-100 dark:bg-blue-800 rounded'>
                          {String(toolInvocation.args.message || "")}
                        </div>
                        <div className='text-xs text-blue-600 dark:text-blue-400 mb-2'>
                          <strong>Action:</strong>{" "}
                          {String(toolInvocation.args.action || "")}
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() =>
                              addToolResult({
                                toolCallId: toolInvocation.toolCallId,
                                result: "Yes, confirmed.",
                              })
                            }
                            className='px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm'
                          >
                            Yes
                          </button>
                          <button
                            onClick={() =>
                              addToolResult({
                                toolCallId: toolInvocation.toolCallId,
                                result: "No, denied.",
                              })
                            }
                            className='px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm'
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Handle other tools in call state */}
                    {toolInvocation.toolName !== "askForConfirmation" && (
                      <div className='text-xs text-blue-600 dark:text-blue-400'>
                        <em>Calling tool...</em>
                        {toolInvocation.args &&
                          Object.keys(toolInvocation.args).length > 0 && (
                            <div className='mt-1'>
                              <strong>Arguments:</strong>
                              <pre className='text-xs bg-blue-100 dark:bg-blue-800 p-1 rounded mt-1'>
                                {JSON.stringify(toolInvocation.args, null, 2)}
                              </pre>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {toolInvocation.state === "result" && (
                  <div className='text-sm text-blue-800 dark:text-blue-200'>
                    {toolInvocation.args &&
                      Object.keys(toolInvocation.args).length > 0 && (
                        <div className='text-xs text-blue-700 dark:text-blue-300 mb-2'>
                          <strong>Arguments:</strong>
                          <pre className='text-xs bg-blue-100 dark:bg-blue-800 p-1 rounded mt-1'>
                            {JSON.stringify(toolInvocation.args, null, 2)}
                          </pre>
                        </div>
                      )}
                    <div>
                      <strong>Result:</strong>
                      <div className='mt-1 p-2 bg-blue-100 dark:bg-blue-800 rounded'>
                        {renderToolResult(
                          toolInvocation.result,
                          toolInvocation.toolName
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );

          case "source":
            return (
              <div
                key={index}
                className='mb-3 border border-green-200 dark:border-green-700 rounded-lg p-3 bg-green-50 dark:bg-green-900/20 transition-all duration-300 ease-out'
              >
                <div className='text-xs font-medium text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide flex items-center gap-1'>
                  📄 Source
                </div>
                <div className='text-sm text-green-800 dark:text-green-200'>
                  <div className='prose prose-sm dark:prose-invert max-w-none'>
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {part.text || JSON.stringify(part, null, 2)}
                    </Markdown>
                  </div>
                </div>
              </div>
            );

          case "file":
            return (
              <div
                key={index}
                className='mb-3 border border-orange-200 dark:border-orange-700 rounded-lg p-3 bg-orange-50 dark:bg-orange-900/20 transition-all duration-300 ease-out'
              >
                <div className='text-xs font-medium text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wide flex items-center gap-1'>
                  📁 File
                </div>
                <div className='text-sm text-orange-800 dark:text-orange-200'>
                  <div className='prose prose-sm dark:prose-invert max-w-none'>
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {part.text || JSON.stringify(part, null, 2)}
                    </Markdown>
                  </div>
                </div>
              </div>
            );

          case "step-start":
            // Step boundaries without visual separator
            return null;

          default:
            // Handle unknown part types
            return (
              <div key={index} className='text-gray-500 text-sm'>
                <em>Unknown message part type: {part.type}</em>
                <pre className='text-xs mt-1 bg-gray-100 p-2 rounded'>
                  {JSON.stringify(part, null, 2)}
                </pre>
              </div>
            );
        }
      })}
    </>
  );
}
