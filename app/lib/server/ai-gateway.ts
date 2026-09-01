import { validateGeneratedPlan, validateSpeakingFeedback, validateVocabularyCardResponse, validateWritingFeedback } from "../ai-contracts.ts";
import { parseGatewayRequest } from "../../../supabase/functions/_shared/ai-contracts.ts";

type GatewayEnv = Record<string, string | undefined>;
type FetchLike = typeof globalThis.fetch;
type Provider = "gemini" | "openai" | "deepseek" | "doubao";

type HandlerDependencies = {
  env: GatewayEnv;
  fetch: FetchLike;
};

const MAX_REQUEST_BYTES = 65_536;
const PROVIDER_TIMEOUT_MS = 12_000;
const TRANSLATE_PROVIDER_TIMEOUT_MS = 7_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export function getConfiguredProviders(env: GatewayEnv): Provider[] {
  const providers: Array<[Provider, string | undefined]> = [
    ["gemini", env.GEMINI_API_KEY],
    ["openai", env.OPENAI_API_KEY],
    ["deepseek", env.DEEPSEEK_API_KEY],
    ["doubao", env.ARK_API_KEY],
  ];
  return providers.filter(([, key]) => Boolean(key?.trim())).map(([provider]) => provider);
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}

function isCrossSiteBrowserRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin !== new URL(request.url).origin;
  } catch {
    return true;
  }
}

function isRateLimited(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-for");
  const clientId = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const current = requestBuckets.get(clientId);

  if (!current || now >= current.resetAt) {
    requestBuckets.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  current.count += 1;
  return false;
}

function schemaFor(capability: string): Record<string, unknown> {
  const stringArray = { type: "array", items: { type: "string" } };
  if (capability === "daily-plan") return {
    type: "object", additionalProperties: false, required: ["tasks"], properties: {
      tasks: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "module", "title", "detail", "minutes", "href", "accent"], properties: {
        id: { type: "string" }, module: { type: "string", enum: ["Speaking", "IELTS", "Career", "Language", "Route"] }, title: { type: "string" }, detail: { type: "string" }, minutes: { type: "number" }, href: { type: "string" }, accent: { type: "string", enum: ["blue", "coral", "sage"] },
      } } },
    },
  };
  if (capability === "writing-feedback") return {
    type: "object", additionalProperties: false, required: ["unofficial", "bandRange", "criteria", "corrections", "revisedSample", "nextActions"], properties: {
      unofficial: { type: "boolean", enum: [true] }, bandRange: { type: ["string", "null"] },
      criteria: { type: "array", items: { type: "object", additionalProperties: false, required: ["heading", "observation"], properties: { heading: { type: "string" }, observation: { type: "string" } } } },
      corrections: { type: "array", items: { type: "object", additionalProperties: false, required: ["original", "revision", "explanation"], properties: { original: { type: "string" }, revision: { type: "string" }, explanation: { type: "string" } } } },
      revisedSample: { type: "string" }, nextActions: stringArray,
    },
  };
  if (capability === "speaking-feedback") return {
    type: "object", additionalProperties: false, required: ["unofficial", "audioAnalyzed", "pronunciation", "observations", "alternatives", "nextAttempt"], properties: {
      unofficial: { type: "boolean", enum: [true] }, audioAnalyzed: { type: "boolean", enum: [false] }, pronunciation: { type: "null" }, observations: stringArray, alternatives: stringArray, nextAttempt: { type: "string" },
    },
  };
  if (capability === "vocabulary-card") return {
    type: "object", additionalProperties: false, required: ["selection", "validSelection", "suggestedCorrection", "chineseMeaning", "englishDefinition", "pronunciation", "example"], properties: {
      selection: { type: "string" },
      validSelection: { type: "boolean" },
      suggestedCorrection: { type: ["string", "null"] },
      chineseMeaning: { type: "string" },
      englishDefinition: { type: "string" },
      pronunciation: { type: "string" },
      example: { type: "string" },
    },
  };
  return { type: "object", additionalProperties: false, required: ["text"], properties: { text: { type: "string" } } };
}

function instructionsFor(capability: string): string {
  if (capability === "daily-plan") return "Create a practical English plan whose task minutes sum exactly to the requested budget. Use only local routes. Keep tasks concrete and concise.";
  if (capability === "writing-feedback") return "Give concise, supportive, unofficial IELTS-style or work-English feedback. Preserve the writer's meaning. Never claim an official score. Prioritize a few teachable corrections.";
  if (capability === "speaking-feedback") return "Review only the transcript for fluency, clarity, vocabulary, and grammar. Audio was not analyzed, so pronunciation must be null and audioAnalyzed false.";
  if (capability === "vocabulary-card") return "Check whether the exact selection is a valid word or phrase in the supplied context, then create one accurate learner card. Always copy the user's selection verbatim into selection. If it looks truncated, accidentally merged, misspelled, or unrelated to the context, set validSelection false, put the likely intended text in suggestedCorrection, and return empty strings for chineseMeaning, englishDefinition, pronunciation, and example. Otherwise set validSelection true and suggestedCorrection null. Never repair, replace, or reinterpret a valid selected item. chineseMeaning must be concise natural Simplified Chinese; englishDefinition must be learner-friendly English; pronunciation must be IPA for English, pinyin for Chinese, Hepburn romanization for Japanese, or Revised Romanization for Korean. example must be one natural complete sentence that contains the exact selection verbatim and uses it in the same sense as the context. Do not return unrelated source text as an example.";
  if (capability === "define") return "Define only the selected word or short phrase in the supplied context. Return exactly two concise lines in text: first line starts 中文： and gives the natural Simplified Chinese meaning; second line starts EN: and gives a learner-friendly English definition. Do not translate or explain the whole context sentence.";
  if (capability === "relations") return "For the selected word or short phrase, give sense-matched synonyms and antonyms for the supplied context. Return exactly two concise lines in text: Syn: followed by 2 to 4 useful synonyms, and Ant: followed by 1 to 3 real antonyms. If there is no natural antonym, write Ant: —. Do not invent loose or unrelated opposites.";
  if (capability === "usage") return "Teach how the selected word or short phrase is actually used. Return concise usage guidance in text with three short lines: Pattern: one common pattern or collocation; Example: one natural complete sentence using the item in the same sense as the context, allowing normal grammatical inflection; Use: one brief register or situation note in Simplified Chinese. Do not rewrite the whole context.";
  if (capability === "translate") return "Translate only the supplied selection, which should be a word or short phrase. The context is reference for choosing the correct sense only; never translate or paraphrase the whole context sentence. Detect the selection language when sourceLanguage is auto. targetLanguage zh-CN means Simplified Chinese, en means English, ja means Japanese, and ko means Korean. Return only the translation in the text field.";
  if (capability === "refine") return "Teach how the selected word or phrase is actually used instead of rewriting it. Give a concise meaning-in-context, one common pattern or collocation, one natural complete example using the item, and a short register or situation note. Normal grammatical inflection is allowed. Return only this usage guidance in the text field.";
  return "Explain the selected English in simpler English using the supplied context.";
}

function extractOpenAiText(payload: Record<string, unknown>): string | null {
  if (typeof payload.output_text === "string") return payload.output_text;
  if (!Array.isArray(payload.output)) return null;
  for (const item of payload.output) {
    if (!item || typeof item !== "object" || !Array.isArray((item as Record<string, unknown>).content)) continue;
    for (const part of (item as Record<string, unknown>).content as unknown[]) {
      if (part && typeof part === "object" && (part as Record<string, unknown>).type === "output_text" && typeof (part as Record<string, unknown>).text === "string") return String((part as Record<string, unknown>).text);
    }
  }
  return null;
}

function extractProviderText(provider: Provider, payload: Record<string, unknown>): string | null {
  if (provider === "openai") return extractOpenAiText(payload);
  if (provider === "deepseek" || provider === "doubao") {
    const choices = payload.choices;
    if (!Array.isArray(choices)) return null;
    const message = choices[0] && typeof choices[0] === "object" ? (choices[0] as Record<string, unknown>).message : null;
    return message && typeof message === "object" && typeof (message as Record<string, unknown>).content === "string" ? String((message as Record<string, unknown>).content) : null;
  }
  const candidates = payload.candidates;
  if (!Array.isArray(candidates)) return null;
  const content = candidates[0] && typeof candidates[0] === "object" ? (candidates[0] as Record<string, unknown>).content : null;
  const parts = content && typeof content === "object" ? (content as Record<string, unknown>).parts : null;
  if (!Array.isArray(parts)) return null;
  return parts.map((part) => part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string" ? String((part as Record<string, unknown>).text) : "").join("") || null;
}

function validTranslationResult(value: unknown, request: Record<string, unknown>): boolean {
  if (typeof value !== "object" || value === null || typeof (value as Record<string, unknown>).text !== "string") return false;
  const text = String((value as Record<string, unknown>).text).trim();
  if (!text) return false;

  const source = String(request.selection ?? "");
  const target = String(request.targetLanguage ?? "");
  const hasHan = (input: string) => /\p{Script=Han}/u.test(input);
  const hasKana = (input: string) => /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(input);
  const hasHangul = (input: string) => /\p{Script=Hangul}/u.test(input);
  const hasLatin = (input: string) => /\p{Script=Latin}/u.test(input);
  const sourceLooksLatin = hasLatin(source) && source.trim().length > 2;
  const sourceLooksCjk = hasHan(source) || hasKana(source) || hasHangul(source);

  if (target === "zh-CN") {
    if (hasKana(text) || hasHangul(text)) return false;
    if ((sourceLooksLatin || hasKana(source) || hasHangul(source)) && !hasHan(text)) return false;
  }
  if (target === "ja" && (sourceLooksLatin || hasHangul(source)) && !(hasKana(text) || hasHan(text))) return false;
  if (target === "ko" && (sourceLooksLatin || hasHan(source) || hasKana(source)) && !hasHangul(text)) return false;
  if (target === "en" && sourceLooksCjk && !hasLatin(text)) return false;
  return true;
}

function validResult(capability: string, value: unknown, request: Record<string, unknown>): boolean {
  if (capability === "daily-plan") return validateGeneratedPlan(value, Number(request.minutes) as 10 | 45 | 90);
  if (capability === "writing-feedback") return validateWritingFeedback(value);
  if (capability === "speaking-feedback") return validateSpeakingFeedback(value);
  if (capability === "vocabulary-card") return validateVocabularyCardResponse(value, String(request.selection));
  if (capability === "translate") return validTranslationResult(value, request);
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).text === "string" && Boolean(String((value as Record<string, unknown>).text).trim());
}

async function fetchWithTimeout(fetcher: FetchLike, url: string, init: RequestInit, timeoutMs = PROVIDER_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function callProvider(provider: Provider, key: string, request: Record<string, unknown>, env: GatewayEnv, fetcher: FetchLike, attempt = 0): Promise<unknown | null> {
  const capability = String(request.capability);
  const schema = schemaFor(capability);
  const instructions = instructionsFor(capability);
  let url: string;
  let init: RequestInit;

  if (provider === "gemini") {
    const model = env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    init = { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, body: JSON.stringify({ systemInstruction: { parts: [{ text: instructions }] }, contents: [{ role: "user", parts: [{ text: JSON.stringify(request) }] }], generationConfig: { thinkingConfig: { thinkingLevel: "minimal" }, responseMimeType: "application/json", responseJsonSchema: schema } }) };
  } else if (provider === "openai") {
    url = "https://api.openai.com/v1/responses";
    init = { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ model: env.OPENAI_TEXT_MODEL ?? "gpt-5.6-luna", reasoning: { effort: "none" }, instructions, input: JSON.stringify(request), text: { format: { type: "json_schema", name: `lucid_${capability.replaceAll("-", "_")}`, strict: true, schema } } }) };
  } else if (provider === "deepseek") {
    url = "https://api.deepseek.com/chat/completions";
    init = { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ model: env.DEEPSEEK_MODEL ?? "deepseek-v4-flash", thinking: { type: "disabled" }, messages: [{ role: "system", content: `${instructions} Return only valid JSON matching this schema: ${JSON.stringify(schema)}` }, { role: "user", content: JSON.stringify(request) }], response_format: { type: "json_object" }, max_tokens: 3_000 }) };
  } else {
    url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
    init = { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ model: env.DOUBAO_MODEL ?? "doubao-seed-2-1-pro-260628", messages: [{ role: "system", content: `${instructions} Return only valid JSON matching this schema: ${JSON.stringify(schema)}` }, { role: "user", content: JSON.stringify(request) }], max_tokens: 3_000 }) };
  }

  try {
    const timeoutMs = capability === "translate" ? TRANSLATE_PROVIDER_TIMEOUT_MS : PROVIDER_TIMEOUT_MS;
    const response = await fetchWithTimeout(fetcher, url, init, timeoutMs);
    if (!response.ok) {
      console.warn("[ai] provider request failed", { provider, capability, status: response.status });
      return null;
    }
    const payload = await response.json() as Record<string, unknown>;
    const text = extractProviderText(provider, payload);
    if (!text) {
      console.warn("[ai] provider returned no usable text", { provider, capability });
      return null;
    }

    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      console.warn("[ai] provider returned invalid JSON", { provider, capability });
      return null;
    }

    if (!validResult(capability, value, request)) {
      console.warn("[ai] provider output failed validation", { provider, capability });
      if (provider === "gemini" && capability === "vocabulary-card" && attempt === 0) {
        console.info("[ai] retrying vocabulary card after validation failure", { provider });
        return callProvider(provider, key, request, env, fetcher, attempt + 1);
      }
      return null;
    }

    console.info("[ai] provider success", { provider, capability });
    return value;
  } catch (error) {
    console.warn("[ai] provider request threw", {
      provider,
      capability,
      error: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

export function createAiHandler({ env, fetch: fetcher }: HandlerDependencies) {
  return async function handleAiRequest(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    if (isCrossSiteBrowserRequest(request)) return json({ error: "Cross-site requests are not allowed." }, 403);
    if (isRateLimited(request)) return json({ error: "Too many AI requests. Try again shortly." }, 429, { "retry-after": "60" });
    if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) return json({ error: "Request too large." }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) return json({ error: "Request too large." }, 413);

    let body: unknown;
    try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON." }, 400); }
    const parsed = parseGatewayRequest(body);
    if (!parsed.ok) return json({ error: parsed.message }, 400);

    const providers: Array<[Provider, string | undefined]> = [
      ["gemini", env.GEMINI_API_KEY],
      ["openai", env.OPENAI_API_KEY],
      ["deepseek", env.DEEPSEEK_API_KEY],
      ["doubao", env.ARK_API_KEY],
    ];
    if (getConfiguredProviders(env).length === 0) return json({ error: "AI is not configured yet." }, 503);

    for (const [provider, key] of providers) {
      if (!key?.trim()) continue;
      const result = await callProvider(provider, key.trim(), parsed.value, env, fetcher);
      if (result !== null) return json(result, 200, { "x-lucid-ai-provider": provider });
    }
    return json({ error: "AI providers are temporarily unavailable." }, 502);
  };
}
