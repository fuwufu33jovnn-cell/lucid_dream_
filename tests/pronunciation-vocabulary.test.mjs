import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pickNaturalEnglishVoice } from "../app/lib/pronunciation.ts";

test("multilingual speech detects Korean, Japanese, Chinese and English text", async () => {
  const pronunciation = await import("../app/lib/pronunciation.ts");
  assert.equal(typeof pronunciation.detectSpeechLanguage, "function");
  assert.equal(pronunciation.detectSpeechLanguage("오늘 날씨가 좋아요"), "ko-KR");
  assert.equal(pronunciation.detectSpeechLanguage("これはテストです"), "ja-JP");
  assert.equal(pronunciation.detectSpeechLanguage("这是一个测试"), "zh-CN");
  assert.equal(pronunciation.detectSpeechLanguage("This is a test"), "en-US");
});

test("multilingual speech honors a requested voice style when the browser offers one", async () => {
  const pronunciation = await import("../app/lib/pronunciation.ts");
  assert.equal(typeof pronunciation.pickNaturalVoice, "function");
  const voices = [
    { name: "Microsoft SunHi Online (Natural)", lang: "ko-KR", localService: false, default: false },
    { name: "Microsoft InJoon Online (Natural)", lang: "ko-KR", localService: false, default: false },
  ];
  assert.equal(pronunciation.pickNaturalVoice(voices, "ko-KR", "female")?.name, "Microsoft SunHi Online (Natural)");
  assert.equal(pronunciation.pickNaturalVoice(voices, "ko-KR", "male")?.name, "Microsoft InJoon Online (Natural)");
});

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
  assert.ok(source.includes("savedAt,"));
});
