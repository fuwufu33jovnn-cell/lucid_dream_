import { corsHeaders, parseGatewayRequest } from "../_shared/ai-contracts.ts";

const limiter = new Map<string, { count: number; resetAt: number }>();
function json(body: unknown, status: number, headers: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json" } }); }
function rateLimited(ip: string): boolean { const now = Date.now(); const current = limiter.get(ip); if (!current || current.resetAt <= now) { limiter.set(ip, { count: 1, resetAt: now + 60_000 }); return false; } current.count += 1; return current.count > 20; }

function schemaFor(capability: string): Record<string, unknown> {
  const stringArray = { type: "array", items: { type: "string" } };
  if (capability === "daily-plan") return { type: "object", additionalProperties: false, required: ["tasks"], properties: { tasks: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "module", "title", "detail", "minutes", "href", "accent"], properties: { id: { type: "string" }, module: { type: "string", enum: ["Speaking", "IELTS", "Career", "Language", "Route"] }, title: { type: "string" }, detail: { type: "string" }, minutes: { type: "number" }, href: { type: "string" }, accent: { type: "string", enum: ["blue", "coral", "sage"] } } } } } };
  if (capability === "writing-feedback") return { type: "object", additionalProperties: false, required: ["unofficial", "bandRange", "criteria", "corrections", "revisedSample", "nextActions"], properties: { unofficial: { type: "boolean", enum: [true] }, bandRange: { anyOf: [{ type: "string" }, { type: "null" }] }, criteria: { type: "array", items: { type: "object", additionalProperties: false, required: ["heading", "observation"], properties: { heading: { type: "string" }, observation: { type: "string" } } } }, corrections: { type: "array", items: { type: "object", additionalProperties: false, required: ["original", "revision", "explanation"], properties: { original: { type: "string" }, revision: { type: "string" }, explanation: { type: "string" } } } }, revisedSample: { type: "string" }, nextActions: stringArray } };
  if (capability === "speaking-feedback") return { type: "object", additionalProperties: false, required: ["unofficial", "audioAnalyzed", "pronunciation", "observations", "alternatives", "nextAttempt"], properties: { unofficial: { type: "boolean", enum: [true] }, audioAnalyzed: { type: "boolean", enum: [false] }, pronunciation: { type: "null" }, observations: stringArray, alternatives: stringArray, nextAttempt: { type: "string" } } };
  if (capability === "vocabulary-card") return { type: "object", additionalProperties: false, required: ["selection", "validSelection", "suggestedCorrection", "chineseMeaning", "englishDefinition", "pronunciation", "example"], properties: { selection: { type: "string" }, validSelection: { type: "boolean" }, suggestedCorrection: { anyOf: [{ type: "string" }, { type: "null" }] }, chineseMeaning: { type: "string" }, englishDefinition: { type: "string" }, pronunciation: { type: "string" }, example: { type: "string" } } };
  return { type: "object", additionalProperties: false, required: ["text"], properties: { text: { type: "string" } } };
}

function instructionsFor(capability: string): string {
  if (capability === "daily-plan") return "Create a practical English plan whose task minutes sum exactly to the requested budget. Use only local routes. Keep tasks concrete and concise.";
  if (capability === "writing-feedback") return "Give concise, supportive, unofficial IELTS-style or work-English feedback. Preserve the writer's meaning. Never claim an official score. Prioritize a few teachable corrections.";
  if (capability === "speaking-feedback") return "Review only the transcript for fluency, clarity, vocabulary, and grammar. Audio was not analyzed, so pronunciation must be null and audioAnalyzed false.";
  if (capability === "vocabulary-card") return "Check whether the exact selection is a valid word or phrase in context. Copy it verbatim into selection. If it looks truncated, accidentally merged, misspelled, or unrelated, set validSelection false, put the likely intended text in suggestedCorrection, and return empty detail strings. Otherwise set validSelection true and suggestedCorrection null, then return concise Simplified Chinese meaning, learner-friendly English explanation, useful pronunciation notation, and one natural example sentence containing the exact selection verbatim. Never substitute unrelated source text.";
  if (capability === "translate") return "Translate the selected English into concise natural Chinese using the supplied context.";
  return "Explain the selected English in simpler English using the supplied context.";
}

function extractOutputText(payload: Record<string, unknown>): string | null {
  if (typeof payload.output_text === "string") return payload.output_text;
  if (!Array.isArray(payload.output)) return null;
  for (const item of payload.output) { if (typeof item !== "object" || item === null || !Array.isArray((item as Record<string, unknown>).content)) continue; for (const content of (item as Record<string, unknown>).content as unknown[]) { if (typeof content === "object" && content !== null && (content as Record<string, unknown>).type === "output_text" && typeof (content as Record<string, unknown>).text === "string") return String((content as Record<string, unknown>).text); } }
  return null;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? ""; const cors = corsHeaders(origin);
  if (!cors["Access-Control-Allow-Origin"]) return json({ error: "Origin not allowed." }, 403, cors);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, cors);
  if (Number(request.headers.get("content-length") ?? 0) > 65_536) return json({ error: "Request too large." }, 413, cors);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) return json({ error: "Rate limit exceeded." }, 429, cors);
  const raw = await request.text(); if (new TextEncoder().encode(raw).byteLength > 65_536) return json({ error: "Request too large." }, 413, cors);
  let body: unknown; try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON." }, 400, cors); }
  const parsed = parseGatewayRequest(body); if (!parsed.ok) return json({ error: parsed.message }, 400, cors);
  const apiKey = Deno.env.get("OPENAI_API_KEY"); if (!apiKey) return json({ error: "AI gateway is not configured." }, 503, cors);
  const capability = String(parsed.value.capability); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const provider = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model: Deno.env.get("OPENAI_TEXT_MODEL") ?? "gpt-5.6-luna", instructions: instructionsFor(capability), input: JSON.stringify(parsed.value), text: { format: { type: "json_schema", name: `lucid_${capability.replaceAll("-", "_")}`, strict: true, schema: schemaFor(capability) } } }), signal: controller.signal });
    if (!provider.ok) return json({ error: provider.status === 429 ? "Provider quota exceeded." : "Provider request failed." }, provider.status === 429 ? 429 : 502, cors);
    const output = extractOutputText(await provider.json() as Record<string, unknown>); if (!output) return json({ error: "Provider returned no usable output." }, 502, cors);
    return json(JSON.parse(output), 200, cors);
  } catch (error) { const timedOut = error instanceof DOMException && error.name === "AbortError"; return json({ error: timedOut ? "Provider timeout." : "Provider response failed." }, timedOut ? 504 : 502, cors); }
  finally { clearTimeout(timeout); }
});
