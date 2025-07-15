import { useState, useEffect } from "react";
import { OllamaModelOptions } from "@/types/ollama";
import { checkModelSupportsTools } from "@/constraints/chat-constraints";
import { DEFAULT_OPTIONS } from "@/constraints/model-config";
import { PREDEFINED_PROMPTS } from "@/constraints/predefined-system-prompts";

export function usePersistedPreferences() {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>(
    PREDEFINED_PROMPTS[0].prompt
  );
  const [modelOptions, setModelOptions] =
    useState<OllamaModelOptions>(DEFAULT_OPTIONS); // Default to "balanced" preset
  const [modelSupportsTools, setModelSupportsTools] = useState<boolean>(true);
  const [isWarningDismissed, setIsWarningDismissed] = useState<boolean>(false);
  const [toolsEnabled, setToolsEnabled] = useState<boolean>(true);

  // Update tool support when model changes
  useEffect(() => {
    if (selectedModel) {
      setModelSupportsTools(checkModelSupportsTools(selectedModel));
      // Reset warning dismissal when model changes
      setIsWarningDismissed(false);
    }
  }, [selectedModel]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    const savedPrompt = localStorage.getItem("selectedSystemPrompt");
    const savedOptions = localStorage.getItem("modelOptions");
    const savedToolsEnabled = localStorage.getItem("toolsEnabled");

    if (savedModel) setSelectedModel(savedModel);
    if (savedPrompt) setSystemPrompt(savedPrompt);
    if (savedToolsEnabled !== null)
      setToolsEnabled(savedToolsEnabled === "true");
    if (savedOptions) {
      try {
        setModelOptions(JSON.parse(savedOptions));
      } catch (error) {
        console.error("Failed to parse saved model options:", error);
      }
    }
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    if (selectedModel) localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (systemPrompt)
      localStorage.setItem("selectedSystemPrompt", systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem("modelOptions", JSON.stringify(modelOptions));
  }, [modelOptions]);

  // Save toolsEnabled to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("toolsEnabled", String(toolsEnabled));
  }, [toolsEnabled]);

  return {
    selectedModel,
    setSelectedModel,
    systemPrompt,
    setSystemPrompt,
    modelOptions,
    setModelOptions,
    modelSupportsTools,
    isWarningDismissed,
    setIsWarningDismissed,
    toolsEnabled,
    setToolsEnabled,
  };
}
