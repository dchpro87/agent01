import type { ToolInvocation } from "@/types/chat";

interface AssistantMessageProps {
  content: string;
  toolInvocations?: ToolInvocation[];
}

export default function AssistantMessage({
  content,
  toolInvocations,
}: AssistantMessageProps) {
  return (
    <>
      {/* Render content */}
      <div className='transition-all duration-300 ease-out'>
        <div className='whitespace-pre-wrap break-words'>{content}</div>
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
                      <div className='whitespace-pre-wrap break-words'>
                        {String(toolInvocation.result || "")}
                      </div>
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
