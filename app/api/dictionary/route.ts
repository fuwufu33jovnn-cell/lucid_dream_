import { normalizeDictionaryResponse, normalizeSelection, type DictionaryEntry, type DictionaryMeaning } from "../../lib/language-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATAMUSE = "https://api.datamuse.com/words";
const FREE_DICTIONARY = "https://api.dictionaryapi.dev/api/v2/entries/en";

function normalizeDatamuseResponse(input: unknown, requestedWord: string): DictionaryEntry | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const candidates = input.filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null);
  const first = candidates.find((value) => typeof value.word === "string" && value.word.toLowerCase() === requestedWord.toLowerCase()) ?? candidates[0];
  if (!first || typeof first.word !== "string") return null;

  const defs = Array.isArray(first.defs) ? first.defs.filter((value): value is string => typeof value === "string") : [];
  const meanings: DictionaryMeaning[] = defs.slice(0, 3).map((value) => {
    const tab = value.indexOf("\t");
    const rawPart = tab >= 0 ? value.slice(0, tab) : "word";
    const definition = tab >= 0 ? value.slice(tab + 1) : value;
    const partMap: Record<string, string> = { n: "noun", v: "verb", adj: "adjective", adv: "adverb" };
    return { partOfSpeech: (partMap[rawPart] ?? rawPart) || "word", definition };
  }).filter((value) => Boolean(value.definition.trim()));
  if (meanings.length === 0) return null;

  const tags = Array.isArray(first.tags) ? first.tags.filter((value): value is string => typeof value === "string") : [];
  const pronunciation = tags.find((tag) => tag.startsWith("pron:"))?.slice(5) ?? "";

  return {
    word: first.word,
    phonetic: pronunciation,
    audioUrl: "",
    meanings,
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupDatamuse(word: string): Promise<DictionaryEntry | null> {
  const url = `${DATAMUSE}?sp=${encodeURIComponent(word)}&md=drp&ipa=1&max=1`;
  const response = await fetchWithTimeout(url, 3_500);
  if (!response.ok) throw new Error(`Datamuse failed (${response.status})`);
  return normalizeDatamuseResponse(await response.json(), word);
}

async function lookupFreeDictionary(word: string): Promise<DictionaryEntry | null> {
  const response = await fetchWithTimeout(`${FREE_DICTIONARY}/${encodeURIComponent(word)}`, 3_500);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Free Dictionary failed (${response.status})`);
  return normalizeDictionaryResponse(await response.json());
}

export async function GET(request: Request): Promise<Response> {
  const word = normalizeSelection(new URL(request.url).searchParams.get("word") ?? "");
  if (!word || /\s/.test(word)) {
    return Response.json({ error: "single-word-required" }, { status: 400 });
  }

  let upstreamFailed = false;
  for (const lookup of [lookupDatamuse, lookupFreeDictionary]) {
    try {
      const entry = await lookup(word);
      if (entry) {
        return Response.json(entry, {
          headers: { "cache-control": "public, max-age=300, s-maxage=86400" },
        });
      }
    } catch {
      upstreamFailed = true;
    }
  }

  return Response.json(
    { error: upstreamFailed ? "upstream-failed" : "not-found" },
    { status: upstreamFailed ? 502 : 404 },
  );
}
