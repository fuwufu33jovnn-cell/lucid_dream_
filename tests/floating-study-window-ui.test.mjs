import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../app/components/floating-study-window.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/floating-study-window-overrides.css", import.meta.url), "utf8");

test("floating study window gives the user a clear three-step flow", () => {
  assert.match(component, /STEP 1/);
  assert.match(component, /STEP 2/);
  assert.match(component, /STEP 3/);
  assert.match(component, /Select text above or type a word \/ phrase/);
});

test("transcript selection can populate the word or phrase field", () => {
  assert.match(component, /captureTextareaSelection/);
  assert.match(component, /onSelect=\{captureTextareaSelection\}/);
});

test("actions expose working and result feedback", () => {
  assert.match(component, /busyAction/);
  assert.match(component, /aria-busy=\{!!busyAction\}/);
  assert.match(component, /floating-result-panel/);
});

test("study text remains visibly editable even if broader textarea styles change", () => {
  assert.match(css, /\.floating-study-window \.subtitle-study-copy textarea/);
  assert.match(css, /-webkit-text-fill-color:\s*#171717/);
  assert.match(css, /caret-color:\s*#171717/);
  assert.match(css, /background:\s*#fff/);
});

test("window remains compact, draggable and resizable", () => {
  assert.match(css, /width:\s*min\(430px/);
  assert.match(css, /resize:\s*both/);
  assert.match(component, /floating-study-handle/);
});
