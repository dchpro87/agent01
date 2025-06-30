"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Settings,
  ChevronDown,
  RotateCcw,
  X,
  Sliders,
  Brain,
  Code,
  Target,
  BarChart3,
} from "lucide-react";
import { OllamaModelOptions, MODEL_PRESETS, ModelPreset } from "@/types/ollama";

interface ModelConfigSelectorProps {
  selectedOptions: OllamaModelOptions;
  onOptionsChange: (options: OllamaModelOptions) => void;
  disabled?: boolean;
}

// Default configuration
const DEFAULT_OPTIONS: OllamaModelOptions = {
  temperature: 0.7,
  top_k: 40,
  top_p: 0, // Set to 0 by default (disabled), temperature takes precedence
  repeat_penalty: 1.1,
  num_ctx: 2048,
  num_predict: 512,
};

const PRESET_INFO = {
  balanced: {
    icon: Sliders,
    description: "Balanced creativity and coherence",
    color: "blue",
  },
  creative: {
    icon: Brain,
    description: "High creativity and varied outputs",
    color: "purple",
  },
  precise: {
    icon: Target,
    description: "Focused and deterministic responses",
    color: "green",
  },
  coding: {
    icon: Code,
    description: "Optimized for code generation",
    color: "orange",
  },
  analytical: {
    icon: BarChart3,
    description: "Structured analytical thinking",
    color: "indigo",
  },
} as const;

// Helper function to format preset parameters for tooltip
const formatPresetParameters = (preset: ModelPreset): string => {
  const params = MODEL_PRESETS[preset];
  return Object.entries(params)
    .map(([key, value]) => {
      const formattedKey = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const formattedValue =
        typeof value === "number" && value % 1 !== 0 ? value.toFixed(2) : value;
      return `${formattedKey}: ${formattedValue}`;
    })
    .join("\n");
};

export default function ModelConfigSelector({
  selectedOptions,
  onOptionsChange,
  disabled = false,
}: ModelConfigSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"presets" | "advanced">("presets");
  const [currentOptions, setCurrentOptions] = useState<OllamaModelOptions>({
    ...DEFAULT_OPTIONS,
    ...selectedOptions,
  });
  const [hoveredPreset, setHoveredPreset] = useState<ModelPreset | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Update local state when props change
  useEffect(() => {
    setCurrentOptions({ ...DEFAULT_OPTIONS, ...selectedOptions });
  }, [selectedOptions]);

  const handlePresetSelect = (preset: ModelPreset) => {
    const presetOptions = MODEL_PRESETS[preset];
    setCurrentOptions(presetOptions);
    onOptionsChange(presetOptions);
    setHoveredPreset(null); // Clear the tooltip
    setIsOpen(false); // Close the dropdown when a preset is selected
  };

  const handleOptionChange = (
    key: keyof OllamaModelOptions,
    value: number | string | boolean | string[] | undefined
  ) => {
    const newOptions = { ...currentOptions };
    if (value === undefined) {
      delete newOptions[key];
    } else {
      (newOptions as Record<string, unknown>)[key] = value;
    }
    setCurrentOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const resetToDefaults = () => {
    setCurrentOptions(DEFAULT_OPTIONS);
    onOptionsChange(DEFAULT_OPTIONS);
  };

  const getCurrentPreset = (): ModelPreset | null => {
    for (const [presetName, presetOptions] of Object.entries(MODEL_PRESETS)) {
      // Check if all preset parameters match current options
      const presetMatches = Object.entries(presetOptions).every(
        ([key, value]) =>
          currentOptions[key as keyof OllamaModelOptions] === value
      );

      // Check if any non-preset parameters have been modified from defaults
      const hasOnlyDefaultNonPresetParams = Object.keys(currentOptions).every(
        (key) => {
          const presetValue = presetOptions[key as keyof typeof presetOptions];
          const currentValue = currentOptions[key as keyof OllamaModelOptions];
          const defaultValue = DEFAULT_OPTIONS[key as keyof OllamaModelOptions];

          // If the parameter is in the preset, it must match exactly (already checked above)
          if (presetValue !== undefined) {
            return presetValue === currentValue;
          }

          // If the parameter is not in the preset, it must match the default value
          // Any deviation from default means it's a custom configuration
          return currentValue === defaultValue;
        }
      );

      if (presetMatches && hasOnlyDefaultNonPresetParams) {
        return presetName as ModelPreset;
      }
    }
    return null;
  };

  const currentPreset = getCurrentPreset();

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        title='Model Configuration'
      >
        <Settings className='w-4 h-4' />
        <span className='hidden sm:inline'>
          {currentPreset
            ? currentPreset.charAt(0).toUpperCase() + currentPreset.slice(1)
            : "Custom"}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50'>
          <div className='p-4'>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                Model Configuration
              </h3>
              <div className='flex items-center gap-2'>
                <button
                  onClick={resetToDefaults}
                  className='p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  title='Reset to defaults'
                >
                  <RotateCcw className='w-4 h-4' />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className='p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className='flex border-b border-gray-200 dark:border-gray-600 mb-4'>
              <button
                onClick={() => setActiveTab("presets")}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "presets"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => setActiveTab("advanced")}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "advanced"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                Advanced
              </button>
            </div>

            {/* Presets Tab */}
            {activeTab === "presets" && (
              <div className='space-y-3'>
                {Object.entries(PRESET_INFO).map(([preset, info]) => {
                  const Icon = info.icon;
                  const isSelected = currentPreset === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => handlePresetSelect(preset as ModelPreset)}
                      onMouseEnter={(e) => {
                        setHoveredPreset(preset as ModelPreset);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPosition({
                          x: rect.left - 250, // Position tooltip to the left of the button
                          y: rect.top + rect.height / 2 - 50, // Center vertically relative to button
                        });
                      }}
                      onMouseLeave={() => setHoveredPreset(null)}
                      className={`w-full p-3 text-left border rounded-lg transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <Icon className={`w-5 h-5 text-${info.color}-500`} />
                        <div>
                          <div className='font-medium text-gray-900 dark:text-white capitalize'>
                            {preset}
                          </div>
                          <div className='text-sm text-gray-500 dark:text-gray-400'>
                            {info.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === "advanced" && (
              <div className='space-y-4 max-h-96 overflow-y-auto'>
                {/* Core Parameters */}
                <div>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3'>
                    Core Parameters
                  </h4>
                  <div className='space-y-3'>
                    {/* Temperature */}
                    <div>
                      <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1'>
                        Temperature
                        <span className='text-xs text-gray-500'>
                          {currentOptions.temperature?.toFixed(2)}
                        </span>
                      </label>
                      <input
                        type='range'
                        min='0'
                        max='2'
                        step='0.01'
                        value={currentOptions.temperature || 0.7}
                        onChange={(e) =>
                          handleOptionChange(
                            "temperature",
                            parseFloat(e.target.value)
                          )
                        }
                        className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Controls randomness (0 = deterministic, 2 = very random)
                      </div>
                    </div>

                    {/* Top K */}
                    <div>
                      <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1'>
                        Top K
                        <span className='text-xs text-gray-500'>
                          {currentOptions.top_k}
                        </span>
                      </label>
                      <input
                        type='range'
                        min='1'
                        max='100'
                        step='1'
                        value={currentOptions.top_k || 40}
                        onChange={(e) =>
                          handleOptionChange("top_k", parseInt(e.target.value))
                        }
                        className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Limits vocabulary to top K tokens
                      </div>
                    </div>

                    {/* Top P */}
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <label className='text-sm text-gray-700 dark:text-gray-300'>
                          Top P (Nucleus Sampling)
                        </label>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => {
                              if (currentOptions.top_p === 0) {
                                // Enable with default value of 0.7
                                handleOptionChange("top_p", 0.7);
                              } else {
                                // Disable by setting to 0
                                handleOptionChange("top_p", 0);
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              currentOptions.top_p === 0
                                ? "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {currentOptions.top_p === 0 ? "Enable" : "Disable"}
                          </button>
                          <span className='text-xs text-gray-500'>
                            {currentOptions.top_p?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                      </div>
                      <input
                        type='range'
                        min='0'
                        max='1'
                        step='0.1'
                        value={currentOptions.top_p || 0}
                        disabled={currentOptions.top_p === 0}
                        onChange={(e) =>
                          handleOptionChange(
                            "top_p",
                            parseFloat(e.target.value)
                          )
                        }
                        className={`w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer ${
                          currentOptions.top_p === 0 ? "opacity-50" : ""
                        }`}
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Controls the diversity of the model&apos;s output by
                        filtering the probability distribution of possible next
                        tokens.
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        {currentOptions.top_p === 0
                          ? " Disabled - using temperature for randomness control"
                          : " Enabled - overrides temperature setting (0.1-1.0, default 0.7)"}
                      </div>
                    </div>

                    {/* Repeat Penalty */}
                    <div>
                      <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1'>
                        Repeat Penalty
                        <span className='text-xs text-gray-500'>
                          {currentOptions.repeat_penalty?.toFixed(2)}
                        </span>
                      </label>
                      <input
                        type='range'
                        min='0.8'
                        max='1.5'
                        step='0.01'
                        value={currentOptions.repeat_penalty || 1.1}
                        onChange={(e) =>
                          handleOptionChange(
                            "repeat_penalty",
                            parseFloat(e.target.value)
                          )
                        }
                        className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Penalizes repetition (1.0 = no penalty)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Control */}
                <div>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3'>
                    Token Control
                  </h4>
                  <div className='space-y-3'>
                    {/* Context Length */}
                    <div>
                      <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1'>
                        Context Length
                        <span className='text-xs text-gray-500'>
                          {currentOptions.num_ctx}
                        </span>
                      </label>
                      <input
                        type='range'
                        min='512'
                        max='8192'
                        step='128'
                        value={currentOptions.num_ctx || 2048}
                        onChange={(e) =>
                          handleOptionChange(
                            "num_ctx",
                            parseInt(e.target.value)
                          )
                        }
                        className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Maximum context window size
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1'>
                        Max Tokens
                        <span className='text-xs text-gray-500'>
                          {currentOptions.num_predict}
                        </span>
                      </label>
                      <input
                        type='range'
                        min='50'
                        max='2048'
                        step='10'
                        value={currentOptions.num_predict || 512}
                        onChange={(e) =>
                          handleOptionChange(
                            "num_predict",
                            parseInt(e.target.value)
                          )
                        }
                        className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Maximum tokens to generate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Sampling */}
                <div>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3'>
                    Advanced Sampling
                  </h4>
                  <div className='space-y-3'>
                    {/* Min P */}
                    <div>
                      <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1'>
                        Min P
                        <span className='text-xs text-gray-500'>
                          {currentOptions.min_p?.toFixed(3) || "0.000"}
                        </span>
                      </label>
                      <input
                        type='range'
                        min='0'
                        max='0.5'
                        step='0.001'
                        value={currentOptions.min_p || 0}
                        onChange={(e) =>
                          handleOptionChange(
                            "min_p",
                            parseFloat(e.target.value)
                          )
                        }
                        className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Minimum probability threshold
                      </div>
                    </div>

                    {/* Seed */}
                    <div>
                      <label className='text-sm text-gray-700 dark:text-gray-300 mb-1 block'>
                        Seed (for reproducibility)
                      </label>
                      <input
                        type='number'
                        placeholder='Random'
                        value={currentOptions.seed || ""}
                        onChange={(e) =>
                          handleOptionChange(
                            "seed",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      />
                      <div className='text-xs text-gray-500 mt-1'>
                        Fixed seed for reproducible outputs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Configuration Summary */}
            <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-600'>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                <div className='flex justify-between items-center'>
                  <span>Configuration:</span>
                  <span className='font-medium'>
                    {currentPreset ? `${currentPreset} preset` : "Custom"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip Portal - renders outside the modal to prevent clipping */}
      {hoveredPreset &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className='fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-[9999] max-w-xs'
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              pointerEvents: "none", // Prevent tooltip from interfering with mouse events
            }}
          >
            <div className='text-sm font-medium text-gray-900 dark:text-white mb-2 capitalize'>
              {hoveredPreset} Parameters
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line'>
              {formatPresetParameters(hoveredPreset)}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
