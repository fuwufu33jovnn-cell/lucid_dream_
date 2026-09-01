export type DictionaryMeaning = { partOfSpeech: string; definition: string; example?: string };
export type DictionaryEntry = { word: string; phonetic: string; audioUrl: string; meanings: DictionaryMeaning[] };
export type DictionarySuggestion = { suggestion: string };

export function normalizeSelection(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 280);
}

export function normalizeDictionaryResponse(input: unknown): DictionaryEntry | null {
  if (!Array.isArray(input) || typeof input[0] !== "object" || input[0] === null) return null;
  const first = input[0] as Record<string, unknown>;
  const word = typeof first.word === "string" ? first.word : "";
  if (!word) return null;
  const phonetics = Array.isArray(first.phonetics) ? first.phonetics : [];
  const meaningsInput = Array.isArray(first.meanings) ? first.meanings : [];
  const meanings: DictionaryMeaning[] = [];
  for (const item of meaningsInput) {
    if (typeof item !== "object" || item === null) continue;
    const meaning = item as Record<string, unknown>;
    const definitions = Array.isArray(meaning.definitions) ? meaning.definitions : [];
    const definitionItem = definitions.find((value) => typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).definition === "string") as Record<string, unknown> | undefined;
    if (!definitionItem) continue;
    meanings.push({
      partOfSpeech: typeof meaning.partOfSpeech === "string" ? meaning.partOfSpeech : "word",
      definition: String(definitionItem.definition),
      example: typeof definitionItem.example === "string" ? definitionItem.example : undefined,
    });
    if (meanings.length === 3) break;
  }
  const phoneticFromList = phonetics.find((value) => typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).text === "string") as Record<string, unknown> | undefined;
  const audioFromList = phonetics.find((value) => typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).audio === "string" && Boolean((value as Record<string, unknown>).audio)) as Record<string, unknown> | undefined;
  return {
    word,
    phonetic: typeof first.phonetic === "string" ? first.phonetic : typeof phoneticFromList?.text === "string" ? phoneticFromList.text : "",
    audioUrl: typeof audioFromList?.audio === "string" ? audioFromList.audio : "",
    meanings,
  };
}

export async function lookupDictionary(selection: string): Promise<DictionaryEntry | null> {
  const word = normalizeSelection(selection);
  if (!word || /\s/.test(word)) return null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Dictionary request failed (${response.status})`);
    const data = await response.json() as Partial<DictionaryEntry>;
    if (typeof data.word !== "string" || !Array.isArray(data.meanings)) return null;
    return {
      word: data.word,
      phonetic: typeof data.phonetic === "string" ? data.phonetic : "",
      audioUrl: typeof data.audioUrl === "string" ? data.audioUrl : "",
      meanings: data.meanings.filter((meaning): meaning is DictionaryMeaning =>
        typeof meaning === "object" && meaning !== null &&
        typeof meaning.partOfSpeech === "string" &&
        typeof meaning.definition === "string"
      ).slice(0, 3).map((meaning) => ({
        ...meaning,
        example: typeof meaning.example === "string" ? meaning.example : undefined,
      })),
    };
  } finally {
    window.clearTimeout(timeout);
  }
}


export async function suggestDictionaryWord(selection: string, signal?: AbortSignal): Promise<string | null> {
  const word = normalizeSelection(selection);
  if (!/^[A-Za-z][A-Za-z'-]{2,}$/u.test(word)) return null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4_200);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(`/api/dictionary?suggest=${encodeURIComponent(word)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 404) return null;
    if (!response.ok) return null;
    const data = await response.json() as Partial<DictionarySuggestion>;
    return typeof data.suggestion === "string" && data.suggestion.trim()
      ? data.suggestion.trim()
      : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
