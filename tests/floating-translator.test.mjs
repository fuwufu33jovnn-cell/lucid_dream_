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

test("pressing Enter on a highlighted word keeps the source sentence intact and moves focus to Target", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /captureSelectionOnEnter/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /targetInputRef\.current\?\.focus\(\)/);
  assert.match(source, /onKeyDown=\{captureSelectionOnEnter\}/);
});

test("translation requests are cancellable, cached and use a shorter interactive timeout", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /translationAbort/);
  assert.match(source, /translationCache/);
  assert.match(source, /timeoutMs:\s*9_000/);
  assert.match(source, /}, 450\);/);
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

test("usage guidance replaces rewrite-style Refine and reset controls stay horizontal", async () => {
  const source = await readFile(componentUrl, "utf8");
  const css = await readFile(cssUrl, "utf8");
  assert.match(source, /refine:\s*"Usage"/);
  assert.match(source, /Show real usage, patterns, and a natural example/);
  assert.match(source, /resetWindowSize/);
  assert.match(source, /onDoubleClick=\{resetWindowSize\}/);
  assert.match(css, /floating-window-controls/);
  assert.match(css, /flex-direction:\s*row\s*!important/);
});

test("save prepares dictionary and AI vocabulary details in parallel with visible feedback", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /Promise\.all\(\[dictionaryPromise, cardPromise\]\)/);
  assert.match(source, /Building a complete card/);
  assert.match(source, /Saving…/);
});

test("context changes cancel stale translation requests", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /translationAbort\.current\?\.abort\(\)/);
  assert.match(source, /translationSequence\.current \+= 1/);
  assert.match(source, /function swapLanguages\(\)[\s\S]*translationAbort\.current\?\.abort\(\)/);
});
