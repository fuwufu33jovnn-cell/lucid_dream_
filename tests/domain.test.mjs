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

test("expanded seed library stays broad, unique, actionable, and rights-aware", () => {
  assert.ok(SEED_LIBRARY.length >= 80);
  assert.equal(new Set(SEED_LIBRARY.map((item) => item.id)).size, SEED_LIBRARY.length);
  assert.ok(SEED_LIBRARY.every((item) => item.sourceUrl.startsWith("https://")));
  assert.ok(SEED_LIBRARY.every((item) => item.usageBasis.length > 10));
  assert.ok(SEED_LIBRARY.filter((item) => item.category === "Design").length >= 8);
  assert.ok(SEED_LIBRARY.filter((item) => item.category === "Music").length >= 8);
  assert.ok(SEED_LIBRARY.filter((item) => item.category === "Film").length >= 8);
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
