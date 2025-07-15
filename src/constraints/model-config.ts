/**
 * Model Configuration Constraints
 *
 * This file contains UI-specific constraints and metadata for model configuration:
 * - Default preset selection
 * - Preset display information (icons, descriptions, colors)
 * - UI-related model configuration constants
 *
 * Note: The actual preset configurations are defined in @/types/ollama.ts
 */

import { Sliders, Brain, Code, Target, BarChart3 } from "lucide-react";
import { MODEL_PRESETS, type ModelPreset } from "@/types/ollama";

// Types for preset UI metadata
export interface PresetInfo {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  color: string;
}

// Default preset configuration
export const DEFAULT_PRESET: ModelPreset = "balanced";

// Use the balanced preset as the default configuration
export const DEFAULT_OPTIONS = MODEL_PRESETS[DEFAULT_PRESET];

/**
 * UI metadata for model presets
 * Contains display information for each preset including icons, descriptions, and colors
 */
export const PRESET_INFO: Record<ModelPreset, PresetInfo> = {
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
