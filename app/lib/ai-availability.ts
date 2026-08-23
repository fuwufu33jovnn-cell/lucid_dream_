export type AiProviderId = "deepseek" | "doubao" | "gemini" | "grok" | "kimi" | "perplexity";
export type AiCapability = "structured-text" | "transcription" | "grounded-search";
export type AiAvailabilityState = "available" | "exhausted" | "unhealthy" | "maintenance" | "disabled" | "not-configured";
export type AiAvailability = { provider: AiProviderId; model: string; label: string; state: AiAvailabilityState; capabilities: AiCapability[]; allowanceLabel: string };

const LABELS: Record<AiProviderId, string> = { deepseek: "DeepSeek", doubao: "Doubao", gemini: "Gemini", grok: "Grok", kimi: "Kimi", perplexity: "Perplexity" };
const IDS = Object.keys(LABELS) as AiProviderId[];

export const defaultAiAvailability: AiAvailability[] = [
  ["deepseek", "deepseek-chat", ["structured-text"]],
  ["doubao", "doubao-lite", ["structured-text"]],
  ["gemini", "gemini-flash", ["structured-text", "transcription"]],
  ["grok", "grok", ["structured-text"]],
  ["kimi", "kimi", ["structured-text"]],
  ["perplexity", "sonar", ["structured-text", "grounded-search"]],
].map(([provider, model, capabilities]) => ({ provider: provider as AiProviderId, model: model as string, label: LABELS[provider as AiProviderId], state: "not-configured", capabilities: capabilities as AiCapability[], allowanceLabel: "Not configured" }));

export function parseAvailabilityResponse(value: unknown): AiAvailability[] {
  if (!value || typeof value !== "object" || !("providers" in value) || !Array.isArray(value.providers)) return defaultAiAvailability;
  return value.providers.flatMap((candidate): AiAvailability[] => {
    if (!candidate || typeof candidate !== "object") return [];
    const row = candidate as Record<string, unknown>;
    if (typeof row.provider !== "string" || !IDS.includes(row.provider as AiProviderId) || typeof row.model !== "string") return [];
    const states: AiAvailabilityState[] = ["available", "exhausted", "unhealthy", "maintenance", "disabled", "not-configured"];
    const state = states.includes(row.state as AiAvailabilityState) ? row.state as AiAvailabilityState : "unhealthy";
    const capabilities = Array.isArray(row.capabilities) ? row.capabilities.filter((item): item is AiCapability => ["structured-text", "transcription", "grounded-search"].includes(String(item))) : [];
    return [{ provider: row.provider as AiProviderId, model: row.model, label: LABELS[row.provider as AiProviderId], state, capabilities, allowanceLabel: typeof row.allowanceLabel === "string" ? row.allowanceLabel : "Configured allowance" }];
  });
}

export function selectAvailableModel(rows: AiAvailability[], provider: AiProviderId, capability: AiCapability): AiAvailability | null {
  return rows.find((row) => row.provider === provider && row.state === "available" && row.capabilities.includes(capability)) ?? null;
}

export function allEligibleProvidersExhausted(rows: AiAvailability[], capability: AiCapability): boolean {
  const eligible = rows.filter((row) => row.capabilities.includes(capability));
  return eligible.length > 0 && eligible.every((row) => row.state === "exhausted");
}

const PROVIDER_ACCOUNT_URLS: Record<AiProviderId, string> = {
  deepseek: "https://platform.deepseek.com/",
  doubao: "https://console.volcengine.com/ark",
  gemini: "https://aistudio.google.com/billing",
  grok: "https://console.x.ai/",
  kimi: "https://platform.moonshot.cn/console/account",
  perplexity: "https://console.perplexity.ai/",
};

export function providerAccountUrl(provider: AiProviderId): string {
  return PROVIDER_ACCOUNT_URLS[provider];
}
