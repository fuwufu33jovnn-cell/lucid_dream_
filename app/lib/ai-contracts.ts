import type { PlanMode, TodayTask } from "./models";

export type SourceLanguage = "auto" | "en" | "zh-CN" | "ja" | "ko";
export type TargetLanguage = Exclude<SourceLanguage, "auto">;

export type AiRequest =
  | { capability: "daily-plan"; minutes: PlanMode; focus: string; evidence: string[] }
  | { capability: "writing-feedback"; prompt: string; response: string; taskType: "ielts" | "work" | "general" }
  | { capability: "speaking-feedback"; prompt: string; transcript: string; audioAnalyzed: false }
  | { capability: "define"; selection: string; context: string }
  | { capability: "relations"; selection: string; context: string }
  | { capability: "usage"; selection: string; context: string }
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

function vocabularyBoundaryMatch(example: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^$(){}|[\]\\]/g, "\\function normalizedVocabularyText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("en-US");
}

");
  return new RegExp("(^|[^\\p{L}\\p{N}])" + escaped + "(?=$|[^\\p{L}\\p{N}])", "iu").test(example);
}

function englishInflections(word: string): string[] {
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
  const variants = new Set<string>([word, ...(irregular[word] ?? [])]);
  if (/[^aeiou]y$/u.test(word)) variants.add(word.slice(0, -1) + "ies");
  else if (/(s|x|z|ch|sh|o)$/u.test(word)) variants.add(word + "es");
  else variants.add(word + "s");
  if (/ie$/u.test(word)) {
    variants.add(word.slice(0, -2) + "ying");
  } else if (/e$/u.test(word)) {
    variants.add(word + "d");
    variants.add(word.slice(0, -1) + "ing");
  } else if (/[^aeiou]y$/u.test(word)) {
    variants.add(word.slice(0, -1) + "ied");
    variants.add(word + "ing");
  } else {
    variants.add(word + "ed");
    variants.add(word + "ing");
  }
  return [...variants];
}

function containsVocabularyPhrase(example: string, phrase: string): boolean {
  const normalizedExample = normalizedVocabularyText(example);
  const normalizedPhrase = normalizedVocabularyText(phrase);
  if (vocabularyBoundaryMatch(normalizedExample, normalizedPhrase)) return true;
  if (!/^[a-z]+(?:[ '-][a-z]+)*$/iu.test(normalizedPhrase)) return false;
  const parts = normalizedPhrase.split(" ");
  if (!parts[0]) return false;
  return englishInflections(parts[0]).some((variant) =>
    vocabularyBoundaryMatch(normalizedExample, [variant, ...parts.slice(1)].join(" "))
  );
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
