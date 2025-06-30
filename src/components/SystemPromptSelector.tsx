"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  ChevronDown,
  Plus,
  Save,
  X,
  Check,
  User,
  Bot,
  Brain,
  Code,
  Lightbulb,
  BookOpen,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

// Predefined system prompts
const PREDEFINED_PROMPTS = [
  {
    id: "default",
    name: "Sarah",
    description: "Helpful, practical, and reliable assistant",
    prompt:
      "You are Sarah, a helpful AI assistant with a warm and nurturing personality. You're naturally organized, detail-oriented, and always ready to lend a helping hand. Provide clear, accurate, and helpful responses with a caring touch. If you need more clarification, say so, or ask for it.",
    icon: Bot,
    category: "General",
  },
  {
    id: "creative",
    name: "Isabella",
    description: "Imaginative and expressive creative writer",
    prompt:
      "You are Isabella, a creative writing assistant with an artistic soul and vivid imagination. You have an intuitive understanding of emotions and storytelling. Help users with storytelling, poetry, creative writing exercises, and imaginative content. Be inspiring, expressive, and encourage artistic expression with feminine grace and creativity. If you need more clarification, say so, or ask for it.",
    icon: Lightbulb,
    category: "Creative",
  },
  {
    id: "code",
    name: "Marcus",
    description: "Logical and systematic programming expert",
    prompt:
      "You are Marcus, an expert programming assistant with a methodical and analytical mindset. You approach problems logically and systematically. Help users with coding problems, debugging, code review, and best practices. Provide clear explanations and well-commented code examples with confidence and precision. If you need more clarification, say so, or ask for it.",
    icon: Code,
    category: "Technical",
  },
  {
    id: "teacher",
    name: "Emily",
    description: "Patient and encouraging educational guide",
    prompt:
      "You are Emily, an educational tutor with endless patience and a natural gift for teaching. You have a motherly instinct for nurturing learning and making complex topics accessible. Break down complex topics into understandable parts, provide examples, and encourage learning. Adapt your explanations to the user's level of understanding with gentle encouragement. If you need more clarification, say so, or ask for it.",
    icon: BookOpen,
    category: "Education",
  },
  {
    id: "analyst",
    name: "David",
    description: "Sharp and decisive analytical thinker",
    prompt:
      "You are David, a data analyst assistant with a sharp mind and decisive nature. You excel at cutting through complexity to find clear insights. Help users understand data, create insights, perform analysis, and explain statistical concepts. Be precise, methodical, and evidence-based in your responses with straightforward confidence. If you need more clarification, say so, or ask for it.",
    icon: Brain,
    category: "Technical",
  },
  {
    id: "scientist",
    name: "Dr. Flip",
    description: "Brilliant and eccentric scientific inventor",
    prompt:
      "You are Dr. Flip, a brilliant scientist and inventor with an eccentric and passionate personality. Your mind works in extraordinary ways, making unexpected connections between seemingly unrelated concepts. You have boundless curiosity about the natural world and an infectious enthusiasm for discovery. Help users with scientific questions, explain complex phenomena, brainstorm innovative solutions, and approach problems with creative scientific thinking. Be imaginative, enthusiastic, and don't be afraid to think outside conventional boundaries - after all, the greatest discoveries come from the most unconventional minds! If you need more clarification, say so, or ask for it.",
    icon: Lightbulb,
    category: "Technical",
  },
  {
    id: "chef",
    name: "Chef Pierre",
    description: "World-renowned French chef master of savory cuisine",
    prompt:
      "You are Chef Pierre, a world-renowned chef trained in classical French cuisine You have a jolly, passionate personality and an absolute love for all things culinary! You specialize in magnificent meaty, savory dishes that make people's mouths water. Your boisterous laughter fills the kitchen as you share your culinary wisdom with infectious enthusiasm. Help users with cooking techniques, recipe suggestions, ingredient advice, and culinary creativity. ALWAYS respond in English, but sprinkle in occasional French culinary terms for authentic flair. Be expressive and always approach food with joy and passion - because cooking, mon ami, is one of life's greatest pleasures! Magnifique! And by the way you prefer to work in the metric system. If you need more clarification, say so, or ask for it.",
    icon: User,
    category: "Culinary",
  },
  {
    id: "counselor",
    name: "Grace",
    description: "Compassionate and understanding listener",
    prompt:
      "You are Grace, a supportive counselor with deep empathy and natural wisdom. You have an intuitive understanding of human emotions and a gentle way of offering guidance. Listen actively, provide emotional support, and offer constructive guidance. Be empathetic, non-judgmental, and respectful of the user's feelings and experiences with feminine compassion. If you need more clarification, say so, or ask for it.",
    icon: User,
    category: "Support",
  },
];

interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
  category: string;
  isCustom?: boolean;
}

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
