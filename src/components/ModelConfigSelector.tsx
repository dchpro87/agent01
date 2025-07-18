"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Settings, ChevronDown, RotateCcw, Check } from "lucide-react";
import { OllamaModelOptions, MODEL_PRESETS, ModelPreset } from "@/types/ollama";
import { DEFAULT_OPTIONS, PRESET_INFO } from "@/constraints/model-config";
import { useDropdownState } from "@/hooks";

interface ModelConfigSelectorProps {
  selectedOptions: OllamaModelOptions;
  onOptionsChange: (options: OllamaModelOptions) => void;
  disabled?: boolean;
}

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
  const [activeTab, setActiveTab] = useState<"presets" | "advanced">("presets");
  const [currentOptions, setCurrentOptions] = useState<OllamaModelOptions>({
    ...DEFAULT_OPTIONS,
    ...selectedOptions,
  });
  const [hoveredPreset, setHoveredPreset] = useState<ModelPreset | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const { isOpen, setIsOpen, dropdownRef } = useDropdownState();

  // Clear tooltip when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setHoveredPreset(null);
    }
  }, [isOpen]);

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
          const defaultValue =
            DEFAULT_OPTIONS[key as keyof typeof DEFAULT_OPTIONS];

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
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className='flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        title='Model Configuration'
      >
        <Settings className='w-4 h-4 text-gray-500 dark:text-gray-400' />
        <span className='text-sm text-gray-700 dark:text-gray-300 max-w-32 truncate'>
          {currentPreset
            ? currentPreset.charAt(0).toUpperCase() + currentPreset.slice(1)
            : "Custom"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto'>
          {/* Header */}
          <div className='p-3 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium text-gray-900 dark:text-white'>
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
                  onClick={() =>
                    setActiveTab(
                      activeTab === "presets" ? "advanced" : "presets"
                    )
                  }
                  className={`p-1 transition-colors ${
                    activeTab === "advanced"
                      ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                  title={
                    activeTab === "presets" ? "Advanced settings" : "Presets"
                  }
                >
                  <Settings className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='max-h-80 overflow-y-auto'>
            {activeTab === "presets" && (
              <div>
                <div className='px-3 py-2 bg-gray-100 dark:bg-gray-700'>
                  <h4 className='text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                    Presets
                  </h4>
                </div>
                {Object.entries(PRESET_INFO).map(([preset, info]) => {
                  const Icon = info.icon;
                  const isSelected = currentPreset === preset;
                  return (
                    <div
                      key={preset}
                      className={`group px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-2 transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-transparent"
                      }`}
                      onClick={() => handlePresetSelect(preset as ModelPreset)}
                      onMouseEnter={(e) => {
                        setHoveredPreset(preset as ModelPreset);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPosition({
                          x: rect.left - 170,
                          y: rect.top + rect.height / 2 - 50,
                        });
                      }}
                      onMouseLeave={() => setHoveredPreset(null)}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`flex-shrink-0 p-1 rounded ${
                            isSelected
                              ? "bg-blue-100 dark:bg-blue-800"
                              : "bg-gray-100 dark:bg-gray-600"
                          }`}
                        >
                          <Icon className={`w-3 h-3 text-${info.color}-500`} />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between'>
                            <h5
                              className={`text-sm font-medium truncate capitalize ${
                                isSelected
                                  ? "text-blue-900 dark:text-blue-100"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {preset}
                              {isSelected && (
                                <Check className='inline ml-1 w-3 h-3 text-blue-600 dark:text-blue-400' />
                              )}
                            </h5>
                          </div>
                          <p
                            className={`text-xs mt-1 line-clamp-2 ${
                              isSelected
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "advanced" && (
              <div>
                <div className='px-3 py-2 bg-gray-100 dark:bg-gray-700'>
                  <h4 className='text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                    Advanced Parameters
                  </h4>
                </div>
                <div className='p-3 space-y-6'>
                  {/* Core Parameters */}
                  <div>
                    <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-4'>
                      Core Parameters
                    </h4>
                    <div className='space-y-4'>
                      {/* Temperature */}
                      <div className='py-1'>
                        <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-2'>
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
                        <div className='text-xs text-gray-500 mt-2'>
                          Controls randomness (0 = deterministic, 2 = very
                          random)
                        </div>
                      </div>

                      {/* Top K */}
                      <div className='py-1'>
                        <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-2'>
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
                            handleOptionChange(
                              "top_k",
                              parseInt(e.target.value)
                            )
                          }
                          className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                        />
                        <div className='text-xs text-gray-500 mt-2'>
                          Limits vocabulary to top K tokens
                        </div>
                      </div>

                      {/* Top P */}
                      <div className='py-1'>
                        <div className='flex items-center justify-between mb-3'>
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
                              {currentOptions.top_p === 0
                                ? "Enable"
                                : "Disable"}
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
                        <div className='text-xs text-gray-500 mt-2'>
                          Controls the diversity of the model&apos;s output by
                          filtering the probability distribution of possible
                          next tokens.
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {currentOptions.top_p === 0
                            ? " Disabled - using temperature for randomness control"
                            : " Enabled - overrides temperature setting (0.1-1.0, default 0.7)"}
                        </div>
                      </div>

                      {/* Repeat Penalty */}
                      <div className='py-1'>
                        <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-2'>
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
                        <div className='text-xs text-gray-500 mt-2'>
                          Penalizes repetition (1.0 = no penalty)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Token Control */}
                  <div>
                    <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-4'>
                      Token Control
                    </h4>
                    <div className='space-y-4'>
                      {/* Context Length */}
                      <div className='py-1'>
                        <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-2'>
                          Context Length (Tokens)
                          <span className='text-xs text-gray-500'>
                            {currentOptions.num_ctx}
                          </span>
                        </label>
                        <input
                          type='range'
                          min='512'
                          max='128000'
                          step='128'
                          value={currentOptions.num_ctx || 4096}
                          onChange={(e) =>
                            handleOptionChange(
                              "num_ctx",
                              parseInt(e.target.value)
                            )
                          }
                          className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                        />
                        <div className='text-xs text-gray-500 mt-2'>
                          Maximum context window size
                        </div>
                      </div>

                      {/* Max Tokens */}
                      <div className='py-1'>
                        <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-2'>
                          Max Tokens
                          <span className='text-xs text-gray-500'>
                            {currentOptions.maxTokens}
                          </span>
                        </label>
                        <input
                          type='range'
                          min='50'
                          max='128000'
                          step='10'
                          value={currentOptions.maxTokens || 1024}
                          onChange={(e) =>
                            handleOptionChange(
                              "maxTokens",
                              parseInt(e.target.value)
                            )
                          }
                          className='w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer'
                        />
                        <div className='text-xs text-gray-500 mt-2'>
                          Maximum tokens to generate in response
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Sampling */}
                  <div>
                    <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-4'>
                      Advanced Sampling
                    </h4>
                    <div className='space-y-4'>
                      {/* Min P */}
                      <div className='py-1'>
                        <label className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-2'>
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
                        <div className='text-xs text-gray-500 mt-2'>
                          Minimum probability threshold
                        </div>
                      </div>

                      {/* Seed */}
                      <div className='py-1'>
                        <label className='text-sm text-gray-700 dark:text-gray-300 mb-2 block'>
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
                        <div className='text-xs text-gray-500 mt-2'>
                          Fixed seed for reproducible outputs
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip Portal - renders outside the modal to prevent clipping */}
      {hoveredPreset &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className='fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-xl z-[9999] max-w-xs'
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
