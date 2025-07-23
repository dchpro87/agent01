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

interface MessagePartsProps {
  parts: MessagePartType[];
  addToolResult: (result: { toolCallId: string; result: string }) => void;
}

export default function MessageParts({
  parts,
  addToolResult,
}: MessagePartsProps) {
  return (
    <>
      {parts.map((part, index) => {
        switch (part.type) {
          case "text":
            return (
              <div key={index} className='transition-all duration-300 ease-out'>
                <div className='whitespace-pre-wrap break-words'>
                  {part.text || ""}
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
                        <div className='whitespace-pre-wrap break-words'>
                          {String(toolInvocation.result || "")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
