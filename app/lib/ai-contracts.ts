import type { PlanMode, TodayTask } from "./models";

export type SourceLanguage = "auto" | "en" | "zh-CN" | "ja" | "ko";
export type TargetLanguage = Exclude<SourceLanguage, "auto">;

export type AiRequest =
  | { capability: "daily-plan"; minutes: PlanMode; focus: string; evidence: string[] }
  | { capability: "writing-feedback"; prompt: string; response: string; taskType: "ielts" | "work" | "general" }
  | { capability: "speaking-feedback"; prompt: string; transcript: string; audioAnalyzed: false }
  | { capability: "explain"; selection: string; context: string }
  | { capability: "refine"; selection: string; context: string }
  | { capability: "vocabulary-card"; selection: string; context: string; sourceLanguage?: SourceLanguage }
  | { capability: "translate"; selection: string; context: string; sourceLanguage?: SourceLanguage; targetLanguage?: TargetLanguage };

export type GeneratedPlan = { tasks: TodayTask[] };
export type WritingFeedback = {
  unofficial: true;
  bandRange: string | null;
  criteria: Array<{ heading: string; observation: string }>;
  corrections: Array<{ original: string; revision: string; explanation: string }>;
  revisedSample?: string;
  nextActions: string[];
};
export type VocabularyCard = {
  chineseMeaning: string;
  englishDefinition: string;
  pronunciation: string;
  example: string;
};

export type SpeakingFeedback = {
  unofficial: true;
  audioAnalyzed: boolean;
  pronunciation: string | null;
  observations: string[];
  alternatives: string[];
  nextAttempt: string;
};

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateGeneratedPlan(value: unknown, minutes: PlanMode): value is GeneratedPlan {
  if (!object(value) || !Array.isArray(value.tasks) || value.tasks.length === 0) return false;
  let total = 0;
  for (const task of value.tasks) {
    if (!object(task) || typeof task.id !== "string" || typeof task.module !== "string" || typeof task.title !== "string" || typeof task.detail !== "string" || typeof task.minutes !== "number" || typeof task.href !== "string" || !task.href.startsWith("/") || !["blue", "coral", "sage"].includes(String(task.accent))) return false;
    total += task.minutes;
  }
  return total === minutes;
}

export function validateWritingFeedback(value: unknown): value is WritingFeedback {
  return object(value) && value.unofficial === true && (typeof value.bandRange === "string" || value.bandRange === null) && Array.isArray(value.criteria) && Array.isArray(value.corrections) && Array.isArray(value.nextActions);
}

export function validateSpeakingFeedback(value: unknown): value is SpeakingFeedback {
  return object(value) && value.unofficial === true && typeof value.audioAnalyzed === "boolean" && (typeof value.pronunciation === "string" || value.pronunciation === null) && Array.isArray(value.observations) && Array.isArray(value.alternatives) && typeof value.nextAttempt === "string" && (value.audioAnalyzed || value.pronunciation === null);
}

export function validateVocabularyCard(value: unknown): value is VocabularyCard {
  return object(value)
    && typeof value.chineseMeaning === "string"
    && typeof value.englishDefinition === "string"
    && typeof value.pronunciation === "string"
    && typeof value.example === "string"
    && Boolean(value.chineseMeaning.trim())
    && Boolean(value.englishDefinition.trim())
    && Boolean(value.example.trim());
}
