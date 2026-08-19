# LUCID DREAM Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a private, cross-platform Phase 1 learning workbench with Today planning, a recoverable IELTS computer-test experience, 24 rights-reviewed learning seeds, and a digital-media Portfolio Walkthrough.

**Architecture:** Use the existing Vinext Sites checkout and server-rendered route shells with focused client components for interactive workflows. A small native IndexedDB repository owns all device-local authoritative state; pure domain functions build plans and exam snapshots so behavior can be tested without rendering details. The hosted site uses platform-provided ChatGPT sign-in and does not add D1 or R2 in this milestone.

**Tech Stack:** Vinext, React 19, TypeScript 5.9, Tailwind CSS 4 plus focused CSS, native IndexedDB, Node test runner, fake-indexeddb for repository tests, Cloudflare Sites runtime.

**Spec:** `docs/superpowers/specs/lucid-dream-phase1.md`

## Global Constraints

- Windows 10/11 current Chrome and Edge are first-class acceptance environments.
- Exam answers and drafts use IndexedDB, never LocalStorage.
- Strict exam mode is unavailable when IndexedDB cannot be opened.
- All IELTS practice content in this build is original and labeled `Realistic Mock`.
- Seed content stores links, metadata, and original exercises rather than copied protected works.
- Web Push, exchange-rate automation, large-file upload, and high-pressure Life Abroad simulation are outside this plan.
- Use test-first red-green-refactor for production behavior.
- Preserve `.openai/hosting.json`, the Vinext build, and Cloudflare-compatible ESM output.

## File map

- `app/layout.tsx` — authoritative title, language, metadata, and global shell.
- `app/page.tsx` — private Today route.
- `app/ielts/page.tsx` — IELTS route shell.
- `app/language-lab/page.tsx` — seed-library route shell.
- `app/career/page.tsx` — Portfolio Walkthrough route shell.
- `app/route-map/page.tsx`, `app/progress/page.tsx`, `app/life-abroad/page.tsx` — honest deferred-state pages.
- `app/components/app-shell.tsx` — responsive seven-item navigation and account context.
- `app/components/today-board.tsx` — time-mode and task-completion UI.
- `app/components/exam-workspace.tsx` — passage, timer, questions, navigation, and save status.
- `app/components/seed-library.tsx` — filters, cards, saved state, and activity details.
- `app/components/portfolio-walkthrough.tsx` — case-study draft and rehearsal UI.
- `app/lib/models.ts` — shared data contracts.
- `app/lib/today.ts` — deterministic task-plan builder.
- `app/lib/exam.ts` — original mock content and snapshot reducer.
- `app/lib/indexed-db.ts` — versioned native IndexedDB repository.
- `app/lib/seeds.ts` — 24 rights-reviewed seed records.
- `app/lib/portfolio.ts` — walkthrough outline builder and validation.
- `app/globals.css` — editorial visual system, responsive behavior, focus, and reduced motion.
- `tests/domain.test.mjs` — Today, exam, and portfolio behavior.
- `tests/indexed-db.test.mjs` — actual repository behavior through fake-indexeddb.
- `tests/rendered-html.test.mjs` — route/status/metadata integration checks.

---

### Task 1: Cross-platform private application shell

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Create: `app/components/app-shell.tsx`
- Create: `app/route-map/page.tsx`
- Create: `app/progress/page.tsx`
- Create: `app/life-abroad/page.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `requireChatGPTUser(returnTo: string): Promise<ChatGPTUser>` from `app/chatgpt-auth.ts`.
- Produces: `AppShell({ active, userName, children })` and the shared seven-route navigation.

- [ ] **Step 1: Add a failing rendered-HTML test**

Add a request carrying `oai-authenticated-user-email: learner@example.com` and assert literal behavior:

```js
assert.match(html, /LUCID DREAM/);
assert.match(html, /Today/);
assert.match(html, /IELTS Exam/);
assert.match(html, /Life Abroad/);
assert.doesNotMatch(html, /Starter Project/);
```

- [ ] **Step 2: Run the integration test and verify RED**

Run: `npm test`

Expected: FAIL because the starter still renders `Starter Project` and has no product navigation.

- [ ] **Step 3: Implement the authenticated shell and deferred pages**

Set metadata title to `LUCID DREAM`, description to `Your calm route to English, work, and life abroad.`, and `<html lang="zh-CN">`. Protect browser pages with the existing ChatGPT sign-in helper and render a responsive navigation with these exact destinations: Today, IELTS Exam, Language Lab, Career Studio, Route Map, Progress, Life Abroad. Deferred pages state what belongs to the later phase without interactive fake controls.

- [ ] **Step 4: Implement the visual foundation**

Define CSS variables `--paper`, `--paper-strong`, `--ink`, `--muted`, `--line`, `--blue`, `--coral`, and `--sage`. Use `"Segoe UI", Arial, sans-serif` for interface copy and Georgia for editorial display text; use cursive only for a short decorative line. Add 44px touch targets, `:focus-visible`, `prefers-reduced-motion`, and responsive breakpoints at 900px and 640px.

- [ ] **Step 5: Run tests and lint**

Run: `npm test && npm run lint`

Expected: PASS with no starter title or missing-navigation failures.

- [ ] **Step 6: Commit**

```bash
git add app tests docs .openai package.json package-lock.json
git commit -m "feat: establish lucid dream application shell"
```

### Task 2: Deterministic Today plan with IndexedDB completion state

**Files:**
- Create: `app/lib/models.ts`
- Create: `app/lib/today.ts`
- Create: `app/lib/indexed-db.ts`
- Create: `app/components/today-board.tsx`
- Modify: `app/page.tsx`
- Create: `tests/domain.test.mjs`
- Create: `tests/indexed-db.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `type PlanMode = 10 | 45 | 90`.
- Produces: `buildTodayPlan(mode: PlanMode): TodayTask[]`.
- Produces: `openLucidDb(): Promise<IDBDatabase>`.
- Produces: `getRecord<T>(store: StoreName, key: string): Promise<T | undefined>`.
- Produces: `putRecord<T extends { id: string }>(store: StoreName, value: T): Promise<void>`.
- Database name: `lucid-dream`; version: `1`; stores: `preferences`, `today`, `examSessions`, `library`, `portfolio` with keyPath `id`.

- [ ] **Step 1: Install the IndexedDB test implementation**

Run: `npm install --save-dev fake-indexeddb@6.2.4`

Expected: dependency and lockfile update without production dependencies.

- [ ] **Step 2: Write failing Today domain tests**

Test hand-derived totals and task mix:

```js
assert.deepEqual(buildTodayPlan(10).map((task) => task.minutes), [5, 5]);
assert.equal(buildTodayPlan(45).reduce((sum, task) => sum + task.minutes, 0), 45);
assert.equal(buildTodayPlan(90).reduce((sum, task) => sum + task.minutes, 0), 90);
assert.ok(buildTodayPlan(45).some((task) => task.module === "Speaking"));
assert.ok(buildTodayPlan(45).some((task) => task.module === "IELTS"));
```

- [ ] **Step 3: Run the Today tests and verify RED**

Run: `node --test tests/domain.test.mjs`

Expected: FAIL because `buildTodayPlan` does not exist.

- [ ] **Step 4: Implement the minimal deterministic plan builder**

Return two tasks for 10 minutes, three tasks totaling 45 minutes, and five tasks totaling 90 minutes. Use the approved 45-minute split of 20 minutes speaking/input-output, 15 IELTS, and 10 career/route work. No AI call is involved.

- [ ] **Step 5: Run Today tests and verify GREEN**

Run: `node --test tests/domain.test.mjs`

Expected: all Today tests PASS.

- [ ] **Step 6: Write failing IndexedDB repository tests**

Install fake IndexedDB globals and verify a real write/read/overwrite cycle:

```js
await putRecord("preferences", { id: "plan-mode", value: 45 });
assert.deepEqual(await getRecord("preferences", "plan-mode"), {
  id: "plan-mode",
  value: 45,
});
await putRecord("preferences", { id: "plan-mode", value: 90 });
assert.equal((await getRecord("preferences", "plan-mode")).value, 90);
```

- [ ] **Step 7: Run repository tests and verify RED**

Run: `node --test tests/indexed-db.test.mjs`

Expected: FAIL because the repository functions do not exist.

- [ ] **Step 8: Implement the IndexedDB repository**

Open version 1, create all five stores during `onupgradeneeded`, resolve only after transaction completion, reject request/transaction errors, and expose `isIndexedDbAvailable()` that performs a real open rather than checking only `"indexedDB" in window`.

- [ ] **Step 9: Run repository tests and verify GREEN**

Run: `node --test tests/indexed-db.test.mjs`

Expected: repository tests PASS.

- [ ] **Step 10: Build TodayBoard using the tested interfaces**

Persist selected mode as `plan-mode` and daily completion under `today-YYYY-MM-DD`. Show a calm completion fraction, allow task replacement only with another same-minute predefined task, and display `Saved on this device` after transaction completion. If IndexedDB fails, keep the view readable and explain that progress will not survive refresh.

- [ ] **Step 11: Run full checks and commit**

Run: `npm test && npm run lint`

```bash
git add app tests package.json package-lock.json
git commit -m "feat: add recoverable daily planning"
```

### Task 3: IELTS computer-test workspace and crash recovery

**Files:**
- Create: `app/ielts/page.tsx`
- Create: `app/lib/exam.ts`
- Create: `app/components/exam-workspace.tsx`
- Modify: `tests/domain.test.mjs`
- Modify: `tests/indexed-db.test.mjs`

**Interfaces:**
- Produces: `REALISTIC_READING_MOCK: ReadingMock` with an original passage and ten original questions.
- Produces: `createExamSnapshot(mockId: string, endAt: number): ExamSnapshot`.
- Produces: `answerQuestion(snapshot: ExamSnapshot, questionId: string, answer: string, savedAt: number): ExamSnapshot`.
- Produces: `remainingSeconds(endAt: number, now: number): number`.
- Persists one record under `examSessions` with id `realistic-reading-01`.

- [ ] **Step 1: Write failing exam-domain tests**

```js
assert.equal(remainingSeconds(1_200_000, 300_000), 900);
assert.equal(remainingSeconds(300_000, 400_000), 0);
const updated = answerQuestion(snapshot, "q1", "B", 1234);
assert.equal(updated.answers.q1, "B");
assert.equal(updated.lastSavedAt, 1234);
assert.equal(snapshot.answers.q1, undefined);
```

- [ ] **Step 2: Run domain tests and verify RED**

Run: `node --test tests/domain.test.mjs`

Expected: FAIL because exam functions and content do not exist.

- [ ] **Step 3: Implement exam types, original material, and pure state functions**

Create a 650–800 word original passage about wayfinding and visual information in public transport, followed by ten mixed multiple-choice and short-answer questions. Label it `Realistic Mock · Original practice`, not official or past-paper content. Derive the timer from `endAt - now`, clamped at zero.

- [ ] **Step 4: Run domain tests and verify GREEN**

Run: `node --test tests/domain.test.mjs`

Expected: exam-domain tests PASS.

- [ ] **Step 5: Write a failing recovery test**

Save a snapshot containing two answers, close the module-level cached database, reopen it, and assert the exact answer map and original `endAt` are recovered. Mutating the recovered snapshot must not extend `endAt`.

- [ ] **Step 6: Run repository recovery test and verify RED**

Run: `node --test tests/indexed-db.test.mjs`

Expected: FAIL until the exam snapshot is stored through the repository contract.

- [ ] **Step 7: Implement ExamWorkspace**

Use a desktop split pane: sticky passage at left, questions at right, top timer and save status, and bottom numbered question navigator. Checkpoint every selected answer immediately; debounce free text at 500ms and flush on navigation and `visibilitychange`. On load, offer `Resume saved attempt` when a record exists. Strict mode start is disabled if `isIndexedDbAvailable()` fails. Automatic submission locks inputs when time reaches zero without deleting the local record.

- [ ] **Step 8: Add keyboard and Windows browser behavior**

Use native buttons, radio inputs, text inputs, and CSS grid/flex. Do not depend on Meta-key shortcuts, touch-only gestures, backdrop-filter, or nonstandard scrollbar behavior. Passage and question panes each receive visible labels and predictable tab order.

- [ ] **Step 9: Run checks and commit**

Run: `npm test && npm run lint`

```bash
git add app/ielts app/components/exam-workspace.tsx app/lib/exam.ts tests
git commit -m "feat: add recoverable IELTS computer test"
```

### Task 4: Rights-aware 24-item Language Lab

**Files:**
- Create: `app/language-lab/page.tsx`
- Create: `app/lib/seeds.ts`
- Create: `app/components/seed-library.tsx`
- Modify: `tests/domain.test.mjs`

**Interfaces:**
- Produces: `SEED_LIBRARY: readonly SeedActivity[]`.
- Each record contains: `id`, `title`, `publisher`, `sourceUrl`, `category`, `level`, `minutes`, `skills`, `usageBasis`, `prompt`, `output`, `reviewedAt`.
- Categories: `Design`, `Work`, `Life`, `Culture`, `Academic`.

- [ ] **Step 1: Write failing seed-catalog integrity tests**

```js
assert.equal(SEED_LIBRARY.length, 24);
assert.equal(new Set(SEED_LIBRARY.map((item) => item.id)).size, 24);
assert.ok(SEED_LIBRARY.every((item) => item.sourceUrl.startsWith("https://")));
assert.ok(SEED_LIBRARY.every((item) => item.usageBasis.length > 10));
assert.ok(SEED_LIBRARY.filter((item) => item.category === "Design").length >= 8);
assert.ok(SEED_LIBRARY.every((item) => item.prompt && item.output));
```

- [ ] **Step 2: Run catalog tests and verify RED**

Run: `node --test tests/domain.test.mjs`

Expected: FAIL because the catalog does not exist.

- [ ] **Step 3: Add 24 reviewed records**

Use official publisher URLs from design conferences, standards bodies, museums, universities, and public-interest organizations. Store no copied transcript or long excerpt. At least eight items focus on design and digital media; every item ends in a spoken summary, Design Breakdown, short response, or saved-expression output.

- [ ] **Step 4: Run catalog tests and verify GREEN**

Run: `node --test tests/domain.test.mjs`

Expected: catalog integrity tests PASS.

- [ ] **Step 5: Implement filtering, activity details, and saved state**

Provide category chips, level filter, 5/15/30-minute filter, search, and a card-to-detail panel. External links open with `target="_blank"` and `rel="noreferrer"`. Saving an activity writes `{ id, savedAt }` to the `library` store; card text clearly says the source opens on the publisher's site.

- [ ] **Step 6: Run checks and commit**

Run: `npm test && npm run lint`

```bash
git add app/language-lab app/components/seed-library.tsx app/lib/seeds.ts tests
git commit -m "feat: add rights-aware language seed library"
```

### Task 5: Digital-media Portfolio Walkthrough

**Files:**
- Create: `app/career/page.tsx`
- Create: `app/lib/portfolio.ts`
- Create: `app/components/portfolio-walkthrough.tsx`
- Modify: `tests/domain.test.mjs`

**Interfaces:**
- Produces: `type PortfolioDraft` with `project`, `audience`, `painPoint`, `role`, `choices`, `system`, `iteration`, `impact`, and `nextRole`.
- Produces: `buildWalkthroughOutline(draft: PortfolioDraft): WalkthroughSection[]`.
- Produces: `walkthroughCompleteness(draft: PortfolioDraft): { completed: number; total: 9 }`.

- [ ] **Step 1: Write failing outline tests**

```js
assert.deepEqual(walkthroughCompleteness(emptyDraft), { completed: 0, total: 9 });
assert.equal(buildWalkthroughOutline(completeDraft)[0].label, "Context");
assert.match(buildWalkthroughOutline(completeDraft)[1].englishLead, /The central pain point/);
assert.ok(buildWalkthroughOutline(completeDraft).some((s) => s.label === "Impact"));
```

- [ ] **Step 2: Run outline tests and verify RED**

Run: `node --test tests/domain.test.mjs`

Expected: FAIL because the portfolio domain functions do not exist.

- [ ] **Step 3: Implement outline generation without invented claims**

Return fixed English lead-in patterns plus the user's own text. If `impact` is empty, output `What changed, what was learned, or what you would measure next` rather than fabricating a metric. Keep English guidance editable and never overwrite the user's source fields.

- [ ] **Step 4: Run outline tests and verify GREEN**

Run: `node --test tests/domain.test.mjs`

Expected: portfolio tests PASS.

- [ ] **Step 5: Implement builder, draft recovery, and rehearsal**

Use a two-column editor/preview on desktop and one column on mobile. Save the draft to `portfolio` under id `primary-case-study` after 500ms and show transaction status. Add 60-second overview and five-minute walkthrough timers, section cue cards, and reflection fields for `Where did I translate from Chinese?` and `Which phrase will I reuse?`.

- [ ] **Step 6: Run checks and commit**

Run: `npm test && npm run lint`

```bash
git add app/career app/components/portfolio-walkthrough.tsx app/lib/portfolio.ts tests
git commit -m "feat: add portfolio walkthrough practice"
```

### Task 6: Preview QA, browser recovery, and checkpoint deployment

**Files:**
- Modify only files implicated by observed failures.

**Interfaces:**
- Consumes all Phase 1 routes and persistence contracts.
- Produces a verified Sites checkpoint deployment.

- [ ] **Step 1: Start the agent preview**

Run the Sites preview command from the checkout and wait for a healthy preview URL.

- [ ] **Step 2: Test the visible workflows in the cloud browser**

Verify Today mode switching and saved completion; start the Reading mock, answer multiple question types, refresh, resume, and confirm the timer deadline did not reset; filter and save a seed; complete portfolio fields, refresh, and confirm recovery. Check 1440×900, 1280×720, and a mobile viewport.

- [ ] **Step 3: Test Windows-oriented interaction contracts**

In Chromium, complete all workflows by mouse and by keyboard only. Verify visible focus, standard controls, no clipped content at 200% zoom, no Meta-key instructions, and no hover-only action. Treat Chromium results as the standards-based Chrome/Edge gate; do not claim physical Windows testing unless it occurred.

- [ ] **Step 4: Run the full automated gate**

Run: `npm test && npm run lint && npm run build && npm run validate:artifact`

Expected: zero test failures, zero lint errors, successful build, and valid hosting artifact.

- [ ] **Step 5: Checkpoint the site**

Run the Sites checkpoint command with a concise Phase 1 message, then verify deployment status through the required direct status call.

- [ ] **Step 6: Commit any QA fixes**

```bash
git add app tests package.json package-lock.json docs
git commit -m "chore: verify lucid dream phase one"
```

## Self-review record

- Spec coverage: Today, IELTS/IndexedDB, 24 seeds, Portfolio Walkthrough, honest deferred routes, private sign-in, and Windows-oriented acceptance each map to a task.
- Deliberate gap: cross-device synchronization is not claimed; the narrowed Phase 1 milestone is device-local and the interface must say so.
- Placeholder scan: the plan contains no undefined implementation placeholders; deferred product capabilities are explicit scope exclusions.
- Type consistency: `PlanMode`, `ExamSnapshot`, `SeedActivity`, `PortfolioDraft`, store names, and record ids are defined once and reused by later tasks.

