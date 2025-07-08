import { Sliders, Brain, Code, Target, BarChart3 } from "lucide-react";
import { MODEL_PRESETS } from "@/types/ollama";

// Use the balanced preset as the default configuration
export const DEFAULT_OPTIONS = MODEL_PRESETS.balanced;

export const PRESET_INFO = {
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
