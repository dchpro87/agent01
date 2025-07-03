"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  ChevronDown,
  Plus,
  Save,
  X,
  Check,
  MessageSquare,
} from "lucide-react";
import {
  PREDEFINED_PROMPTS,
  type SystemPrompt,
} from "@/constants/predefined-system-prompts";

interface SystemPromptSelectorProps {
  selectedPrompt: string;
  onPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

export default function SystemPromptSelector({
  selectedPrompt,
  onPromptChange,
  disabled = false,
}: SystemPromptSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<SystemPrompt[]>([]);
  const [editingCustom, setEditingCustom] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptDescription, setNewPromptDescription] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState("default");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load custom prompts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("customSystemPrompts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomPrompts(parsed);
      } catch (error) {
        console.error("Failed to load custom prompts:", error);
      }
    }
    setIsHydrated(true);
  }, []);

  // Sync selectedPromptId when selectedPrompt changes
  useEffect(() => {
    if (!isHydrated) return;

    const allPrompts = [...PREDEFINED_PROMPTS, ...customPrompts];
    const matchingPrompt = allPrompts.find((p) => p.prompt === selectedPrompt);

    if (matchingPrompt) {
      setSelectedPromptId(matchingPrompt.id);
    } else {
      setSelectedPromptId("default");
    }
  }, [selectedPrompt, customPrompts, isHydrated]);

  // Save custom prompts to localStorage
  const saveCustomPrompts = (prompts: SystemPrompt[]) => {
    localStorage.setItem("customSystemPrompts", JSON.stringify(prompts));
    setCustomPrompts(prompts);
  };

  // Get all prompts (predefined + custom)
  const allPrompts = [...PREDEFINED_PROMPTS, ...customPrompts];

  // Find current prompt (during hydration, always use default to prevent mismatch)
  const currentPrompt = isHydrated
    ? allPrompts.find((p) => p.prompt === selectedPrompt) ||
      PREDEFINED_PROMPTS[0]
    : PREDEFINED_PROMPTS[0];

  // Handle prompt selection
  const handlePromptSelect = (prompt: SystemPrompt) => {
    setSelectedPromptId(prompt.id);
    onPromptChange(prompt.prompt);
    setIsOpen(false);
  };

  // Handle creating custom prompt
  const handleCreateCustom = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return;

    const newPrompt: SystemPrompt = {
      id: `custom-${Date.now()}`,
      name: newPromptName.trim(),
      description: newPromptDescription.trim() || "Custom prompt",
      prompt: newPromptContent.trim(),
      icon: MessageSquare,
      category: "Custom",
      isCustom: true,
    };

    const updatedCustomPrompts = [...customPrompts, newPrompt];
    saveCustomPrompts(updatedCustomPrompts);

    // Select the new prompt
    handlePromptSelect(newPrompt);

    // Reset form
    setEditingCustom(false);
    setNewPromptName("");
    setNewPromptDescription("");
    setNewPromptContent("");
  };

  // Handle deleting custom prompt
  const handleDeleteCustom = (promptId: string) => {
    const updatedCustomPrompts = customPrompts.filter((p) => p.id !== promptId);
    saveCustomPrompts(updatedCustomPrompts);

    // If the deleted prompt was selected, switch to default
    if (selectedPromptId === promptId) {
      handlePromptSelect(PREDEFINED_PROMPTS[0]);
    }
  };

  // Group prompts by category
  const groupedPrompts = allPrompts.reduce((groups, prompt) => {
    if (!groups[prompt.category]) {
      groups[prompt.category] = [];
    }
    groups[prompt.category].push(prompt);
    return groups;
  }, {} as Record<string, SystemPrompt[]>);

  const categories = Object.keys(groupedPrompts).sort();

  return (
    <div className='relative'>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className='flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        title='Select system prompt'
      >
        <Settings className='w-4 h-4 text-gray-500 dark:text-gray-400' />
        <span className='text-sm text-gray-700 dark:text-gray-300 max-w-32 truncate'>
          {currentPrompt.name}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className='absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-200 overflow-y-auto'>
          {/* Header */}
          <div className='p-3 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium text-gray-900 dark:text-white'>
                System Prompts
              </h3>
              <button
                onClick={() => setEditingCustom(true)}
                className='p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors'
                title='Create custom prompt'
              >
                <Plus className='w-4 h-4' />
              </button>
            </div>
          </div>

          {/* Custom Prompt Creation */}
          {editingCustom && (
            <div className='p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'>
              <div className='space-y-3'>
                <input
                  type='text'
                  placeholder='Prompt name'
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
                  maxLength={50}
                />
                <input
                  type='text'
                  placeholder='Description (optional)'
                  value={newPromptDescription}
                  onChange={(e) => setNewPromptDescription(e.target.value)}
                  className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
                  maxLength={100}
                />
                <textarea
                  placeholder='System prompt content...'
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none'
                  rows={3}
                  maxLength={500}
                />
                <div className='flex gap-2'>
                  <button
                    onClick={handleCreateCustom}
                    disabled={!newPromptName.trim() || !newPromptContent.trim()}
                    className='flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <Save className='w-3 h-3' />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingCustom(false);
                      setNewPromptName("");
                      setNewPromptDescription("");
                      setNewPromptContent("");
                    }}
                    className='flex items-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600'
                  >
                    <X className='w-3 h-3' />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prompt List */}
          <div className='max-h-100 overflow-y-auto'>
            {categories.map((category) => (
              <div key={category}>
                <div className='px-3 py-2 bg-gray-100 dark:bg-gray-700'>
                  <h4 className='text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                    {category}
                  </h4>
                </div>
                {groupedPrompts[category].map((prompt) => {
                  const IconComponent = prompt.icon;
                  const isSelected = currentPrompt.id === prompt.id;

                  return (
                    <div
                      key={prompt.id}
                      className={`group px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-2 transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-transparent"
                      }`}
                      onClick={() => handlePromptSelect(prompt)}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`flex-shrink-0 p-1 rounded ${
                            isSelected
                              ? "bg-blue-100 dark:bg-blue-800"
                              : "bg-gray-100 dark:bg-gray-600"
                          }`}
                        >
                          {IconComponent &&
                          typeof IconComponent === "function" ? (
                            <IconComponent
                              className={`w-3 h-3 ${
                                isSelected
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            />
                          ) : (
                            <MessageSquare
                              className={`w-3 h-3 ${
                                isSelected
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            />
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between'>
                            <h5
                              className={`text-sm font-medium truncate ${
                                isSelected
                                  ? "text-blue-900 dark:text-blue-100"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {prompt.name}
                              {isSelected && (
                                <Check className='inline ml-1 w-3 h-3 text-blue-600 dark:text-blue-400' />
                              )}
                            </h5>
                            {prompt.isCustom && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustom(prompt.id);
                                }}
                                className='opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity'
                                title='Delete custom prompt'
                              >
                                <X className='w-3 h-3' />
                              </button>
                            )}
                          </div>
                          <p
                            className={`text-xs mt-1 line-clamp-2 ${
                              isSelected
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {prompt.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Current Prompt Preview */}
          <div className='p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'>
            <h4 className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-2'>
              Current Prompt:
            </h4>
            <p className='text-xs text-gray-700 dark:text-gray-300 max-h-50 overflow-y-auto'>
              {currentPrompt.prompt}
            </p>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className='fixed inset-0 z-10' onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
