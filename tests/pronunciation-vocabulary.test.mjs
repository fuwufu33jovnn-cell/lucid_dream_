import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pickNaturalEnglishVoice } from "../app/lib/pronunciation.ts";
import { dedupeVocabularyRecords, vocabularyRecordId } from "../app/lib/vocabulary.ts";

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

test("vocabulary identity is global and dedupes case and whitespace variants", () => {
  assert.equal(vocabularyRecordId("  Make   sense "), vocabularyRecordId("make sense"));
  const records = dedupeVocabularyRecords([
    { id: "old:a", selection: "Make sense", sourceActivityId: "a", savedAt: 1, chineseMeaning: "有意义" },
    { id: "old:b", selection: " make   sense ", sourceActivityId: "b", savedAt: 2, englishDefinition: "to be understandable" },
  ]);
  assert.equal(records.length, 1);
  assert.equal(records[0].chineseMeaning, "有意义");
  assert.equal(records[0].englishDefinition, "to be understandable");
});

test("Archive renders compact vocabulary study fields and Chinese visibility controls", async () => {
  const source = await readFile(new URL("../app/components/archive-board.tsx", import.meta.url), "utf8");
  assert.match(source, /getAllRecords<[^>]*Vocabulary[^>]*>\("vocabulary"\)/);
  assert.match(source, /VOCABULARY SHELF/);
  assert.match(source, /HIDE ALL 中文/);
  assert.match(source, /SHOW ALL 中文/);
  assert.match(source, /chineseMeaning/);
  assert.match(source, /englishDefinition/);
  assert.match(source, /pronunciation/);
  assert.match(source, /item\.example/);
  assert.match(source, /CLOSE USE/);
});

test("floating Save toggles a globally unique vocabulary record to Undo", async () => {
  const source = await readFile(new URL("../app/components/floating-study-window.tsx", import.meta.url), "utf8");
  assert.match(source, /vocabularyRecordId\(normalized\)/);
  assert.match(source, /sameVocabularySelection/);
  assert.match(source, /deleteRecord\("vocabulary"/);
  assert.match(source, /selectionSaved \? "Undo"/);
  assert.match(source, /capability: "vocabulary-card"/);
});
