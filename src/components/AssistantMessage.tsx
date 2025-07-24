import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ToolInvocation } from "@/types/chat";

interface AssistantMessageProps {
  content: string;
  toolInvocations?: ToolInvocation[];
}

// Helper function to render tool results based on their type and structure
const renderToolResult = (
  result: unknown,
  toolName: string
): React.JSX.Element => {
  // Add debugging
  console.log("🔍 AssistantMessage renderToolResult called with:", {
    toolName,
    resultType: typeof result,
    result: result,
    isObject: typeof result === "object",
    resultKeys:
      typeof result === "object" && result ? Object.keys(result) : null,
  });

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
        console.log("🔍 AssistantMessage handling searchWeb result:", result);
        const searchResult = result as {
          query?: string;
          engine?: string;
          location?: string;
          resultsCount?: number;
          results?: Array<{
            title?: string;
            link?: string;
            snippet?: string;
            position?: number;
          }>;
          metadata?: {
            totalResults?: string;
            searchTime?: string;
          };
        };

        return (
          <div className='space-y-3'>
            <div className='text-sm font-medium text-blue-700 dark:text-blue-300'>
              Search: &ldquo;{searchResult.query}&rdquo; via{" "}
              {searchResult.engine}
              {searchResult.location && searchResult.location !== "Global" && (
                <span> in {searchResult.location}</span>
              )}
            </div>

            {searchResult.metadata && (
              <div className='text-xs text-blue-600 dark:text-blue-400 mb-2'>
                Found {searchResult.metadata.totalResults} results in{" "}
                {searchResult.metadata.searchTime}
              </div>
            )}

            {searchResult.results && searchResult.results.length > 0 && (
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
                        {item.link}
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
      console.log(
        "🔍 AssistantMessage showing generic structured result for tool:",
        toolName
      );
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

export default function AssistantMessage({
  content,
  toolInvocations,
}: AssistantMessageProps) {
  return (
    <>
      {/* Render content */}
      <div className='transition-all duration-300 ease-out'>
        <div className='prose prose-sm dark:prose-invert max-w-none'>
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      </div>

      {/* Render tool invocations if any */}
      {toolInvocations && toolInvocations.length > 0 && (
        <>
          {toolInvocations.map((toolInvocation, index) => (
            <div
              key={index}
              className='mb-3 border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 transition-all duration-300 ease-out'
            >
              <div className='text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide'>
                🔧 Tool: {toolInvocation.toolName}
              </div>
              {toolInvocation.args &&
                Object.keys(toolInvocation.args).length > 0 && (
                  <div className='text-xs text-blue-700 dark:text-blue-300 mb-2'>
                    <strong>Arguments:</strong>{" "}
                    {JSON.stringify(toolInvocation.args, null, 2)}
                  </div>
                )}
              {toolInvocation.state === "result" &&
                "result" in toolInvocation && (
                  <div className='text-sm text-blue-800 dark:text-blue-200'>
                    <strong>Result:</strong>
                    <div className='mt-1 p-2 bg-blue-100 dark:bg-blue-800 rounded'>
                      {renderToolResult(
                        toolInvocation.result,
                        toolInvocation.toolName
                      )}
                    </div>
                  </div>
                )}
              {toolInvocation.state === "call" && (
                <div className='text-xs text-blue-600 dark:text-blue-400'>
                  <em>Calling tool...</em>
                </div>
              )}
              {toolInvocation.state === "partial-call" && (
                <div className='text-xs text-blue-600 dark:text-blue-400'>
                  <em>Preparing tool call...</em>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}
