import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: {
        accept: "text/html",
        "oai-authenticated-user-email": "learner@example.com",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders the LUCID DREAM product shell", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("shell", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: {
        accept: "text/html",
        "oai-authenticated-user-email": "learner@example.com",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /LUCID DREAM/);
  assert.match(html, /Today/);
  assert.match(html, /IELTS Exam/);
  assert.match(html, /Life Abroad/);
  assert.match(html, /ISSUE 08/);
  assert.match(html, /NIGHT<br\/>RADIO/);
  assert.match(html, /TODAY'S PRACTICE/);
  assert.match(html, /OPEN PRACTICE/);
  assert.ok(html.indexOf("TODAY&#x27;S PRACTICE") < html.indexOf("NIGHT<br/>RADIO"));
  assert.doesNotMatch(html, />Dreamer</);
  assert.doesNotMatch(html, /Starter Project/);
});

test("serves the public homepage without an authenticated-user header", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("public", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
      redirect: "manual",
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(await response.text(), /LUCID DREAM/);
});

test("renders the five-mode Language Lab index", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("lab", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/language-lab/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const mode of ["WATCH", "LISTEN", "READ", "CULTURE", "RANDOM"]) {
    assert.match(html, new RegExp(`>${mode}<`));
  }
  assert.match(html, /MARGINALIA/);
  assert.match(html, />MOVIE</);
  assert.match(html, />MUSIC</);
  assert.match(html, /OPEN OFFICIAL SOURCE/);
  assert.match(html, /PASTE YOUTUBE OR SPOTIFY LINK/);
  assert.match(html, /YOUR MEDIA SHELF/);
  assert.match(html, /RECENT 7 DAYS/);
  assert.match(html, /FLOATING STUDY WINDOW/);
  assert.match(html, /ENGLISH.*中文.*BILINGUAL/s);
  assert.match(html, /MOVE · RESIZE/);
  assert.match(html, /data-language-tools-root/);
});

test("replaces placeholder routes with an Archive and concrete editorial previews", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("phase2", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  const archive = await worker.fetch(new Request("http://localhost/progress/", { headers: { accept: "text/html" } }), env, ctx);
  const archiveHtml = await archive.text();
  assert.match(archiveHtml, /THE ARCHIVE/);
  assert.doesNotMatch(archiveHtml, /PHASE 2/);

  const route = await worker.fetch(new Request("http://localhost/route-map/", { headers: { accept: "text/html" } }), env, ctx);
  assert.match(await route.text(), /THREE ROUTES, ONE DECISION/);

  const life = await worker.fetch(new Request("http://localhost/life-abroad/", { headers: { accept: "text/html" } }), env, ctx);
  assert.match(await life.text(), /PRACTICAL ENGLISH FOR REAL LIFE/);
});

test("renders honest writing and speaking studios before AI is configured", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("practice", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const writing = await worker.fetch(new Request("http://localhost/practice/writing/", { headers: { accept: "text/html" } }), env, ctx);
  const writingHtml = await writing.text();
  assert.match(writingHtml, /WRITING<br\/>STUDIO/);
  assert.match(writingHtml, /AI NOT CONNECTED/);
  const speaking = await worker.fetch(new Request("http://localhost/practice/speaking/", { headers: { accept: "text/html" } }), env, ctx);
  const speakingHtml = await speaking.text();
  assert.match(speakingHtml, /SPEAKING<br\/>STUDIO/);
  assert.doesNotMatch(speakingHtml, /pronunciation score/i);
});

test("offers calm Practice and strict Mock exam modes", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("exam-modes", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/ielts/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const html = await response.text();
  assert.match(html, /PRACTICE MODE/);
  assert.match(html, /MOCK MODE/);
  assert.match(html, /Pause whenever you need/);
});
