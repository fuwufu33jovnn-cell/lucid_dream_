import assert from "node:assert/strict";
import test from "node:test";
import { buildTodayPlan } from "../app/lib/today.ts";
import {
  answerQuestion,
  createExamSnapshot,
  remainingSeconds,
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
  filterEditorialActivities,
  summarizeActivityProgress,
} from "../app/lib/editorial.ts";

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

test("editorial activity filtering combines mode and a case-insensitive query", () => {
  const results = filterEditorialActivities(EDITORIAL_ACTIVITIES, "Read", "MOMA");
  assert.deepEqual(results.map((item) => item.id), ["moma-magazine"]);
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
