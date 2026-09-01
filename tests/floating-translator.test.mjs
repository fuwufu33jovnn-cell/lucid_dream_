import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../app/components/floating-study-window.tsx", import.meta.url);
const cssUrl = new URL("../app/floating-study-window-overrides.css", import.meta.url);

test("context works as a multilingual live translator with Korean", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /sourceLanguage/);
  assert.match(source, /targetLanguage/);
  assert.match(source, /AUTO DETECT/);
  assert.match(source, /한국어/);
  assert.match(source, /translateContext/);
  assert.match(source, /setTimeout\([^)]*translateContext|translateContext\([^)]*auto/s);
  assert.match(source, />Translate now</);
  assert.match(source, /translationTimer/);
  assert.doesNotMatch(source, /disabled=\{!sourceText\.trim\(\) \|\| translationState === "working"\}/);
});

test("highlighted context text becomes the action target", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /onSelect=\{captureTextareaSelection\}/);
  assert.match(source, /setSelection\(chosen\)/);
  assert.match(source, /word or phrase is ready/i);
});

test("speech controls cover context sentences, action results, speed and voice style", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /speechRate/);
  assert.match(source, /voiceGender/);
  assert.match(source, /Female/);
  assert.match(source, /Male/);
  assert.match(source, /0\.7/);
  assert.match(source, /1\.15/);
  assert.match(source, /Speak source text/);
  assert.match(source, /Speak translation/);
  assert.match(source, /Speak result/);
  assert.doesNotMatch(source, /Define and Hear work best with one word/);
});

test("refine is available and the window has explicit and dog-double-click reset", async () => {
  const source = await readFile(componentUrl, "utf8");
  const css = await readFile(cssUrl, "utf8");
  assert.match(source, /"refine"/);
  assert.match(source, /resetWindowSize/);
  assert.match(source, /onDoubleClick=\{resetWindowSize\}/);
  assert.match(source, /Reset window size/);
  assert.match(css, /floating-window-controls/);
});
