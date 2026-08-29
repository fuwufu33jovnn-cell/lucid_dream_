import assert from "node:assert/strict";
import test from "node:test";
import { corsHeaders, parseGatewayRequest } from "../supabase/functions/_shared/ai-contracts.ts";

test("gateway accepts known capabilities and rejects incomplete or oversized work", () => {
  assert.equal(parseGatewayRequest({ capability: "daily-plan", minutes: 45, focus: "speaking", evidence: [] }).ok, true);
  assert.equal(parseGatewayRequest({ capability: "writing-feedback", response: "" }).ok, false);
  assert.equal(parseGatewayRequest({ capability: "speaking-feedback", prompt: "Retell", transcript: "x".repeat(20_001), audioAnalyzed: false }).ok, false);
});

test("gateway exposes narrowly scoped CORS headers", () => {
  assert.deepEqual(corsHeaders("https://fuwufu33jovnn-cell.github.io"), {
    "Access-Control-Allow-Origin": "https://fuwufu33jovnn-cell.github.io",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  });
});
