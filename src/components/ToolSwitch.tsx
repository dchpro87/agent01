"use client";

import { Wrench } from "lucide-react";

interface ToolSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  modelSupportsTools?: boolean;
}

export default function ToolSwitch({
  enabled,
  onChange,
  disabled = false,
  modelSupportsTools = true,
}: ToolSwitchProps) {
  const isDisabled = disabled || !modelSupportsTools;

  return (
    <button
      type='button'
      onClick={() => !isDisabled && onChange(!enabled)}
      disabled={isDisabled}
      className={`
        p-2 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800
        ${
          enabled && !isDisabled
            ? "text-green-500 focus:ring-green-500"
            : "text-gray-600 dark:text-gray-400 focus:ring-gray-500"
        }
      `}
      title={
        !modelSupportsTools
          ? "Current model doesn't support tools"
          : enabled
          ? "Disable tools/function calling"
          : "Enable tools/function calling"
      }
    >
      <Wrench
        className={`
          w-5 h-5 transition-all duration-200
          ${enabled && !isDisabled ? "drop-shadow-sm" : ""}
        `}
      />
    </button>
  );
}
