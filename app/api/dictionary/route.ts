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

function editDistance(a: string, b: string): number {
  const left = a.toLocaleLowerCase("en-US");
  const right = b.toLocaleLowerCase("en-US");
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

async function suggestDatamuseWord(word: string): Promise<string | null> {
  const response = await fetchWithTimeout(`${DATAMUSE}?sl=${encodeURIComponent(word)}&max=8`, 2_500);
  if (!response.ok) return null;
  const payload = await response.json();
  if (!Array.isArray(payload)) return null;
  const candidates = payload
    .filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null && typeof value.word === "string")
    .map((value) => String(value.word).trim())
    .filter((value) => /^[A-Za-z][A-Za-z'-]{2,}$/u.test(value));

  if (candidates.some((candidate) => candidate.toLocaleLowerCase("en-US") === word.toLocaleLowerCase("en-US"))) return null;

  const maxDistance = word.length <= 5 ? 1 : 2;
  return candidates.find((candidate) => editDistance(word, candidate) <= maxDistance) ?? null;
}

async function lookupFreeDictionary(word: string): Promise<DictionaryEntry | null> {
  const response = await fetchWithTimeout(`${FREE_DICTIONARY}/${encodeURIComponent(word)}`, 3_500);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Free Dictionary failed (${response.status})`);
  return normalizeDictionaryResponse(await response.json());
}

export async function GET(request: Request): Promise<Response> {
  const searchParams = new URL(request.url).searchParams;
  const suggestionInput = normalizeSelection(searchParams.get("suggest") ?? "");
  if (suggestionInput) {
    if (!/^[A-Za-z][A-Za-z'-]{2,}$/u.test(suggestionInput)) {
      return Response.json({ error: "single-english-word-required" }, { status: 400 });
    }
    try {
      const suggestion = await suggestDatamuseWord(suggestionInput);
      return suggestion
        ? Response.json({ suggestion }, { headers: { "cache-control": "public, max-age=300, s-maxage=86400" } })
        : Response.json({ error: "not-found" }, { status: 404 });
    } catch {
      return Response.json({ error: "upstream-failed" }, { status: 502 });
    }
  }

  const word = normalizeSelection(searchParams.get("word") ?? "");
  if (!word || /\s/.test(word)) {
    return Response.json({ error: "single-word-required" }, { status: 400 });
  }

  let upstreamFailed = false;
  for (const lookup of [lookupFreeDictionary, lookupDatamuse]) {
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
