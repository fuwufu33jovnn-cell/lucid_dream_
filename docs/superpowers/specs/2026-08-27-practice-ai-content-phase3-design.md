# LUCID DREAM Practice, AI, and Content Phase 3 Design

**Approved direction:** 2026-08-27  
**Product:** Personal English practice workspace inside an editorial culture site

## Goal

Repair the imbalance introduced by the editorial redesign. The first viewport must again help the user begin a real daily practice session, while the magazine layer becomes functional cultural navigation instead of decorative links. Add honest AI-assisted writing and speaking feedback, contextual reading tools, and a materially larger Movie/Music library.

## Product Priorities

The implementation order is deliberate:

1. Restore Today's Practice as the primary home flow and remove dead interactions.
2. Add real Movie and Music learning entries with official media sources.
3. Add a selection-based language helper using a dictionary for basic lookup and AI for contextual explanation.
4. Add AI-generated daily tasks and AI feedback for writing and speaking.

The site must remain useful when AI is unavailable. Fixed daily plans, saved notes, dictionary lookup, IELTS practice, Portfolio, and the curated library continue to work independently.

## Home and Daily Practice

The home page keeps the masthead and Issue identity, but the first working area becomes **TODAY'S PRACTICE**. It contains:

- the existing 10, 45, and 90 minute plan selector;
- visible tasks for speaking, IELTS, writing or career English;
- progress and device-local save state;
- direct links to the relevant working surface;
- an optional `RESHAPE WITH AI` action that replaces or adjusts tasks without hiding the deterministic fallback plan.

The Night Radio feature and cultural selections move below the practice area. Every element styled as a link or button must perform a real action. Unimplemented ideas render as plain `COMING NEXT` labels and are not keyboard-focusable.

## Visual Revision

- Set the structural background to `#FAFAFA`, matching the supplied cool white-gray reference.
- Remove the current cream/yellow paper cast from page backgrounds and neutral surfaces.
- Retain charcoal type, gray hairlines, cobalt, and acid-yellow accents only where they communicate hierarchy or state.
- Preserve the square editorial geometry and restrained use of rounded controls.

## Language Lab Content Expansion

The initial target is at least 50 curated entries, including at least 15 Music and 15 Movie entries. Existing design and language sources remain only when they add a distinct learning task.

### Music

Use official music videos, official live sessions, artist interviews, production breakdowns, and publisher-hosted features. Entries provide original English summaries, original prompts, metadata, and a small learning surface. They do not reproduce lyrics.

### Movie

Use official trailers, official clips, filmmaker or cast interviews, and reputable video essays. Entries provide original summaries, discussion prompts, and selected vocabulary. They do not host films, copy scripts, or reproduce long dialogue.

### Media Experience

Embeddable official YouTube sources play inside the dossier. Non-embeddable sources open in a new tab and are labeled accordingly. Missing, blocked, or removed media shows a clear fallback link and never leaves an apparently clickable dead panel.

## Selection-Based Language Helper

The helper appears when the user selects a word, phrase, or sentence inside LUCID DREAM's own learning text. Its actions are:

- `DEFINE`: dictionary definition and part of speech;
- `PRONOUNCE`: phonetic form and available dictionary audio;
- `EXPLAIN`: contextual explanation in simpler English;
- `TRANSLATE`: concise Chinese translation;
- `SAVE`: add the selected language and source context to the device-local vocabulary shelf.

Single-word definitions and pronunciation use a dictionary endpoint so they remain fast and do not consume AI quota. Contextual explanation and translation use the AI gateway. If AI is unavailable, dictionary and Save remain active while AI actions display an honest unavailable state.

Because cross-origin YouTube players cannot expose their caption DOM to the site, the helper operates on the companion learning text beside the player, not on captions inside the external iframe. The app stores only user-selected language and short contextual notes, never a full transcript.

## AI Practice Surfaces

### Writing Studio

The user chooses or receives a task, writes a response, and requests feedback. The result includes:

- an explicitly unofficial IELTS-style estimated band range when the task is IELTS-related;
- Task Response, Coherence, Vocabulary, and Grammar observations;
- prioritized corrections with explanations;
- a revised sample based on the user's own text;
- two or three next-practice actions.

The model must preserve the user's intended meaning and avoid pretending that an automated estimate is an official score.

### Speaking Studio

The user records audio or uses browser speech-to-text when available. The result includes transcript review, fluency, vocabulary, grammar, clarity, more natural alternatives, and a short next attempt. Pronunciation scoring appears only when the configured model actually receives and analyzes audio; transcript-only mode must not claim pronunciation analysis.

### AI Daily Plan

The model receives only the user's selected session length, recent device-local evidence summarized by the client, and requested focus. It returns a validated structured plan that fits the exact time budget. If generation fails or returns invalid data, the existing deterministic plan remains unchanged.

## AI Architecture and Security

The public GitHub Pages frontend must never contain a provider secret. AI requests go through a small Supabase Edge Function gateway so the public site can remain static while provider keys stay server-side. The client sends only the requested capability and the minimum necessary user content.

The gateway exposes five capability routes:

- `daily-plan` for structured task generation;
- `writing-feedback` for rubric feedback;
- `speaking-feedback` for transcript or supported audio feedback.
- `explain` for contextual simpler-English explanation.
- `translate` for concise Chinese translation.

The first provider adapter uses the OpenAI Responses API for planning and text feedback, plus an OpenAI transcription model when audio feedback is enabled. Model names are server-side environment configuration; the client depends on the capability contract rather than a model name. Live AI requires a separately configured OpenAI API key; a ChatGPT subscription alone does not provide API usage. Until the key and Edge Function deployment are verified, the UI must say `AI NOT CONNECTED` rather than simulate a response.

Rate limits, payload size limits, timeout handling, and response-schema validation are enforced in the gateway. User work is not written to a server database in this phase; only device-local storage is used unless the user later asks for account sync.

## Data Model

Add device-local records for:

- vocabulary selections with source activity and surrounding short context;
- writing drafts and feedback snapshots;
- speaking transcripts, local audio references where supported, and feedback snapshots;
- generated daily-plan metadata and timestamps.

Existing Today, IELTS, activity-progress, library, and Portfolio records remain compatible. Schema upgrades are additive.

## Accessibility and Responsive Behavior

- Selection tools are also reachable through a keyboard `LANGUAGE TOOLS` action; hover is not the only path.
- Media embeds have titles and fallback links.
- Recording controls expose clear start, stop, processing, success, and error states.
- AI feedback uses headings and lists rather than color alone.
- The first mobile viewport shows the current plan and at least one actionable task before editorial features.

## Failure States

- Dictionary unavailable: keep Save active and show a retry action.
- AI unavailable or quota exhausted: keep the draft, transcript, and deterministic plan; show configuration status without blocking other tools.
- Media blocked or removed: show source metadata and `OPEN OFFICIAL SOURCE`.
- Browser recording unavailable: allow typed or pasted transcript practice.
- IndexedDB unavailable: tools still work for the current session but clearly state that evidence will not persist.

## Verification

- Domain tests cover expanded content counts, Movie/Music minimums, plan-schema validation, and feedback response validation.
- IndexedDB tests cover vocabulary, writing, speaking, and generated-plan records.
- Rendered-route tests confirm Today's Practice appears before editorial features and dead placeholder links are absent.
- Component tests cover language-tool fallbacks and honest AI-disconnected states.
- Both the Vinext/Sites build and GitHub Pages static export must pass.
- The final public GitHub Pages deployment must be opened and the Home → Language Lab → language helper primary flow verified.

## Explicitly Deferred

- Official IELTS scoring or score guarantees.
- Full lyrics, film scripts, copied transcripts, or unlicensed media hosting.
- Public community profiles, comments, or fabricated real-user reviews.
- Cross-device accounts and server-side history.
- A general-purpose site-wide chatbot.
