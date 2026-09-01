import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../app/components/floating-study-window.tsx", import.meta.url);
const cssUrl = new URL("../app/floating-study-window-overrides.css", import.meta.url);

test("Context keeps the two-pane sentence translator while vocabulary Translate stays separate", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /STEP 1 · CONTEXT TRANSLATION/);
  assert.match(source, /aria-label="Context source text"/);
  assert.match(source, /aria-label="Context translation"/);
  assert.match(source, /capability: "context-translate"/);
  assert.match(source, /translateContext/);
  assert.match(source, /translatedText/);
  assert.match(source, />Translate now</);
  assert.match(source, /capability: "translate"/);
  assert.match(source, /Translate is for a word or short phrase/);
});

test("highlighted context text becomes the target without deleting the source", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /onSelect=\{captureTextareaSelection\}/);
  assert.match(source, /setSelection\(chosen\)/);
  assert.match(source, /captureSelectionOnEnter/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /targetInputRef\.current\?\.focus\(\)/);
});

test("vocabulary actions have clear non-overlapping meanings", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /relations:\s*"Syn\/Ant"/);
  assert.match(source, /usage:\s*"Usage"/);
  assert.match(source, /capability:\s*"define"/);
  assert.match(source, /capability,\n\s*selection: normalized/);
  assert.match(source, /Translate is for a word or short phrase/);
  assert.doesNotMatch(source, /explain:\s*"Explain"/);
  assert.doesNotMatch(source, /refine:\s*"Usage"/);
});

test("every action can show the same selected UI state", async () => {
  const source = await readFile(componentUrl, "utf8");
  const css = await readFile(cssUrl, "utf8");
  assert.match(source, /data-active=\{lastAction === action \? "true" : undefined\}/);
  assert.match(source, /aria-pressed=\{lastAction === action\}/);
  assert.doesNotMatch(source, /data-primary/);
  assert.match(css, /button\[data-active="true"\]/);
});

test("define no longer duplicates the dictionary English definition", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /setMessage\("Definition ready\."\)/);
  assert.doesNotMatch(source, /entry\?\.meanings/);
  assert.doesNotMatch(source, /floating-dictionary-result/);
});

test("speech controls cover context, target pronunciation and results", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /speechRate/);
  assert.match(source, /voiceGender/);
  assert.match(source, /Speak context/);
  assert.match(source, /Speak result/);
  assert.match(source, /Female/);
  assert.match(source, /Male/);
});

test("save prepares dictionary and AI vocabulary details in parallel with visible feedback", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /Promise\.all\(\[dictionaryPromise, cardPromise\]\)/);
  assert.match(source, /Building a complete card/);
  assert.match(source, /Saving…/);
});


test("Target shows a clickable spelling correction without silently replacing the word", async () => {
  const source = await readFile(componentUrl, "utf8");
  const css = await readFile(cssUrl, "utf8");
  assert.match(source, /spellingSuggestion/);
  assert.match(source, /你想检索的是不是：/);
  assert.match(source, /Did you mean\?/);
  assert.match(source, /setSelection\(spellingSuggestion\)/);
  assert.match(source, /setTimeout[\s\S]*320/);
  assert.match(css, /floating-spelling-suggestion/);
});
