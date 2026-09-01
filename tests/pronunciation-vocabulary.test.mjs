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

test("a vocabulary row is incomplete until every visible study field is real", async () => {
  const vocabulary = await import("../app/lib/vocabulary.ts");
  assert.equal(typeof vocabulary.hasCompleteVocabularyDetails, "function");

  const incomplete = {
    id: "vocab:foodie",
    selection: "foodie",
    sourceActivityId: "culture-story",
    chineseMeaning: "",
    englishDefinition: "someone who loves food",
    pronunciation: "/ˈfuːdi/",
    example: "",
  };
  assert.equal(vocabulary.hasCompleteVocabularyDetails(incomplete), false);
  assert.equal(vocabulary.hasCompleteVocabularyDetails({
    ...incomplete,
    chineseMeaning: "美食爱好者；吃货",
    example: "As a foodie, Mina keeps a list of small family-run restaurants.",
  }), true);
});

test("completing a vocabulary row rejects a mismatched or invalid AI usage example", async () => {
  const vocabulary = await import("../app/lib/vocabulary.ts");
  assert.equal(typeof vocabulary.completeVocabularyRecord, "function");

  const record = {
    id: "vocab:foodie",
    selection: "foodie",
    sourceActivityId: "culture-story",
    context: "We followed a local food writer through Osaka.",
  };
  const unrelated = {
    selection: "foodie",
    validSelection: true,
    suggestedCorrection: null,
    chineseMeaning: "美食爱好者；吃货",
    englishDefinition: "a person with a strong interest in food",
    pronunciation: "/ˈfuːdi/",
    example: "I am so blinded by you.",
  };
  assert.equal(vocabulary.completeVocabularyRecord(record, unrelated, null), null);
  assert.equal(vocabulary.completeVocabularyRecord(record, {
    ...unrelated,
    validSelection: false,
    suggestedCorrection: "foodie",
    example: "As a foodie, she searches for regional dishes.",
  }, null), null);
});

test("completing a vocabulary row stores matched meanings and labels the example source", async () => {
  const vocabulary = await import("../app/lib/vocabulary.ts");
  const record = {
    id: "old:foodie",
    selection: "foodie",
    sourceActivityId: "culture-story",
    context: "We followed a local food writer through Osaka.",
    createdAt: 10,
  };
  const card = {
    selection: "foodie",
    validSelection: true,
    suggestedCorrection: null,
    chineseMeaning: "美食爱好者；吃货",
    englishDefinition: "a person with a strong interest in food",
    pronunciation: "/ˈfuːdi/",
    example: "As a foodie, she searches for regional dishes.",
  };
  const completed = vocabulary.completeVocabularyRecord(record, card, {
    word: "foodie",
    phonetic: "/ˈfuːdi/",
    audioUrl: "https://audio.example/foodie.mp3",
    meanings: [{
      partOfSpeech: "noun",
      definition: "a person with a particular interest in food",
      example: "The city has become a destination for foodies.",
    }],
  });

  assert.deepEqual(completed && {
    id: completed.id,
    chineseMeaning: completed.chineseMeaning,
    englishDefinition: completed.englishDefinition,
    pronunciation: completed.pronunciation,
    example: completed.example,
    exampleSource: completed.exampleSource,
  }, {
    id: "vocab:foodie",
    chineseMeaning: "美食爱好者；吃货",
    englishDefinition: "a person with a particular interest in food",
    pronunciation: "/ˈfuːdi/",
    example: "As a foodie, she searches for regional dishes.",
    exampleSource: "ai",
  });
});

test("Archive never substitutes source context for a missing usage example", async () => {
  const vocabulary = await import("../app/lib/vocabulary.ts");
  assert.equal(typeof vocabulary.vocabularyUsageExample, "function");
  assert.equal(vocabulary.vocabularyUsageExample({
    id: "vocab:apple",
    selection: "apple",
    sourceActivityId: "apple-design-principles",
    context: "Listen for three qualities used to evaluate a design.",
    example: "",
  }), null);
  assert.equal(vocabulary.vocabularyUsageExample({
    id: "vocab:apple",
    selection: "apple",
    sourceActivityId: "food-story",
    context: "A story about an orchard.",
    example: "She sliced an apple for the picnic.",
  }), "She sliced an apple for the picnic.");
});

test("Archive identifies only incomplete legacy rows for automatic detail repair", async () => {
  const vocabulary = await import("../app/lib/vocabulary.ts");
  assert.equal(typeof vocabulary.recordsNeedingVocabularyDetails, "function");
  const records = [
    { id: "vocab:foodie", selection: "foodie", sourceActivityId: "a", chineseMeaning: "", englishDefinition: "", pronunciation: "", example: "", savedAt: 3 },
    { id: "vocab:apple", selection: "apple", sourceActivityId: "b", chineseMeaning: "苹果", englishDefinition: "a round fruit", pronunciation: "/ˈæpəl/", example: "She sliced an apple.", savedAt: 2 },
    { id: "vocab:sint", selection: "sint", sourceActivityId: "c", chineseMeaning: "", englishDefinition: "", pronunciation: "", example: "", savedAt: 1 },
  ];
  assert.deepEqual(vocabulary.recordsNeedingVocabularyDetails(records, 1).map((record) => record.selection), ["foodie"]);
  assert.deepEqual(vocabulary.recordsNeedingVocabularyDetails(records, 10).map((record) => record.selection), ["foodie", "sint"]);
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
