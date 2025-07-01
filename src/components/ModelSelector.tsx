"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2, Bot } from "lucide-react";

interface Model {
  name: string;
  size: number;
  modified_at: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/models");
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }

        const data = await response.json();
        // Sort models by name alphabetically
        const sortedModels = (data.models || []).sort((a: Model, b: Model) =>
          a.name.localeCompare(b.name)
        );
        setModels(sortedModels);

        // Only set default if no model is selected and none is saved in localStorage
        if (!selectedModel && data.default) {
          const savedModel = localStorage.getItem("selectedModel");
          if (!savedModel) {
            onModelChange(data.default);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Failed to fetch models:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [selectedModel, onModelChange]);

  const formatModelSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getModelDisplayName = (modelName: string) => {
    // Remove common suffixes for cleaner display
    return modelName.replace(/:latest$/, "").replace(/:.+$/, (match) => {
      return match; // Keep version tags for now
    });
  };

  if (loading) {
    return (
      <div className='flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
        <Loader2 className='w-4 h-4 animate-spin' />
        <span>Loading models...</span>
      </div>
    );
  }

  if (error || models.length === 0) {
    return (
      <div className='flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
        <Bot className='w-4 h-4' />
        <span>{error || "No models available"}</span>
      </div>
    );
  }

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className='flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
      >
        <Bot className='w-4 h-4 text-gray-500 dark:text-gray-400' />
        <span className='text-gray-900 dark:text-white font-medium'>
          {getModelDisplayName(selectedModel) || "Select Model"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-120 overflow-y-auto'>
          {models.map((model) => (
            <button
              key={model.name}
              onClick={() => {
                onModelChange(model.name);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                selectedModel === model.name
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <div className='font-medium'>
                    {getModelDisplayName(model.name)}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    Size: {formatModelSize(model.size)}
                  </div>
                </div>
                {selectedModel === model.name && (
                  <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div className='fixed inset-0 z-10' onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
