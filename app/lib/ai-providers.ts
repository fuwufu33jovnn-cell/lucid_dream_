export const AI_PROVIDER_IDS = [
  "qwen",
  "mistral",
  "siliconflow",
  "doubao",
  "deepseek",
  "kimi",
  "gemini",
  "openai",
] as const;

export type AiProvider = (typeof AI_PROVIDER_IDS)[number];

const AI_PROVIDER_SET = new Set<string>(AI_PROVIDER_IDS);

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === "string" && AI_PROVIDER_SET.has(value);
}
