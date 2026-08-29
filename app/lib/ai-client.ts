import type { AiRequest } from "./ai-contracts";

export type AiResponse<T> = { ok: true; data: T } | { ok: false; code: "not-connected" | "timeout" | "invalid-response" | "request-failed"; message: string };

export async function requestAi<T>(request: AiRequest): Promise<AiResponse<T>> {
  const gatewayUrl = process.env.NEXT_PUBLIC_AI_GATEWAY_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!gatewayUrl || !anonKey) return { ok: false, code: "not-connected", message: "AI NOT CONNECTED" };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: anonKey, authorization: `Bearer ${anonKey}` },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, code: "request-failed", message: `AI request failed (${response.status}).` };
    const data = await response.json() as T;
    return { ok: true, data };
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? { ok: false, code: "timeout", message: "AI request timed out. Your work is still saved." }
      : { ok: false, code: "request-failed", message: "AI request failed. Your work is still here." };
  } finally {
    window.clearTimeout(timeout);
  }
}
