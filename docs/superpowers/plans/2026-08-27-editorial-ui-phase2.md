# LUCID DREAM Editorial UI Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn LUCID DREAM into an editorial English-culture magazine with a working activity dossier and personal Archive while preserving Today, IELTS, and Portfolio functionality.

**Architecture:** Keep the existing Vinext/React route structure and IndexedDB persistence. Add pure content/domain helpers first, then client components that consume them, then replace the shared shell and CSS so all routes inherit the new art direction without coupling persistence logic to presentation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vinext, IndexedDB, Node test runner, CSS.

**Spec:** `docs/superpowers/specs/2026-08-27-editorial-ui-phase2-design.md`

## Global Constraints

- Preserve existing Today, IELTS, Portfolio, and IndexedDB record compatibility.
- Store only metadata, original prompts, and user-created notes; do not copy lyrics, transcripts, or full articles.
- Fictional Marginalia must be visibly labeled as editorial fiction.
- All editing controls must disclose when device saving is unavailable.
- Preserve public rendering and the existing Sites/Vinext build structure.

---

### Task 1: Editorial content and activity progress domain

**Files:**
- Create: `app/lib/editorial.ts`
- Modify: `app/lib/models.ts`
- Modify: `tests/domain.test.mjs`

**Interfaces:**
- Produces: `LAB_MODES`, `EDITORIAL_ACTIVITIES`, `filterEditorialActivities(items, mode, query)`, `summarizeActivityProgress(records)`, and `ActivityProgress`.

- [ ] **Step 1: Write failing domain tests**

Add tests asserting five stable lab modes, mode/query filtering, unique activity IDs, clearly labeled Marginalia, and progress totals derived from records.

- [ ] **Step 2: Run the domain tests and verify failure**

Run: `node --test tests/domain.test.mjs`

Expected: FAIL because `app/lib/editorial.ts` does not exist.

- [ ] **Step 3: Implement the minimal domain module**

Define typed editorial activities mapped from the existing rights-aware seed library, with mode, format, original note, four prompts, and fictional Marginalia. Implement pure filtering and summary functions without browser APIs.

- [ ] **Step 4: Run domain tests**

Run: `node --test tests/domain.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/lib/editorial.ts app/lib/models.ts tests/domain.test.mjs
git commit -m "feat: add editorial activity domain"
```

### Task 2: Masthead and editorial homepage

**Files:**
- Modify: `app/components/app-shell.tsx`
- Modify: `app/page.tsx`
- Modify: `app/components/today-board.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `EDITORIAL_ACTIVITIES` from Task 1.
- Produces: shared masthead markup and Issue 08 homepage sections used by every route.

- [ ] **Step 1: Write failing rendered HTML assertions**

Assert the homepage renders `ISSUE 08`, `NIGHT RADIO`, the magazine section index, and a visible Today entry while no longer rendering the old side rail account card.

- [ ] **Step 2: Run the rendered test and verify failure**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL on the new editorial markers.

- [ ] **Step 3: Replace the shell and homepage markup**

Build a semantic masthead, issue strip, asymmetric feature layout, listening/film/words modules, and a compact Today section. Keep `TodayBoard` persistence and actions unchanged while replacing dashboard-specific wrappers and copy.

- [ ] **Step 4: Establish the shared editorial CSS**

Replace the fixed rail, rounded card system, gradient background, and repeated shadow surfaces with rectangular rules, editorial grids, serif display typography, cobalt/yellow accents, responsive reading order, visible focus, and reduced-motion support. Preserve selectors required by IELTS and Portfolio until their shared restyle is complete.

- [ ] **Step 5: Run build and rendered tests**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/components/app-shell.tsx app/page.tsx app/components/today-board.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: rebuild the editorial home"
```

### Task 3: Language Lab dossier and Marginalia

**Files:**
- Create: `app/components/editorial-lab.tsx`
- Modify: `app/language-lab/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/indexed-db.test.mjs`

**Interfaces:**
- Consumes: `LAB_MODES`, `EDITORIAL_ACTIVITIES`, `ActivityProgress`, `getRecord`, and `putRecord`.
- Produces: device-saved activity notes and completion records in IndexedDB store `activity-progress`.

- [ ] **Step 1: Add failing content and persistence tests**

Assert the Language Lab route contains all five modes and the IndexedDB schema accepts an `activity-progress` record containing notice notes, saved language, shadow note, speaking outline, and completion timestamp.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test tests/indexed-db.test.mjs && npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because the new store and interface do not exist.

- [ ] **Step 3: Add the activity progress store**

Extend the database upgrade path without renaming or deleting existing stores. Keep old Today, IELTS, library, preferences, and Portfolio records readable.

- [ ] **Step 4: Build the editorial lab and dossier**

Implement mode navigation, compact search/level/duration utilities, irregular content rows, a keyboard-operable dossier, four user-output fields, save status, external source action, completion control, and the explicitly labeled fictional Marginalia reveal.

- [ ] **Step 5: Add responsive and interaction styling**

Use square content frames, editorial dividers, controlled hover crops, and a single-column mobile dossier. Disable transitions under `prefers-reduced-motion`.

- [ ] **Step 6: Run tests**

Run: `node --test tests/domain.test.mjs tests/indexed-db.test.mjs && npm run build && node --test tests/rendered-html.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/components/editorial-lab.tsx app/language-lab/page.tsx app/lib/indexed-db.ts app/globals.css tests/indexed-db.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: build the language lab dossier"
```

### Task 4: Archive and supporting route completion

**Files:**
- Create: `app/components/archive-board.tsx`
- Modify: `app/progress/page.tsx`
- Modify: `app/route-map/page.tsx`
- Modify: `app/life-abroad/page.tsx`
- Modify: `app/career/page.tsx`
- Modify: `app/ielts/page.tsx`
- Modify: `app/components/deferred-page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: activity-progress, Today, library-save, and Portfolio IndexedDB records.
- Produces: honest Archive summaries and editorial preview layouts for Route Map and Life Abroad.

- [ ] **Step 1: Add failing route assertions**

Assert `/progress` renders Archive language and does not render the Phase 2 placeholder; assert Route Map and Life Abroad render concrete editorial preview sections rather than the generic deferred card.

- [ ] **Step 2: Run rendered tests and verify failure**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL on the replacement content.

- [ ] **Step 3: Implement Archive**

Read the existing stores defensively, display loading/unavailable/empty/populated states, and summarize evidence without scores, streak pressure, or cross-device claims.

- [ ] **Step 4: Replace generic deferred pages**

Create concise Route Map and Life Abroad editorial previews with concrete future modules, and bring IELTS and Portfolio headers into the same masthead/issue typography while preserving their functional components.

- [ ] **Step 5: Run all verification**

Run: `npm test && npm run lint && npm run validate:artifact`

Expected: all commands PASS.

- [ ] **Step 6: Commit**

```bash
git add app/components/archive-board.tsx app/progress/page.tsx app/route-map/page.tsx app/life-abroad/page.tsx app/career/page.tsx app/ielts/page.tsx app/components/deferred-page.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: complete the editorial archive experience"
```

### Task 5: Publish verified checkpoints

**Files:**
- Verify only: `.openai/hosting.json`

**Interfaces:**
- Consumes: the tested Git commits from Tasks 2–4.
- Produces: immutable Sites versions and verified production URLs.

- [ ] **Step 1: Prepare the first visible-slice checkpoint after Task 2**

Use the Sites lifecycle checkpoint command with a concise message describing the editorial homepage.

- [ ] **Step 2: Save, deploy, and verify the first checkpoint**

Use the exact returned commit and archive/version identifiers. Confirm terminal deployment status before preparing another checkpoint.

- [ ] **Step 3: Prepare the complete-experience checkpoint after Task 4**

Run the lifecycle checkpoint command after the full verification gate passes.

- [ ] **Step 4: Save, deploy, and verify the final checkpoint**

Confirm the deployed version is terminal and preserve the current custom owner-only access mode.
