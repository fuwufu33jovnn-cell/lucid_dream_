import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pickNaturalEnglishVoice } from "../app/lib/pronunciation.ts";

test("natural pronunciation prefers premium/native English voices over generic defaults", () => {
  const voices = [
    { name: "Fred", lang: "en-US", localService: true, default: true },
    { name: "Samantha", lang: "en-US", localService: true, default: false },
    { name: "Google UK English Female", lang: "en-GB", localService: false, default: false },
  ];
  assert.equal(pickNaturalEnglishVoice(voices)?.name, "Samantha");
});

test("natural pronunciation still chooses an English voice when preferred names are absent", () => {
  const voices = [
    { name: "Generic Chinese", lang: "zh-CN", localService: true, default: true },
    { name: "English Voice", lang: "en-GB", localService: true, default: false },
  ];
  assert.equal(pickNaturalEnglishVoice(voices)?.name, "English Voice");
});

test("Archive reads saved floating-window vocabulary and renders a visible vocabulary shelf", async () => {
  const source = await readFile(new URL("../app/components/archive-board.tsx", import.meta.url), "utf8");
  assert.match(source, /getAllRecords<[^>]*Vocabulary[^>]*>\("vocabulary"\)/);
  assert.match(source, /VOCABULARY SHELF/);
  assert.match(source, /vocabulary-shelf/);
  assert.match(source, /selection/);
  assert.match(source, /context/);
});

test("floating Save writes a reusable vocabulary record with stable source metadata", async () => {
  const source = await readFile(new URL("../app/components/floating-study-window.tsx", import.meta.url), "utf8");
  assert.ok(source.includes('id: `${activityId}:'));
  assert.match(source, /savedAt:/);
});
