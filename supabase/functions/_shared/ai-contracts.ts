export const ALLOWED_ORIGINS = new Set(["https://fuwufu33jovnn-cell.github.io", "http://localhost:3000", "http://localhost:5173"]);

export function corsHeaders(origin: string): Record<string, string> {
  const headers: Record<string, string> = { "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

type ParseResult = { ok: true; value: Record<string, unknown> } | { ok: false; message: string };
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const sourceLanguages = new Set(["auto", "en", "zh-CN", "ja", "ko"]);
const targetLanguages = new Set(["en", "zh-CN", "ja", "ko"]);

export function parseGatewayRequest(input: unknown): ParseResult {
  if (!object(input) || typeof input.capability !== "string") return { ok: false, message: "Unknown capability." };
  const capability = input.capability;
  if (capability === "daily-plan") {
    if (![10, 45, 90].includes(Number(input.minutes)) || typeof input.focus !== "string" || !Array.isArray(input.evidence) || input.evidence.length > 5) return { ok: false, message: "Invalid daily-plan request." };
  } else if (capability === "writing-feedback") {
    if (typeof input.prompt !== "string" || typeof input.response !== "string" || !input.response.trim() || input.response.length > 12_000 || !["ielts", "work", "general"].includes(String(input.taskType))) return { ok: false, message: "Invalid writing-feedback request." };
  } else if (capability === "speaking-feedback") {
    if (typeof input.prompt !== "string" || typeof input.transcript !== "string" || !input.transcript.trim() || input.transcript.length > 20_000 || input.audioAnalyzed !== false) return { ok: false, message: "Invalid speaking-feedback request." };
  } else if (capability === "explain" || capability === "refine") {
    if (typeof input.selection !== "string" || !input.selection.trim() || input.selection.length > 2_000 || typeof input.context !== "string" || input.context.length > 1_000) return { ok: false, message: `Invalid ${capability} request.` };
  } else if (capability === "translate") {
    if (typeof input.selection !== "string" || !input.selection.trim() || input.selection.length > 8_000 || typeof input.context !== "string" || input.context.length > 1_000) return { ok: false, message: "Invalid translate request." };
    if (input.sourceLanguage !== undefined && !sourceLanguages.has(String(input.sourceLanguage))) return { ok: false, message: "Invalid translate request." };
    if (input.targetLanguage !== undefined && !targetLanguages.has(String(input.targetLanguage))) return { ok: false, message: "Invalid translate request." };
  } else return { ok: false, message: "Unknown capability." };
  return { ok: true, value: input };
}
