import type { VocabularyRecord } from "./models";

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
      context: existing.context || record.context,
    });
  }

  return [...unique.values()];
}
