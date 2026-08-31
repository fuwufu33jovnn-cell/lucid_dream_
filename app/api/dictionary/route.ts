import { normalizeDictionaryResponse, normalizeSelection } from "../../lib/language-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://api.dictionaryapi.dev/api/v2/entries/en";

export async function GET(request: Request): Promise<Response> {
  const word = normalizeSelection(new URL(request.url).searchParams.get("word") ?? "");
  if (!word || /\s/.test(word)) {
    return Response.json({ error: "single-word-required" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);

  try {
    const response = await fetch(`${UPSTREAM}/${encodeURIComponent(word)}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (response.status === 404) {
      return Response.json({ error: "not-found" }, { status: 404 });
    }
    if (!response.ok) {
      return Response.json({ error: "upstream-failed" }, { status: 502 });
    }

    const entry = normalizeDictionaryResponse(await response.json());
    if (!entry) {
      return Response.json({ error: "invalid-response" }, { status: 502 });
    }

    return Response.json(entry, {
      headers: { "cache-control": "public, max-age=300, s-maxage=86400" },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return Response.json({ error: timedOut ? "timeout" : "request-failed" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
