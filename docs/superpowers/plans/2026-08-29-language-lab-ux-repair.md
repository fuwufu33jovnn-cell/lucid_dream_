# Language Lab UX Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair media, filtering, exam-mode, and viewport UX while adding a genuine floating study surface.

**Architecture:** Keep personal data in IndexedDB and build the new behavior as small pure helpers plus client components. Use one reusable floating study window for personal and curated media; subtitle text is user-owned study text until an AI gateway is configured.

**Tech Stack:** React, TypeScript, vinext/Vite, IndexedDB, CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-08-29-language-lab-ux-repair-design.md`

## Global Constraints

- Never download or copy YouTube/Spotify media.
- Never claim unavailable automatic captions or AI translation.
- No document-level horizontal overflow at 390px, 768px, 1280px, or 1920px.
- Preserve the current public GitHub Pages path prefix.

---

### Task 1: Filter and recent-import domain helpers

**Files:**
- Modify: `app/lib/editorial.ts`
- Modify: `app/lib/personal-media.ts`
- Test: `tests/domain.test.mjs`

**Interfaces:**
- Produces: `availableContentKinds(items, mode)` and `recentPersonalMedia(items, now, days)`.

- [ ] Write failing tests for parent-child filters and seven-day imports.
- [ ] Run the domain tests and confirm failure.
- [ ] Implement both pure helpers.
- [ ] Run the domain tests and confirm success.

### Task 2: Stable Language Lab hierarchy

**Files:**
- Modify: `app/components/editorial-lab.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `availableContentKinds`.

- [ ] Render only valid children for the active mode.
- [ ] Reset the child to All on parent changes without cross-mode jumps.
- [ ] Keep empty queries stable and add a one-click clear-filters action.

### Task 3: Recent imports and floating media study window

**Files:**
- Create: `app/components/floating-study-window.tsx`
- Modify: `app/components/personal-media-shelf.tsx`
- Modify: `app/components/media-learning-panel.tsx`
- Modify: `app/components/language-tool-popover.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `FloatingStudyWindow({ activityId, title, initialText })`.
- Consumes: local dictionary, vocabulary persistence, optional AI explain/translate gateway.

- [ ] Add rendered-contract tests for recent imports, subtitle modes, and movable/resizable helper copy.
- [ ] Build the reusable window using Pointer Events and CSS resize.
- [ ] Add user-owned study transcript text and English/Chinese/bilingual display controls.
- [ ] Mount it beside imported and curated media.

### Task 4: Responsive media and viewport repair

**Files:**
- Modify: `app/globals.css`

- [ ] Make embeds aspect-ratio wrappers with no fixed height conflicts.
- [ ] Constrain dossier headings and grid children with `min-width: 0` and wrapping.
- [ ] Add global overflow guards and responsive Lab/IELTS layouts.

### Task 5: Practice and Mock exam modes

**Files:**
- Modify: `app/lib/exam.ts`
- Modify: `app/components/exam-workspace.tsx`
- Modify: `app/globals.css`
- Test: `tests/domain.test.mjs`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: snapshots with `mode`, `pausedAt`, and `pausedRemainingSeconds`.

- [ ] Test pausable practice snapshots and strict mock snapshots.
- [ ] Add a two-mode launch selector.
- [ ] Implement pause/resume only for Practice.
- [ ] Label the running mode clearly.

### Task 6: Verification and publication

**Files:**
- Verify: all tests and production build

- [ ] Run domain, persistence, gateway, rendered-page tests, and production build.
- [ ] Verify at desktop and mobile viewport sizes.
- [ ] Publish to GitHub Pages and verify the public homepage and Language Lab URLs.

