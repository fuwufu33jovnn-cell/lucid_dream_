import assert from "node:assert/strict";
import test from "node:test";
import { buildTodayPlan } from "../app/lib/today.ts";
import {
  answerQuestion,
  createExamSnapshot,
  examSecondsLeft,
  pauseExamSnapshot,
  remainingSeconds,
  resumeExamSnapshot,
} from "../app/lib/exam.ts";
import { SEED_LIBRARY } from "../app/lib/seeds.ts";
import {
  buildWalkthroughOutline,
  emptyPortfolioDraft,
  walkthroughCompleteness,
} from "../app/lib/portfolio.ts";
import {
  EDITORIAL_ACTIVITIES,
  LAB_MODES,
  availableContentKinds,
  filterEditorialActivities,
  summarizeActivityProgress,
} from "../app/lib/editorial.ts";
import { normalizeDictionaryResponse, normalizeSelection } from "../app/lib/language-tools.ts";
import { validateGeneratedPlan, validateSpeakingFeedback, validateWritingFeedback } from "../app/lib/ai-contracts.ts";
import { expiredPersonalMediaIds, parsePersonalMediaUrl, recentPersonalMedia } from "../app/lib/personal-media.ts";

test("10-minute plan stays tiny enough to start", () => {
  assert.deepEqual(buildTodayPlan(10).map((task) => task.minutes), [5, 5]);
});

test("45-minute plan preserves the approved speaking IELTS career mix", () => {
  const plan = buildTodayPlan(45);
  assert.equal(plan.reduce((sum, task) => sum + task.minutes, 0), 45);
  assert.ok(plan.some((task) => task.module === "Speaking"));
  assert.ok(plan.some((task) => task.module === "IELTS"));
  assert.ok(plan.some((task) => task.module === "Career"));
});

test("90-minute plan totals exactly 90 minutes", () => {
  const plan = buildTodayPlan(90);
  assert.equal(plan.reduce((sum, task) => sum + task.minutes, 0), 90);
  assert.equal(plan.length, 5);
});

test("every daily task opens a real local practice surface", () => {
  for (const mode of [10, 45, 90]) {
    assert.ok(buildTodayPlan(mode).every((task) => task.href.startsWith("/")));
  }
});

test("exam timer derives from a fixed deadline and never becomes negative", () => {
  assert.equal(remainingSeconds(1_200_000, 300_000), 900);
  assert.equal(remainingSeconds(300_000, 400_000), 0);
});

test("answering a question returns a new checkpoint without mutating the old one", () => {
  const snapshot = createExamSnapshot("realistic-reading-01", 1_200_000);
  const updated = answerQuestion(snapshot, "q1", "B", 1_234);
  assert.equal(updated.answers.q1, "B");
  assert.equal(updated.lastSavedAt, 1_234);
  assert.equal(snapshot.answers.q1, undefined);
  assert.equal(updated.endAt, 1_200_000);
});

test("practice timers can pause without losing time while mock timers stay strict", () => {
  const practice = createExamSnapshot("realistic-reading-01", 1_200_000, "practice");
  const paused = pauseExamSnapshot(practice, 300_000);
  assert.equal(paused.pausedRemainingSeconds, 900);
  assert.equal(examSecondsLeft(paused, 900_000), 900);
  const resumed = resumeExamSnapshot(paused, 1_000_000);
  assert.equal(resumed.endAt, 1_900_000);
  assert.equal(examSecondsLeft(resumed, 1_100_000), 800);

  const mock = createExamSnapshot("realistic-reading-01", 1_200_000, "mock");
  assert.deepEqual(pauseExamSnapshot(mock, 300_000), mock);
});

test("seed library contains 24 unique, actionable, rights-aware records", () => {
  assert.equal(SEED_LIBRARY.length, 24);
  assert.equal(new Set(SEED_LIBRARY.map((item) => item.id)).size, 24);
  assert.ok(SEED_LIBRARY.every((item) => item.sourceUrl.startsWith("https://")));
  assert.ok(SEED_LIBRARY.every((item) => item.usageBasis.length > 10));
  assert.ok(SEED_LIBRARY.filter((item) => item.category === "Design").length >= 8);
  assert.ok(SEED_LIBRARY.every((item) => item.prompt && item.output));
});

test("portfolio walkthrough measures nine evidence fields", () => {
  assert.deepEqual(walkthroughCompleteness(emptyPortfolioDraft()), { completed: 0, total: 9 });
});

test("portfolio outline turns evidence into a case-study structure without inventing impact", () => {
  const draft = {
    project: "Campus wayfinding redesign",
    audience: "new students",
    painPoint: "people missed the correct studio building",
    role: "visual research and interface prototype",
    choices: "a numbered route and stronger contrast",
    system: "reusable colour, type, icon, and spacing tokens",
    iteration: "simplified labels after corridor testing",
    impact: "fewer wrong turns during the second test",
    nextRole: "product design",
  };
  const outline = buildWalkthroughOutline(draft);
  assert.equal(outline[0].label, "Context");
  assert.match(outline[1].englishLead, /The central pain point/);
  assert.ok(outline.some((section) => section.label === "Impact"));

  const missingImpact = buildWalkthroughOutline({ ...draft, impact: "" });
  assert.match(missingImpact.find((section) => section.label === "Impact").content, /measure next/i);
});

test("editorial activities can be browsed through the five approved lab modes", () => {
  assert.deepEqual(LAB_MODES, ["Watch", "Listen", "Read", "Culture", "Random"]);
  assert.ok(LAB_MODES.every((mode) => EDITORIAL_ACTIVITIES.some((item) => item.mode === mode)));
  assert.equal(new Set(EDITORIAL_ACTIVITIES.map((item) => item.id)).size, EDITORIAL_ACTIVITIES.length);
});

test("editorial library has distinct Movie and Music collections with learning text", () => {
  assert.ok(EDITORIAL_ACTIVITIES.length >= 50);
  assert.ok(EDITORIAL_ACTIVITIES.filter((item) => item.contentKind === "Music").length >= 15);
  assert.ok(EDITORIAL_ACTIVITIES.filter((item) => item.contentKind === "Movie").length >= 15);
  assert.ok(EDITORIAL_ACTIVITIES.every((item) => item.sourceUrl.startsWith("https://")));
  assert.ok(EDITORIAL_ACTIVITIES.every((item) => item.learningText.length >= 2));
  assert.ok(EDITORIAL_ACTIVITIES.every((item) => !/full transcript|full lyrics/i.test(item.usageBasis)));
});

test("editorial activity filtering combines mode and a case-insensitive query", () => {
  const results = filterEditorialActivities(EDITORIAL_ACTIVITIES, "Read", "MOMA");
  assert.deepEqual(results.map((item) => item.id), ["moma-magazine"]);
});

test("each Language Lab mode exposes only child collections that contain entries", () => {
  for (const mode of LAB_MODES) {
    const kinds = availableContentKinds(EDITORIAL_ACTIVITIES, mode);
    assert.ok(kinds.length > 0);
    assert.ok(kinds.every((kind) => EDITORIAL_ACTIVITIES.some((item) => item.mode === mode && item.contentKind === kind)));
  }
});

test("marginalia never masquerades as real community reviews", () => {
  assert.ok(EDITORIAL_ACTIVITIES.every((item) => item.marginaliaLabel === "Fictional editorial marginalia"));
  assert.ok(EDITORIAL_ACTIVITIES.every((item) => item.marginalia.length >= 2));
});

test("activity progress summary counts saved language and completions independently", () => {
  const summary = summarizeActivityProgress([
    { id: "a", savedLanguage: "quietly specific", completedAt: 200 },
    { id: "b", savedLanguage: "", completedAt: null },
    { id: "c", savedLanguage: "visual rhythm", completedAt: null },
  ]);
  assert.deepEqual(summary, { started: 3, completed: 1, phrases: 2 });
});

test("language tool normalizes selections and dictionary results", () => {
  assert.equal(normalizeSelection("  visual\n rhythm  "), "visual rhythm");
  assert.equal(normalizeSelection("x".repeat(400)).length, 280);
  const entry = normalizeDictionaryResponse([{ word: "rhythm", phonetic: "/ˈrɪðəm/", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "a repeated pattern" }] }] }]);
  assert.equal(entry.word, "rhythm");
  assert.equal(entry.meanings[0].definition, "a repeated pattern");
});

test("AI responses are accepted only when their promised evidence is present", () => {
  assert.equal(validateGeneratedPlan({ tasks: [{ id: "a", module: "Speaking", title: "Retell", detail: "Retell one clip.", minutes: 10, href: "/practice/speaking/", accent: "coral" }] }, 10), true);
  assert.equal(validateGeneratedPlan({ tasks: [{ minutes: 20 }] }, 10), false);
  assert.equal(validateWritingFeedback({ unofficial: true, bandRange: "5.5–6.0", criteria: [], corrections: [], nextActions: [] }), true);
  assert.equal(validateSpeakingFeedback({ unofficial: true, audioAnalyzed: false, pronunciation: null, observations: [], alternatives: [], nextAttempt: "Try again." }), true);
});

test("personal media links become privacy-aware YouTube and Spotify embeds", () => {
  assert.deepEqual(parsePersonalMediaUrl("https://www.youtube.com/watch?v=abc_DEF-123"), {
    provider: "youtube",
    kind: "video",
    resourceId: "abc_DEF-123",
    sourceUrl: "https://www.youtube.com/watch?v=abc_DEF-123",
    embedUrl: "https://www.youtube-nocookie.com/embed/abc_DEF-123",
  });
  assert.deepEqual(parsePersonalMediaUrl("https://www.youtube.com/playlist?list=PL123abc_DEF"), {
    provider: "youtube",
    kind: "playlist",
    resourceId: "PL123abc_DEF",
    sourceUrl: "https://www.youtube.com/playlist?list=PL123abc_DEF",
    embedUrl: "https://www.youtube-nocookie.com/embed/videoseries?list=PL123abc_DEF",
  });
  assert.deepEqual(parsePersonalMediaUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=test"), {
    provider: "spotify",
    kind: "playlist",
    resourceId: "37i9dQZF1DXcBWIGoYBM5M",
    sourceUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
  });
});

test("personal media keeps only the latest seven days and identifies expired imports", () => {
  const now = 10 * 86_400_000;
  const items = [
    { id: "fresh", createdAt: now - 2 * 86_400_000 },
    { id: "edge", createdAt: now - 7 * 86_400_000 },
    { id: "expired", createdAt: now - 8 * 86_400_000 },
  ];
  assert.deepEqual(recentPersonalMedia(items, now).map((item) => item.id), ["fresh", "edge"]);
  assert.deepEqual(expiredPersonalMediaIds(items, now), ["expired"]);
});

test("personal media parser rejects lookalike domains and unsupported links", () => {
  assert.equal(parsePersonalMediaUrl("https://open.spotify.com.evil.example/track/abc"), null);
  assert.equal(parsePersonalMediaUrl("https://youtube.com/channel/abc"), null);
  assert.equal(parsePersonalMediaUrl("not a url"), null);
});

test("recent personal media contains only the last seven days in newest-first order", () => {
  const day = 86_400_000;
  const now = 20 * day;
  const records = [
    { id: "old", createdAt: now - 8 * day },
    { id: "today", createdAt: now - 100 },
    { id: "week", createdAt: now - 7 * day },
  ];
  assert.deepEqual(recentPersonalMedia(records, now).map((item) => item.id), ["today", "week"]);
});
