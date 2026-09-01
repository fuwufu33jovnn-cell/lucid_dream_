import type { AiRequest } from "./ai-contracts";

export type AiProvider = "gemini" | "openai" | "deepseek" | "doubao";
export type AiStatus = { configured: boolean; providers: AiProvider[] };
export type AiResponse<T> = { ok: true; data: T } | { ok: false; code: "not-connected" | "timeout" | "invalid-response" | "request-failed"; message: string };
export type AiRequestOptions = { timeoutMs?: number; signal?: AbortSignal };

export async function getAiStatus(): Promise<AiStatus> {
  try {
    const response = await fetch("/api/ai", { method: "GET", cache: "no-store" });
    if (!response.ok) return { configured: false, providers: [] };
    const data = await response.json() as Partial<AiStatus>;
    const providers = Array.isArray(data.providers)
      ? data.providers.filter((provider): provider is AiProvider => provider === "gemini" || provider === "openai" || provider === "deepseek" || provider === "doubao")
      : [];
    return { configured: data.configured === true && providers.length > 0, providers };
  } catch {
    return { configured: false, providers: [] };
  }
}

export async function requestAi<T>(request: AiRequest, options: AiRequestOptions = {}): Promise<AiResponse<T>> {
  const controller = new AbortController();
  const abortFromOutside = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", abortFromOutside, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 25_000);
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (response.status === 503) return { ok: false, code: "not-connected", message: "AI NOT CONNECTED" };
    if (response.status === 429) return { ok: false, code: "request-failed", message: "AI is busy for a moment. Try again shortly." };
    if (!response.ok) return { ok: false, code: "request-failed", message: `AI request failed (${response.status}).` };
    const data = await response.json() as T;
    return { ok: true, data };
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? { ok: false, code: "timeout", message: "AI request timed out. Your work is still saved." }
      : { ok: false, code: "request-failed", message: "AI request failed. Your work is still here." };
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromOutside);
  }
}
