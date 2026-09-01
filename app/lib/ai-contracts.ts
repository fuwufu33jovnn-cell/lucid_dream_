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
  selection: string;
  validSelection: boolean;
  suggestedCorrection: string | null;
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

function normalizedVocabularyText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("en-US");
}

function containsVocabularyPhrase(example: string, phrase: string): boolean {
  const normalizedExample = normalizedVocabularyText(example);
  const normalizedPhrase = normalizedVocabularyText(phrase);
  if (!normalizedPhrase) return false;

  const contains = (candidate: string) => {
    const escaped = candidate.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^\\p{L}\\p{N}])" + escaped + "(?=$|[^\\p{L}\\p{N}])", "iu").test(normalizedExample);
  };
  if (contains(normalizedPhrase)) return true;

  const words = normalizedPhrase.split(" ");
  if (!/^[a-z][a-z'-]*$/u.test(words[0] ?? "")) return false;

  const irregular: Record<string, string[]> = {
    be: ["am", "is", "are", "was", "were", "been", "being"],
    come: ["comes", "came", "coming"],
    do: ["does", "did", "done", "doing"],
    feel: ["feels", "felt", "feeling"],
    find: ["finds", "found", "finding"],
    get: ["gets", "got", "gotten", "getting"],
    go: ["goes", "went", "gone", "going"],
    have: ["has", "had", "having"],
    know: ["knows", "knew", "known", "knowing"],
    make: ["makes", "made", "making"],
    run: ["runs", "ran", "running"],
    say: ["says", "said", "saying"],
    see: ["sees", "saw", "seen", "seeing"],
    speak: ["speaks", "spoke", "spoken", "speaking"],
    take: ["takes", "took", "taken", "taking"],
    think: ["thinks", "thought", "thinking"],
    write: ["writes", "wrote", "written", "writing"],
  };

  const base = words[0];
  const regular = new Set<string>();
  if (base.endsWith("y") && base.length > 1 && !/[aeiou]y$/u.test(base)) {
    regular.add(base.slice(0, -1) + "ies");
    regular.add(base.slice(0, -1) + "ied");
  } else {
    regular.add(/[sxz]$|(?:ch|sh)$/u.test(base) ? base + "es" : base + "s");
    regular.add(base.endsWith("e") ? base + "d" : base + "ed");
  }
  regular.add(base.endsWith("ie")
    ? base.slice(0, -2) + "ying"
    : base.endsWith("e") && !base.endsWith("ee")
      ? base.slice(0, -1) + "ing"
      : base + "ing");

  const variants = new Set([...(irregular[base] ?? []), ...regular]);
  for (const variant of variants) {
    if (contains([variant, ...words.slice(1)].join(" "))) return true;
  }
  return false;
}

export function validateVocabularyCard(value: unknown, requestedSelection?: string): value is VocabularyCard {
  if (!object(value)
    || typeof value.selection !== "string"
    || value.validSelection !== true
    || (typeof value.suggestedCorrection !== "string" && value.suggestedCorrection !== null)
    || typeof value.chineseMeaning !== "string"
    || typeof value.englishDefinition !== "string"
    || typeof value.pronunciation !== "string"
    || typeof value.example !== "string"
    || !value.chineseMeaning.trim()
    || !value.englishDefinition.trim()
    || !value.pronunciation.trim()
    || !value.example.trim()) return false;

  const selection = normalizedVocabularyText(value.selection);
  if (!selection || (requestedSelection && selection !== normalizedVocabularyText(requestedSelection))) return false;
  return containsVocabularyPhrase(value.example, selection);
}

export function validateVocabularyCardResponse(value: unknown, requestedSelection: string): value is VocabularyCard {
  if (!object(value)
    || typeof value.selection !== "string"
    || typeof value.validSelection !== "boolean"
    || (typeof value.suggestedCorrection !== "string" && value.suggestedCorrection !== null)
    || typeof value.chineseMeaning !== "string"
    || typeof value.englishDefinition !== "string"
    || typeof value.pronunciation !== "string"
    || typeof value.example !== "string"
    || normalizedVocabularyText(value.selection) !== normalizedVocabularyText(requestedSelection)) return false;
  if (value.validSelection) return validateVocabularyCard(value, requestedSelection);
  return Boolean(value.suggestedCorrection?.trim())
    && !value.chineseMeaning.trim()
    && !value.englishDefinition.trim()
    && !value.pronunciation.trim()
    && !value.example.trim();
}
