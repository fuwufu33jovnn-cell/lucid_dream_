import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dictionary lookups go through the LUCID DREAM server route", async () => {
  const client = await readFile(new URL("../app/lib/language-tools.ts", import.meta.url), "utf8");
  let route = "";
  try {
    route = await readFile(new URL("../app/api/dictionary/route.ts", import.meta.url), "utf8");
  } catch {
    route = "";
  }

  assert.match(client, /fetch\(`\/api\/dictionary\?word=/);
  assert.doesNotMatch(client, /api\.dictionaryapi\.dev/);
  assert.match(route, /api\.dictionaryapi\.dev\/api\/v2\/entries\/en/);
  assert.match(route, /normalizeDictionaryResponse/);
});

test("Hear has speech synthesis fallback when dictionary audio is unavailable", async () => {
  const source = await readFile(new URL("../app/components/floating-study-window.tsx", import.meta.url), "utf8");
  assert.match(source, /speechSynthesis/);
  assert.match(source, /SpeechSynthesisUtterance/);
});

test("dictionary route keeps a fast secondary lexical source while Define uses the dedicated bilingual action", async () => {
  const route = await readFile(new URL("../app/api/dictionary/route.ts", import.meta.url), "utf8");
  const source = await readFile(new URL("../app/components/floating-study-window.tsx", import.meta.url), "utf8");
  assert.match(route, /api\.datamuse\.com\/words/);
  assert.match(route, /md=drp/);
  assert.match(source, /capability: "define"/);
  assert.doesNotMatch(source, /Dictionary fallback requested/);
  assert.match(source, /action === "pronounce"[\s\S]*pronounceTarget\(normalized\)/);
  assert.match(source, /async function pronounceTarget[\s\S]*speakText\(normalized, language\)/);
});
