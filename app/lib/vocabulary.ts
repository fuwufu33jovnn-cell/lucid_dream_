export type VocabularySourceModule = "language" | "today" | "ielts" | "career";
export type VocabularySourceRef = { module: VocabularySourceModule; context: string };
export type VocabularyFamiliarity = "new" | "learning" | "familiar" | "mastered";
export type LocalVocabularyEntry = {
  id: string; term: string; normalizedTerm: string; definitionEn: string; definitionZh: string;
  learnerNote: string; familiarity: VocabularyFamiliarity; reviewDueAt: string | null;
  reviewIntervalDays: number; sourceRefs: VocabularySourceRef[];
};
export type VocabularySaveInput = { term: string; context: string; sourceModule: VocabularySourceModule };
export type ReviewResult = "again" | "hard" | "good" | "easy";

export const VOCABULARY_STORAGE_KEY = "lucid-vocabulary-v1";

export function normalizeTerm(term: string): string {
  return term.trim().toLocaleLowerCase("en").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

export function mergeVocabularyEntry(existing: LocalVocabularyEntry, incoming: VocabularySaveInput): LocalVocabularyEntry {
  const source = { module: incoming.sourceModule, context: incoming.context.trim().slice(0, 280) };
  const duplicate = existing.sourceRefs.some((item) => item.module === source.module && item.context === source.context);
  return { ...existing, term: existing.term || incoming.term.trim(), sourceRefs: duplicate ? existing.sourceRefs : [...existing.sourceRefs, source] };
}

export function createVocabularyEntry(input: VocabularySaveInput, id: string): LocalVocabularyEntry {
  return { id, term: input.term.trim(), normalizedTerm: normalizeTerm(input.term), definitionEn: "", definitionZh: "", learnerNote: "", familiarity: "new", reviewDueAt: null, reviewIntervalDays: 0, sourceRefs: [{ module: input.sourceModule, context: input.context.trim().slice(0, 280) }] };
}

export function scheduleVocabularyReview(current: Pick<LocalVocabularyEntry,"familiarity"|"reviewIntervalDays"|"reviewDueAt">, result: ReviewResult, today: string) {
  const interval = result === "again" ? 1 : result === "hard" ? Math.max(2,current.reviewIntervalDays) : result === "good" ? Math.max(3,current.reviewIntervalDays * 2) : Math.max(6,current.reviewIntervalDays * 3);
  const familiarity: VocabularyFamiliarity = result === "again" ? "learning" : result === "easy" ? "familiar" : current.familiarity === "new" ? "learning" : current.familiarity;
  const due = new Date(`${today}T00:00:00Z`); due.setUTCDate(due.getUTCDate() + interval);
  return { familiarity, reviewIntervalDays: interval, reviewDueAt: due.toISOString().slice(0,10) };
}

export function readVocabularyLocal(): LocalVocabularyEntry[] {
  if (typeof window === "undefined") return [];
  try { const value = JSON.parse(window.localStorage.getItem(VOCABULARY_STORAGE_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}

export function saveVocabularyLocal(input: VocabularySaveInput): LocalVocabularyEntry[] {
  const normalized = normalizeTerm(input.term); if (!normalized) return readVocabularyLocal();
  const rows = readVocabularyLocal(); const index = rows.findIndex((item) => item.normalizedTerm === normalized);
  if (index >= 0) rows[index] = mergeVocabularyEntry(rows[index], input);
  else rows.unshift(createVocabularyEntry(input, globalThis.crypto?.randomUUID?.() ?? `word-${rows.length + 1}`));
  window.localStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("lucid-vocabulary-updated"));
  return rows;
}

export function writeVocabularyLocal(rows: LocalVocabularyEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("lucid-vocabulary-updated"));
}
