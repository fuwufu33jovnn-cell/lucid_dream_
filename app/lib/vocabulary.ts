import type { VocabularyRecord } from "./models";
import type { VocabularyCard } from "./ai-contracts";
import type { DictionaryEntry } from "./language-tools";

export function normalizeVocabularyKey(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("en-US");
}

export function vocabularyRecordId(text: string): string {
  return `vocab:${encodeURIComponent(normalizeVocabularyKey(text))}`;
}

export function sameVocabularySelection(a: string, b: string): boolean {
  return normalizeVocabularyKey(a) === normalizeVocabularyKey(b);
}

export function vocabularyExampleUsesSelection(selection: string, example: string): boolean {
  const term = normalizeVocabularyKey(selection);
  if (!term) return false;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapedTerm}(?=$|[^\\p{L}\\p{N}])`, "iu").test(normalizeVocabularyKey(example));
}

export function hasCompleteVocabularyDetails(record: VocabularyRecord): boolean {
  return Boolean(
    record.chineseMeaning?.trim()
    && record.englishDefinition?.trim()
    && record.pronunciation?.trim()
    && record.example?.trim()
    && vocabularyExampleUsesSelection(record.selection, record.example),
  );
}

export function vocabularyUsageExample(record: VocabularyRecord): string | null {
  const example = record.example?.trim() ?? "";
  return vocabularyExampleUsesSelection(record.selection, example) ? example : null;
}

export function recordsNeedingVocabularyDetails(records: VocabularyRecord[], limit = 12): VocabularyRecord[] {
  return records.filter((record) => !hasCompleteVocabularyDetails(record)).slice(0, Math.max(0, limit));
}

export function completeVocabularyRecord(
  record: VocabularyRecord,
  card: VocabularyCard | null,
  dictionary: DictionaryEntry | null,
): VocabularyRecord | null {
  if (!card
    || card.validSelection !== true
    || !sameVocabularySelection(card.selection, record.selection)
    || !vocabularyExampleUsesSelection(record.selection, card.example)) return null;

  const dictionaryMeaning = dictionary?.meanings.find((meaning) => meaning.definition.trim());
  const dictionaryExample = dictionary?.meanings
    .map((meaning) => meaning.example?.trim() ?? "")
    .find((example) => vocabularyExampleUsesSelection(record.selection, example));
  const completed: VocabularyRecord = {
    ...record,
    id: vocabularyRecordId(record.selection),
    normalizedSelection: normalizeVocabularyKey(record.selection),
    pronunciation: dictionary?.phonetic?.trim() || card.pronunciation.trim(),
    audioUrl: dictionary?.audioUrl?.trim() || record.audioUrl || "",
    chineseMeaning: card.chineseMeaning.trim(),
    englishDefinition: dictionaryMeaning?.definition.trim() || card.englishDefinition.trim(),
    example: dictionaryExample || card.example.trim(),
    exampleSource: dictionaryExample ? "dictionary" : "ai",
  };
  return hasCompleteVocabularyDetails(completed) ? completed : null;
}

function savedTime(record: VocabularyRecord): number {
  return Number(record.savedAt ?? record.createdAt ?? 0);
}

export function dedupeVocabularyRecords(records: VocabularyRecord[]): VocabularyRecord[] {
  const ordered = [...records].sort((a, b) => savedTime(b) - savedTime(a));
  const unique = new Map<string, VocabularyRecord>();

  for (const record of ordered) {
    const key = normalizeVocabularyKey(record.selection);
    if (!key) continue;
    const existing = unique.get(key);
    if (!existing) {
      unique.set(key, record);
      continue;
    }
    unique.set(key, {
      ...record,
      ...existing,
      pronunciation: existing.pronunciation || record.pronunciation,
      audioUrl: existing.audioUrl || record.audioUrl,
      chineseMeaning: existing.chineseMeaning || record.chineseMeaning,
      englishDefinition: existing.englishDefinition || record.englishDefinition,
      example: existing.example || record.example,
      exampleSource: existing.exampleSource || record.exampleSource,
      context: existing.context || record.context,
    });
  }

  return [...unique.values()];
}
