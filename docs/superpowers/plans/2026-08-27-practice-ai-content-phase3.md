# Practice, AI, and Content Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore an actionable daily-practice home, add a real Movie/Music learning library and selection tools, and connect honest AI-assisted planning, writing, and speaking feedback.

**Architecture:** Keep the GitHub Pages frontend statically exportable and preserve device-local IndexedDB storage. Split new work into focused domain modules: cultural content, language tools, AI contracts/client, and practice records. Route AI through one Supabase Edge Function so provider secrets never enter the public bundle; all non-AI learning flows retain deterministic fallbacks.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vinext/Vite, IndexedDB, Node test runner, Supabase Edge Functions, OpenAI Responses and transcription APIs, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-27-practice-ai-content-phase3-design.md`

## Global Constraints

- Structural page background is exactly `#FAFAFA`.
- The first home working area is `TODAY'S PRACTICE`; editorial features follow it.
- Every control-looking element works; unfinished ideas are non-interactive `COMING NEXT` labels.
- The library contains at least 50 entries, including at least 15 Music and 15 Movie entries.
- Use only official or reputable source URLs, original summaries/prompts, and short learning snippets; do not copy lyrics, scripts, or full transcripts.
- Dictionary and device-local tools work without AI.
- AI scores are explicitly unofficial and never claim capabilities the model did not perform.
- No provider secret is included in the GitHub Pages bundle.
- Both `npm test` and `GITHUB_ACTIONS=true npx next build` must pass.

---

## File Structure

- `app/lib/editorial-types.ts`: shared editorial content contracts without circular imports.
- `app/lib/cultural-library.ts`: Movie/Music records and content-count invariants.
- `app/lib/editorial.ts`: merges cultural records into the existing five-mode index.
- `app/lib/language-tools.ts`: dictionary response normalization and selection helpers.
- `app/lib/ai-contracts.ts`: request/response types and runtime validators shared by UI tests and the gateway contract.
- `app/lib/ai-client.ts`: browser client for AI status and capability requests.
- `app/components/language-tool-popover.tsx`: keyboard- and selection-accessible Define/Pronounce/Explain/Translate/Save UI.
- `app/components/media-learning-panel.tsx`: official YouTube embed, fallback link, and selectable companion text.
- `app/components/practice-studio.tsx`: writing and speaking input, persistence, feedback, and disconnected states.
- `app/practice/writing/page.tsx`, `app/practice/speaking/page.tsx`: focused practice routes.
- `supabase/functions/ai-practice/index.ts`: secret-bearing provider gateway with validation, CORS, size limits, and timeouts.

---

### Task 1: Restore the Home as a Working Daily-Practice Surface

**Files:**
- Modify: `app/lib/models.ts`
- Modify: `app/lib/today.ts`
- Modify: `app/components/today-board.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/domain.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `TodayTask.href: string` for direct task navigation.
- Produces: home ordering contract `TODAY'S PRACTICE` before `NIGHT RADIO`.
- Consumes: existing `buildTodayPlan(mode: PlanMode): TodayTask[]` and device-local completion state.

- [ ] **Step 1: Write failing domain and rendered-route tests**

Add assertions that every daily task has a local route and the home renders practice before editorial content:

```js
for (const mode of [10, 45, 90]) {
  assert.ok(buildTodayPlan(mode).every((task) => task.href.startsWith("/")));
}

const practiceIndex = html.indexOf("TODAY'S PRACTICE");
const issueIndex = html.indexOf("NIGHT RADIO");
assert.ok(practiceIndex >= 0 && issueIndex > practiceIndex);
assert.match(html, /OPEN PRACTICE/);
```

- [ ] **Step 2: Run tests and verify the new expectations fail**

Run: `node --test tests/domain.test.mjs && npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because `TodayTask.href` and the new home heading/order do not exist.

- [ ] **Step 3: Add real destinations to the daily plan**

Extend `TodayTask`:

```ts
export type TodayTask = {
  id: string;
  module: TodayModule;
  title: string;
  detail: string;
  minutes: number;
  accent: "blue" | "coral" | "sage";
  href: string;
};
```

Use `/practice/speaking/`, `/practice/writing/`, `/ielts/`, `/career/`, `/language-lab/`, and `/route-map/` as appropriate. Render `OPEN PRACTICE ↗` as a real link on each task card while retaining completion and replacement controls.

- [ ] **Step 4: Reorder the home and remove decorative dead links**

Move the Today section immediately below the masthead-introduction line and label it `TODAY'S PRACTICE`. Move `NIGHT RADIO` and issue selections below it. Link editorial selections only to implemented routes; render unavailable ideas as:

```tsx
<span className="coming-label" aria-label="Coming next">COMING NEXT</span>
```

Set the shared neutral tokens to:

```css
:root {
  --paper: #fafafa;
  --paper-strong: #ffffff;
  --ink: #171717;
  --muted: #666666;
  --line: #d8d8d8;
}
```

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tests/domain.test.mjs && npm run build && node --test tests/rendered-html.test.mjs`

Expected: PASS.

```bash
git add app/lib/models.ts app/lib/today.ts app/components/today-board.tsx app/page.tsx app/globals.css tests/domain.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: restore daily practice as the home priority"
```

---

### Task 2: Add a Materially Larger Movie and Music Library

**Files:**
- Create: `app/lib/editorial-types.ts`
- Create: `app/lib/cultural-library.ts`
- Modify: `app/lib/editorial.ts`
- Modify: `tests/domain.test.mjs`

**Interfaces:**
- Produces: shared `EditorialPrompts`, `LearningLine`, `ContentKind`, and `SourceKind` types from `editorial-types.ts`.
- Produces: `CulturalActivity` and `CULTURAL_ACTIVITIES`.
- Produces: `ContentKind = "Movie" | "Music" | "Design" | "Language" | "Culture"`.
- Produces optional media fields consumed by Task 3: `youtubeId`, `sourceKind`, and `learningText`.
- Consumes: `EditorialActivity` and the existing five `LabMode` values.

- [ ] **Step 1: Write failing content-invariant tests**

```js
assert.ok(EDITORIAL_ACTIVITIES.length >= 50);
assert.ok(EDITORIAL_ACTIVITIES.filter((item) => item.contentKind === "Music").length >= 15);
assert.ok(EDITORIAL_ACTIVITIES.filter((item) => item.contentKind === "Movie").length >= 15);
assert.ok(EDITORIAL_ACTIVITIES.every((item) => item.sourceUrl.startsWith("https://")));
assert.ok(EDITORIAL_ACTIVITIES.every((item) => item.learningText.length >= 2));
assert.ok(EDITORIAL_ACTIVITIES.every((item) => !/full transcript|full lyrics/i.test(item.usageBasis)));
```

- [ ] **Step 2: Run the domain test and verify it fails**

Run: `node --test tests/domain.test.mjs`

Expected: FAIL on total, Movie/Music counts, and missing media fields.

- [ ] **Step 3: Define the cultural content contract**

```ts
export type CulturalActivity = {
  id: string;
  mode: LabMode;
  contentKind: "Movie" | "Music";
  format: string;
  title: string;
  publisher: string;
  level: SeedLevel;
  minutes: 5 | 15 | 30;
  sourceUrl: string;
  sourceKind: "youtube" | "external";
  youtubeId?: string;
  editorialNote: string;
  learningText: Array<{ id: string; text: string }>;
  prompts: EditorialPrompts;
  usageBasis: string;
  marginaliaLabel: "Fictional editorial marginalia";
  marginalia: string[];
};
```

Keep these shared contracts in `editorial-types.ts`; both `cultural-library.ts` and `editorial.ts` import from that file so neither imports the other.

Create at least 30 rights-aware records using official artist, film distributor, studio, festival, publisher, or creator channels. Use original two- or three-sentence learning text; do not include lyrics or copied dialogue.

- [ ] **Step 4: Merge cultural records into the existing index**

Extend `EditorialActivity` with `contentKind`, `sourceKind`, `youtubeId?`, and `learningText`. Map legacy seed activities to `Design`, `Language`, or `Culture`, then append `CULTURAL_ACTIVITIES`:

```ts
export const EDITORIAL_ACTIVITIES: EditorialActivity[] = [
  ...SEED_LIBRARY.map(toEditorialActivity),
  ...CULTURAL_ACTIVITIES,
];
```

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/domain.test.mjs`

Expected: PASS with at least 50 unique activities and both category minimums satisfied.

```bash
git add app/lib/editorial-types.ts app/lib/cultural-library.ts app/lib/editorial.ts tests/domain.test.mjs
git commit -m "feat: add real movie and music learning collections"
```

---

### Task 3: Render Official Media and Honest Fallback States

**Files:**
- Create: `app/components/media-learning-panel.tsx`
- Modify: `app/components/editorial-lab.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `EditorialActivity.sourceKind`, `youtubeId`, `sourceUrl`, and `learningText`.
- Produces: `.learning-copy[data-language-tools-root]`, consumed by Task 4.
- Produces: labeled `OPEN OFFICIAL SOURCE` fallback for every activity.

- [ ] **Step 1: Write a failing rendered-route test**

```js
assert.match(html, /MOVIE/);
assert.match(html, /MUSIC/);
assert.match(html, /OPEN OFFICIAL SOURCE/);
assert.match(html, /data-language-tools-root/);
```

- [ ] **Step 2: Build and verify the test fails**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because the dossier has no media panel or selectable companion text.

- [ ] **Step 3: Add the focused media component**

```tsx
export function MediaLearningPanel({ activity }: { activity: EditorialActivity }) {
  return (
    <section className="media-learning-panel">
      {activity.sourceKind === "youtube" && activity.youtubeId ? (
        <iframe
          title={`${activity.title} — official video`}
          src={`https://www.youtube-nocookie.com/embed/${activity.youtubeId}`}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <p className="media-external-state">THIS SOURCE OPENS ON ITS OFFICIAL SITE.</p>
      )}
      <div className="learning-copy" data-language-tools-root>
        {activity.learningText.map((line) => <p key={line.id}>{line.text}</p>)}
      </div>
      <a href={activity.sourceUrl} target="_blank" rel="noreferrer">OPEN OFFICIAL SOURCE ↗</a>
    </section>
  );
}
```

- [ ] **Step 4: Integrate content-kind filters and deep selection**

Add `ALL / MOVIE / MUSIC / DESIGN / LANGUAGE / CULTURE` filters under the mode strip. Read `activity` from `window.location.search` after mount; select the matching activity when valid and fall back to the first result when invalid.

- [ ] **Step 5: Run tests and commit**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: PASS.

```bash
git add app/components/media-learning-panel.tsx app/components/editorial-lab.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: turn cultural sources into playable learning dossiers"
```

---

### Task 4: Add Selection-Based Dictionary and Language Tools

**Files:**
- Create: `app/lib/language-tools.ts`
- Create: `app/components/language-tool-popover.tsx`
- Modify: `app/components/editorial-lab.tsx`
- Modify: `app/lib/models.ts`
- Modify: `app/lib/indexed-db.ts`
- Modify: `app/globals.css`
- Modify: `tests/domain.test.mjs`
- Modify: `tests/indexed-db.test.mjs`

**Interfaces:**
- Produces: `normalizeSelection(text: string): string`.
- Produces: `normalizeDictionaryResponse(input: unknown): DictionaryEntry | null`.
- Produces: `VocabularyRecord` stored in `vocabulary`.
- Consumes: Task 3's `[data-language-tools-root]` learning text.
- Defers AI actions to Task 5's `requestAi()` while dictionary and Save remain independent.

- [ ] **Step 1: Write failing domain and persistence tests**

```js
assert.equal(normalizeSelection("  visual\n rhythm  "), "visual rhythm");
assert.equal(normalizeSelection("x".repeat(400)).length, 280);

const entry = normalizeDictionaryResponse([{ word: "rhythm", phonetic: "/ˈrɪðəm/", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "a repeated pattern" }] }] }]);
assert.equal(entry.word, "rhythm");
assert.equal(entry.meanings[0].definition, "a repeated pattern");

await repository.putRecord("vocabulary", { id: "word-1", selection: "visual rhythm", sourceActivityId: "movie-1", context: "The film builds a visual rhythm.", createdAt: 10 });
assert.equal((await repository.getRecord("vocabulary", "word-1")).selection, "visual rhythm");
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `node --test tests/domain.test.mjs tests/indexed-db.test.mjs`

Expected: FAIL because helpers and the `vocabulary` store do not exist.

- [ ] **Step 3: Implement dictionary normalization and additive storage**

Add `vocabulary`, `writing-practice`, `speaking-practice`, and `generated-plans` to `StoreName`, increment `DATABASE_VERSION` to `3`, and preserve all existing stores.

Implement dictionary lookup against `https://api.dictionaryapi.dev/api/v2/entries/en/<encoded-word>` with an 8-second `AbortController` timeout. Normalize only the first three meanings and first audio URL.

- [ ] **Step 4: Build the accessible popover**

The component listens for `selectionchange`, but only accepts selections inside its supplied root element. It exposes the same actions through a persistent `LANGUAGE TOOLS` button for keyboard users. Use these explicit states:

```ts
type ToolState = "idle" | "dictionary-loading" | "ai-loading" | "saved" | "error";
type ToolAction = "define" | "pronounce" | "explain" | "translate" | "save";
```

Until Task 5 connects AI, Explain and Translate show `AI NOT CONNECTED`; Define, Pronounce, and Save remain usable.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/domain.test.mjs tests/indexed-db.test.mjs && npm run build`

Expected: PASS.

```bash
git add app/lib/language-tools.ts app/components/language-tool-popover.tsx app/components/editorial-lab.tsx app/lib/models.ts app/lib/indexed-db.ts app/globals.css tests/domain.test.mjs tests/indexed-db.test.mjs
git commit -m "feat: add contextual dictionary and saved language tools"
```

---

### Task 5: Add AI Contracts, Honest Status, and Practice Studios

**Files:**
- Create: `app/lib/ai-contracts.ts`
- Create: `app/lib/ai-client.ts`
- Create: `app/components/practice-studio.tsx`
- Create: `app/practice/writing/page.tsx`
- Create: `app/practice/speaking/page.tsx`
- Modify: `app/components/language-tool-popover.tsx`
- Modify: `app/components/today-board.tsx`
- Modify: `app/globals.css`
- Modify: `tests/domain.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `requestAi<T>(request: AiRequest): Promise<AiResponse<T>>`.
- Produces: `validateGeneratedPlan`, `validateWritingFeedback`, and `validateSpeakingFeedback`.
- Produces: static practice routes consumed by Task 1 links.
- Consumes: `VocabularyRecord` and practice stores from Task 4.

- [ ] **Step 1: Write failing validator tests**

```js
assert.equal(validateGeneratedPlan({ tasks: [{ id: "a", module: "Speaking", title: "Retell", detail: "Retell one clip.", minutes: 10, href: "/practice/speaking/", accent: "coral" }] }, 10), true);
assert.equal(validateGeneratedPlan({ tasks: [{ minutes: 20 }] }, 10), false);
assert.equal(validateWritingFeedback({ unofficial: true, bandRange: "5.5–6.0", criteria: [], corrections: [], nextActions: [] }), true);
assert.equal(validateSpeakingFeedback({ unofficial: true, audioAnalyzed: false, pronunciation: null, observations: [], alternatives: [], nextAttempt: "Try again." }), true);
```

- [ ] **Step 2: Run the domain test and verify it fails**

Run: `node --test tests/domain.test.mjs`

Expected: FAIL because the validators do not exist.

- [ ] **Step 3: Implement strict contracts and the browser client**

Use a discriminated request union:

```ts
export type AiRequest =
  | { capability: "daily-plan"; minutes: PlanMode; focus: string; evidence: string[] }
  | { capability: "writing-feedback"; prompt: string; response: string; taskType: "ielts" | "work" | "general" }
  | { capability: "speaking-feedback"; prompt: string; transcript: string; audioAnalyzed: false }
  | { capability: "explain"; selection: string; context: string }
  | { capability: "translate"; selection: string; context: string };
```

`requestAi` reads `NEXT_PUBLIC_AI_GATEWAY_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If either is absent, it returns `{ ok: false, code: "not-connected" }` without making a request. Apply a 25-second timeout and validate the response before returning it to UI code.

- [ ] **Step 4: Build Writing and Speaking practice surfaces**

Writing provides prompt, task type, draft editor, word count, Save, and `GET AI FEEDBACK`. Speaking provides prompt, browser recording when available, speech-to-text when available, transcript editor, Save, and `GET AI FEEDBACK`. Both preserve input on failure and render `AI NOT CONNECTED` when configuration is absent.

Feedback headings are fixed and semantic. Writing uses `Unofficial estimate`, `What works`, `Priority corrections`, and `Next practice`. Speaking uses `Fluency and clarity`, `Vocabulary and grammar`, `Natural alternatives`, and `Next attempt`. Pronunciation is omitted when `audioAnalyzed` is false.

- [ ] **Step 5: Connect AI reshaping and language actions**

Add `RESHAPE WITH AI` to Today. Submit the current mode and a maximum of five short local evidence strings; replace tasks only after `validateGeneratedPlan` succeeds. Connect Explain and Translate to `requestAi` and retain their disconnected fallback.

- [ ] **Step 6: Add rendered-route tests and commit**

```js
const writingHtml = await renderRoute("/practice/writing/");
assert.match(writingHtml, /WRITING STUDIO/);
assert.match(writingHtml, /AI NOT CONNECTED/);
const speakingHtml = await renderRoute("/practice/speaking/");
assert.match(speakingHtml, /SPEAKING STUDIO/);
assert.doesNotMatch(speakingHtml, /pronunciation score/i);
```

Run: `node --test tests/domain.test.mjs && npm run build && node --test tests/rendered-html.test.mjs`

Expected: PASS.

```bash
git add app/lib/ai-contracts.ts app/lib/ai-client.ts app/components/practice-studio.tsx app/practice/writing/page.tsx app/practice/speaking/page.tsx app/components/language-tool-popover.tsx app/components/today-board.tsx app/globals.css tests/domain.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: add honest ai-ready writing and speaking studios"
```

---

### Task 6: Implement and Verify the Supabase AI Gateway

**Files:**
- Create: `supabase/functions/ai-practice/index.ts`
- Create: `supabase/functions/_shared/ai-contracts.ts`
- Create: `tests/ai-gateway.test.mjs`
- Create: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 5 request union and returns the corresponding validated response.
- Consumes server secrets: `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL`, and `OPENAI_TRANSCRIBE_MODEL`.
- Produces public capability endpoint configured as `NEXT_PUBLIC_AI_GATEWAY_URL`.

- [ ] **Step 1: Write failing gateway contract tests**

The tests import pure helpers from `_shared/ai-contracts.ts` and assert:

```js
assert.equal(parseGatewayRequest({ capability: "daily-plan", minutes: 45, focus: "speaking", evidence: [] }).ok, true);
assert.equal(parseGatewayRequest({ capability: "writing-feedback", response: "" }).ok, false);
assert.equal(parseGatewayRequest({ capability: "speaking-feedback", transcript: "x".repeat(20001) }).ok, false);
assert.deepEqual(corsHeaders("https://fuwufu33jovnn-cell.github.io"), {
  "Access-Control-Allow-Origin": "https://fuwufu33jovnn-cell.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
```

- [ ] **Step 2: Run and verify the tests fail**

Run: `node --test tests/ai-gateway.test.mjs`

Expected: FAIL because the shared gateway helpers do not exist.

- [ ] **Step 3: Implement validation, CORS, limits, and provider calls**

Allow only the GitHub Pages origin and the local development origin. Reject unknown capabilities, requests above 64 KB, writing responses above 12,000 characters, and transcripts above 20,000 characters. Abort provider calls after 25 seconds. Return JSON errors with `400`, `413`, `429`, `502`, or `504` as appropriate.

Use the OpenAI Responses API for text capabilities with JSON-schema structured output. Never request or return an official IELTS score. For transcript-only speaking requests, force `audioAnalyzed: false` and `pronunciation: null`.

- [ ] **Step 4: Document exact configuration without storing secrets**

Add only variable names to `.env.example`:

```dotenv
NEXT_PUBLIC_AI_GATEWAY_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-5-mini
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

Document that `OPENAI_*` variables belong only in Supabase Function secrets. Do not place real values in `.env`, the repository, build logs, or chat.

- [ ] **Step 5: Run tests, then verify or report the live-connection gate**

Run: `node --test tests/ai-gateway.test.mjs tests/domain.test.mjs && npm test && GITHUB_ACTIONS=true npx next build`

Expected: PASS.

If an authorized Supabase project and OpenAI API key are already configured, deploy the function, set the two public frontend variables, and call the gateway status endpoint. If either is absent, stop at the honest `AI NOT CONNECTED` UI and ask the user to connect/configure it; do not fabricate a successful model connection.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/ai-practice/index.ts supabase/functions/_shared/ai-contracts.ts tests/ai-gateway.test.mjs .env.example README.md
git commit -m "feat: add the secure ai practice gateway"
```

---

### Task 7: Full Verification and Public GitHub Pages Release

**Files:**
- Modify only source defects discovered by verification.

**Interfaces:**
- Consumes all earlier tasks.
- Produces one verified GitHub Pages release; Sites remains a saved backup and is not the user-facing link.

- [ ] **Step 1: Run the complete local verification gate**

Run:

```bash
npm test
node --test tests/domain.test.mjs tests/indexed-db.test.mjs tests/ai-gateway.test.mjs
npm run lint
npm run validate:artifact
GITHUB_ACTIONS=true npx next build
```

Expected: every command exits `0`; lint has no errors; both build targets list all routes.

- [ ] **Step 2: Verify requirements from generated output**

Serve `out/` locally and assert that the static HTML contains `TODAY'S PRACTICE`, Movie and Music filters, the two practice routes, and no bundled `OPENAI_API_KEY`. Confirm that the page background CSS resolves to `#FAFAFA`.

- [ ] **Step 3: Publish the tested commit to the existing public repository**

Update `fuwufu33jovnn-cell/lucid_dream_` on `main` using the existing GitHub connection. Do not publish a `chatgpt.site` URL as the user-facing deliverable.

- [ ] **Step 4: Verify GitHub Actions and the primary flow**

Confirm the Pages workflow completes successfully. Open the exact deployed URL and verify:

1. Home shows Today's Practice before Night Radio.
2. A daily task opens its real practice route.
3. Language Lab filters to Movie and Music.
4. An official media dossier shows companion learning text.
5. Selecting text opens language tools; Define/Save work without AI.
6. AI controls show live feedback only if the gateway is verified; otherwise they state `AI NOT CONNECTED`.

- [ ] **Step 5: Commit any verification-only source fix and rerun the entire gate**

If verification required a source fix, add a regression assertion, rerun Step 1, commit with a focused `fix:` message, and redeploy the new tested commit.
