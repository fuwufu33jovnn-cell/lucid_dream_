import assert from "node:assert/strict";
import test from "node:test";
import { validateVocabularyCard } from "../app/lib/ai-contracts.ts";
import { corsHeaders, parseGatewayRequest } from "../supabase/functions/_shared/ai-contracts.ts";

test("gateway accepts known capabilities and rejects incomplete or oversized work", () => {
  assert.equal(parseGatewayRequest({ capability: "daily-plan", minutes: 45, focus: "speaking", evidence: [] }).ok, true);
  assert.equal(parseGatewayRequest({ capability: "writing-feedback", response: "" }).ok, false);
  assert.equal(parseGatewayRequest({ capability: "speaking-feedback", prompt: "Retell", transcript: "x".repeat(20_001), audioAnalyzed: false }).ok, false);
});

test("gateway accepts multilingual context translation and refine requests", () => {
  assert.equal(parseGatewayRequest({
    capability: "translate",
    selection: "오늘 날씨가 좋아요.",
    context: "Floating context translator",
    sourceLanguage: "ko",
    targetLanguage: "zh-CN",
  }).ok, true);
  assert.equal(parseGatewayRequest({
    capability: "translate",
    selection: "hello",
    context: "Floating context translator",
    sourceLanguage: "xx",
    targetLanguage: "zh-CN",
  }).ok, false);
  assert.equal(parseGatewayRequest({
    capability: "refine",
    selection: "i am so blinded by you.",
    context: "Make this natural while preserving its meaning.",
  }).ok, true);
});

test("gateway accepts structured vocabulary-card requests", () => {
  assert.equal(parseGatewayRequest({
    capability: "vocabulary-card",
    selection: "make sense",
    context: "The ending finally makes sense.",
    sourceLanguage: "en",
  }).ok, true);
  assert.equal(parseGatewayRequest({
    capability: "vocabulary-card",
    selection: "make sense",
    context: "The ending finally makes sense.",
    sourceLanguage: "xx",
  }).ok, false);
});

test("vocabulary cards must echo the selected term and use it in the example", () => {
  const valid = {
    selection: "foodie",
    validSelection: true,
    suggestedCorrection: null,
    chineseMeaning: "美食爱好者；吃货",
    englishDefinition: "a person with a strong interest in food",
    pronunciation: "/ˈfuːdi/",
    example: "As a foodie, she searches for regional dishes.",
  };
  assert.equal(validateVocabularyCard(valid, "foodie"), true);
  assert.equal(validateVocabularyCard({ ...valid, selection: "food" }, "foodie"), false);
  assert.equal(validateVocabularyCard({ ...valid, example: "I am so blinded by you." }, "foodie"), false);
  assert.equal(validateVocabularyCard({ ...valid, validSelection: false }, "foodie"), false);
});

test("the gateway may return an invalid-selection diagnosis without inventing a word card", async () => {
  const contracts = await import("../app/lib/ai-contracts.ts");
  assert.equal(typeof contracts.validateVocabularyCardResponse, "function");
  const diagnosis = {
    selection: "sint",
    validSelection: false,
    suggestedCorrection: "this output",
    chineseMeaning: "",
    englishDefinition: "",
    pronunciation: "",
    example: "",
  };
  assert.equal(contracts.validateVocabularyCardResponse(diagnosis, "sint"), true);
  assert.equal(validateVocabularyCard(diagnosis, "sint"), false);
  assert.equal(contracts.validateVocabularyCardResponse({ ...diagnosis, selection: "sin" }, "sint"), false);
});

test("gateway exposes narrowly scoped CORS headers", () => {
  assert.deepEqual(corsHeaders("https://fuwufu33jovnn-cell.github.io"), {
    "Access-Control-Allow-Origin": "https://fuwufu33jovnn-cell.github.io",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  });
});
