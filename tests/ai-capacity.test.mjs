import assert from "node:assert/strict";
import test from "node:test";

import { allEligibleProvidersExhausted, providerAccountUrl } from "../app/lib/ai-availability.ts";

test("capacity dialog appears only when every eligible provider is exhausted", () => {
  const exhausted = [
    { provider: "deepseek", model: "chat", label: "DeepSeek", state: "exhausted", capabilities: ["structured-text"], allowanceLabel: "0 left" },
    { provider: "gemini", model: "flash", label: "Gemini", state: "exhausted", capabilities: ["structured-text", "transcription"], allowanceLabel: "0 left" },
  ];
  assert.equal(allEligibleProvidersExhausted(exhausted, "structured-text"), true);
  assert.equal(allEligibleProvidersExhausted([{ ...exhausted[0], state: "not-configured" }], "structured-text"), false);
  assert.equal(allEligibleProvidersExhausted([{ ...exhausted[0], state: "available" }], "structured-text"), false);
});

test("provider account links use official HTTPS consoles", () => {
  for (const provider of ["deepseek", "doubao", "gemini", "grok", "kimi", "perplexity"]) {
    assert.match(providerAccountUrl(provider), /^https:\/\//);
  }
});
