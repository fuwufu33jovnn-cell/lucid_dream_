import assert from "node:assert/strict";
import test from "node:test";
import { createAiHandler, getConfiguredProviders } from "../app/lib/server/ai-gateway.ts";

const explainRequest = () => new Request("https://lucid.example/api/ai", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ capability: "explain", selection: "visual rhythm", context: "The layout has visual rhythm." }),
});

test("AI gateway status reports configured providers without exposing keys", () => {
  assert.deepEqual(getConfiguredProviders({
    GEMINI_API_KEY: "gemini-secret",
    OPENAI_API_KEY: "  ",
    DEEPSEEK_API_KEY: "deepseek-secret",
    ARK_API_KEY: "doubao-secret",
  }), ["gemini", "deepseek", "doubao"]);
});

test("AI gateway rejects malformed capability payloads before calling a provider", async () => {
  let providerCalls = 0;
  const handler = createAiHandler({
    env: { GEMINI_API_KEY: "gemini-test" },
    fetch: async () => { providerCalls += 1; return new Response("{}"); },
  });

  const response = await handler(new Request("https://lucid.example/api/ai", {
    method: "POST",
    body: JSON.stringify({ capability: "explain", selection: "" }),
  }));

  assert.equal(response.status, 400);
  assert.equal(providerCalls, 0);
});

test("AI gateway reports a missing server configuration without exposing secret names", async () => {
  const handler = createAiHandler({ env: {}, fetch: globalThis.fetch });
  const response = await handler(explainRequest());
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.deepEqual(body, { error: "AI is not configured yet." });
});

test("AI gateway falls back from Gemini to OpenAI and returns validated JSON", async () => {
  const urls = [];
  let openAiBody;
  const handler = createAiHandler({
    env: { GEMINI_API_KEY: "gemini-test", OPENAI_API_KEY: "openai-test" },
    fetch: async (url, init) => {
      urls.push(String(url));
      if (String(url).includes("generativelanguage.googleapis.com")) {
        return Response.json({ error: { message: "temporary" } }, { status: 503 });
      }
      openAiBody = JSON.parse(String(init?.body ?? "{}"));
      return Response.json({ output_text: JSON.stringify({ text: "A repeated visual pattern that guides the eye." }) });
    },
  });

  const response = await handler(explainRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: "A repeated visual pattern that guides the eye." });
  assert.equal(urls.length, 2);
  assert.match(urls[0], /generativelanguage\.googleapis\.com/);
  assert.match(urls[1], /api\.openai\.com\/v1\/responses/);
  assert.equal(openAiBody.model, "gpt-5.6-luna");
  assert.deepEqual(openAiBody.reasoning, { effort: "none" });
});

test("AI gateway retries Gemini once when a vocabulary card fails validation", async () => {
  let calls = 0;
  const validCard = {
    selection: "foodie",
    validSelection: true,
    suggestedCorrection: null,
    chineseMeaning: "美食爱好者；吃货",
    englishDefinition: "a person who is very interested in food",
    pronunciation: "/ˈfuːdi/",
    example: "As a foodie, she keeps a list of neighborhood restaurants.",
  };
  const handler = createAiHandler({
    env: { GEMINI_API_KEY: "gemini-test" },
    fetch: async () => {
      calls += 1;
      const card = calls === 1 ? { ...validCard, example: "This sentence misses the selected term." } : validCard;
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(card) }] } }] });
    },
  });

  const response = await handler(new Request("https://lucid.example/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      capability: "vocabulary-card",
      selection: "foodie",
      context: "She is a foodie who loves trying regional dishes.",
      sourceLanguage: "en",
    }),
  }));

  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(await response.json(), validCard);
});

test("AI gateway skips malformed provider output and tries DeepSeek", async () => {
  const urls = [];
  let deepSeekBody;
  const handler = createAiHandler({
    env: { GEMINI_API_KEY: "gemini-test", DEEPSEEK_API_KEY: "deepseek-test" },
    fetch: async (url, init) => {
      urls.push(String(url));
      if (String(url).includes("googleapis.com")) {
        return Response.json({ candidates: [{ content: { parts: [{ text: "not json" }] } }] });
      }
      deepSeekBody = JSON.parse(String(init?.body ?? "{}"));
      return Response.json({ choices: [{ message: { content: JSON.stringify({ text: "A concise Chinese explanation." }) } }] });
    },
  });

  const response = await handler(explainRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: "A concise Chinese explanation." });
  assert.equal(urls.length, 2);
  assert.match(urls[1], /api\.deepseek\.com\/chat\/completions/);
  assert.deepEqual(deepSeekBody.thinking, { type: "disabled" });
});

test("AI gateway blocks cross-site browser posts before provider calls", async () => {
  let providerCalls = 0;
  const handler = createAiHandler({
    env: { GEMINI_API_KEY: "gemini-test" },
    fetch: async () => { providerCalls += 1; return new Response("{}"); },
  });

  const response = await handler(new Request("https://lucid.example/api/ai", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({ capability: "explain", selection: "visual rhythm", context: "The layout has visual rhythm." }),
  }));

  assert.equal(response.status, 403);
  assert.equal(providerCalls, 0);
});


test("AI gateway can call Doubao through Volcano Ark", async () => {
  let body;
  const handler = createAiHandler({
    env: { ARK_API_KEY: "ark-test", DOUBAO_MODEL: "doubao-seed-2-1-pro-260628" },
    fetch: async (url, init) => {
      assert.match(String(url), /ark\.cn-beijing\.volces\.com\/api\/v3\/chat\/completions/);
      body = JSON.parse(String(init?.body ?? "{}"));
      return Response.json({ choices: [{ message: { content: JSON.stringify({ text: "豆包结果" }) } }] });
    },
  });

  const response = await handler(explainRequest());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-lucid-ai-provider"), "doubao");
  assert.equal(body.model, "doubao-seed-2-1-pro-260628");
  assert.deepEqual(await response.json(), { text: "豆包结果" });
});
