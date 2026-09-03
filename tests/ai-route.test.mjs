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
    QWEN_API_KEY: "qwen-secret",
    MISTRAL_API_KEY: "mistral-secret",
    SILICONFLOW_API_KEY: "silicon-secret",
    ARK_API_KEY: "doubao-secret",
    KIMI_API_KEY: "kimi-secret",
    DEEPSEEK_API_KEY: "deepseek-secret",
    GEMINI_API_KEY: "gemini-secret",
    OPENAI_API_KEY: "  ",
  }), ["qwen", "mistral", "siliconflow", "doubao", "deepseek", "kimi", "gemini"]);
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

test("AI gateway skips malformed provider output and tries the next configured provider", async () => {
  const urls = [];
  let deepSeekBody;
  const handler = createAiHandler({
    env: { QWEN_API_KEY: "qwen-test", DEEPSEEK_API_KEY: "deepseek-test" },
    fetch: async (url, init) => {
      urls.push(String(url));
      if (String(url).includes("dashscope.aliyuncs.com")) {
        return Response.json({ choices: [{ message: { content: "not json" } }] });
      }
      deepSeekBody = JSON.parse(String(init?.body ?? "{}"));
      return Response.json({ choices: [{ message: { content: JSON.stringify({ text: "A concise Chinese explanation." }) } }] });
    },
  });

  const response = await handler(explainRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: "A concise Chinese explanation." });
  assert.equal(urls.length, 2);
  assert.match(urls[0], /dashscope\.aliyuncs\.com/);
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


test("AI gateway accepts define, relations, and usage as separate vocabulary actions", async () => {
  for (const capability of ["define", "relations", "usage"]) {
    const handler = createAiHandler({
      env: { GEMINI_API_KEY: "gemini-test" },
      fetch: async () => Response.json({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ text: "ok" }) }] } }],
      }),
    });

    const response = await handler(new Request("https://lucid.example/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        capability,
        selection: "subtle",
        context: "The color shift is subtle but effective.",
      }),
    }));

    assert.equal(response.status, 200, capability);
    assert.deepEqual(await response.json(), { text: "ok" });
  }
});

test("vocabulary cards accept normal grammatical inflection in examples", async () => {
  let calls = 0;
  const card = {
    selection: "make sense",
    validSelection: true,
    suggestedCorrection: null,
    chineseMeaning: "有道理；说得通",
    englishDefinition: "to be understandable or reasonable",
    pronunciation: "/meɪk sens/",
    example: "The ending finally makes sense.",
  };
  const handler = createAiHandler({
    env: { GEMINI_API_KEY: "gemini-test" },
    fetch: async () => {
      calls += 1;
      return Response.json({
        candidates: [{ content: { parts: [{ text: JSON.stringify(card) }] } }],
      });
    },
  });

  const response = await handler(new Request("https://lucid.example/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      capability: "vocabulary-card",
      selection: "make sense",
      context: "The ending finally makes sense.",
      sourceLanguage: "en",
    }),
  }));

  assert.equal(response.status, 200);
  assert.equal(calls, 1);
  assert.deepEqual(await response.json(), card);
});


test("AI gateway uses Qwen as the first configured subtitle-friendly provider", async () => {
  const urls = [];
  const handler = createAiHandler({
    env: {
      QWEN_API_KEY: "qwen-test",
      MISTRAL_API_KEY: "mistral-test",
    },
    fetch: async (url, init) => {
      urls.push(String(url));
      const body = JSON.parse(String(init?.body ?? "{}"));
      assert.equal(body.model, "qwen-plus");
      return Response.json({ choices: [{ message: { content: JSON.stringify({ text: "千问结果" }) } }] });
    },
  });

  const response = await handler(explainRequest());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-lucid-ai-provider"), "qwen");
  assert.match(urls[0], /dashscope\.aliyuncs\.com/);
  assert.deepEqual(await response.json(), { text: "千问结果" });
});

test("every AI capability uses the same complete provider fallback order", async () => {
  const requests = [
    { capability: "daily-plan", minutes: 10, focus: "speaking", evidence: [] },
    { capability: "writing-feedback", prompt: "Write an email.", response: "Hello there.", taskType: "work" },
    { capability: "speaking-feedback", prompt: "Introduce yourself.", transcript: "Hello there.", audioAnalyzed: false },
    { capability: "define", selection: "subtle", context: "The shift is subtle." },
    { capability: "relations", selection: "subtle", context: "The shift is subtle." },
    { capability: "usage", selection: "subtle", context: "The shift is subtle." },
    { capability: "explain", selection: "subtle", context: "The shift is subtle." },
    { capability: "refine", selection: "subtle", context: "The shift is subtle." },
    { capability: "vocabulary-card", selection: "subtle", context: "The shift is subtle.", sourceLanguage: "en" },
    { capability: "translate", selection: "subtle", context: "The shift is subtle.", sourceLanguage: "en", targetLanguage: "zh-CN" },
    { capability: "context-translate", selection: "The shift is subtle.", context: "The shift is subtle.", sourceLanguage: "en", targetLanguage: "zh-CN" },
  ];
  const expectedHosts = [
    "dashscope.aliyuncs.com",
    "api.mistral.ai",
    "api.siliconflow.cn",
    "ark.cn-beijing.volces.com",
    "api.deepseek.com",
    "api.moonshot.cn",
    "generativelanguage.googleapis.com",
    "api.openai.com",
  ];
  const env = {
    QWEN_API_KEY: "qwen-test",
    MISTRAL_API_KEY: "mistral-test",
    SILICONFLOW_API_KEY: "silicon-test",
    ARK_API_KEY: "doubao-test",
    DEEPSEEK_API_KEY: "deepseek-test",
    KIMI_API_KEY: "kimi-test",
    GEMINI_API_KEY: "gemini-test",
    OPENAI_API_KEY: "openai-test",
  };

  for (const [index, body] of requests.entries()) {
    const hosts = [];
    const handler = createAiHandler({
      env,
      fetch: async (url) => {
        hosts.push(new URL(String(url)).host);
        return Response.json({ error: "try next provider" }, { status: 503 });
      },
    });
    const response = await handler(new Request("https://lucid.example/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `192.0.2.${index + 1}` },
      body: JSON.stringify(body),
    }));

    assert.equal(response.status, 502, body.capability);
    assert.deepEqual(hosts, expectedHosts, body.capability);
  }
});

test("SiliconFlow Qwen3 requests disable thinking", async () => {
  let body;
  const handler = createAiHandler({
    env: { SILICONFLOW_API_KEY: "silicon-test", SILICONFLOW_MODEL: "Qwen/Qwen3-8B" },
    fetch: async (_url, init) => {
      body = JSON.parse(String(init?.body ?? "{}"));
      return Response.json({ choices: [{ message: { content: JSON.stringify({ text: "ok" }) } }] });
    },
  });

  const response = await handler(explainRequest());
  assert.equal(response.status, 200);
  assert.equal(body.enable_thinking, false);
});
