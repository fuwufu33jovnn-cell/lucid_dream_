# LUCID DREAM Editorial UI Phase 2 Design

**Approved direction:** 2026-08-27  
**Product:** Personal English culture magazine and practical learning lab

## Goal

Replace the current dashboard-like presentation with an editorial web identity while preserving the working learning tools. The new experience should invite browsing first, then turn cultural content into small, concrete English outputs.

## Scope

This phase delivers four connected surfaces:

1. **Editorial home:** a monthly-issue composition that combines a featured cultural story, listening and film selections, collected language, and the existing Today plan.
2. **Language Lab:** five primary modes—Watch, Listen, Read, Culture, and Random—with film and music promoted to first-class content.
3. **Activity detail flow:** Notice, Words, Shadow, and Talk steps, device-local notes and completion state, plus an explicitly fictional editorial Marginalia reveal after completion.
4. **Archive:** a functional replacement for the empty Progress page, summarizing completed activities, saved material, Today evidence, and portfolio progress stored on the current device.

The existing IELTS and Portfolio tools remain functional and receive the shared typography, navigation, spacing, and shape language. Route Map and Life Abroad become informative editorial previews; they do not claim capabilities that do not exist.

## Information Architecture

The fixed left rail is replaced by a compact masthead and horizontal section index. Desktop navigation keeps all existing destinations visible without making them dominate the page. Mobile navigation wraps into a concise directory.

- Home / current issue
- IELTS / Focus test
- Language Lab
- Portfolio
- Route Map
- Archive
- Life Abroad

Language Lab categories are content modes rather than academic subject filters. Level and duration remain secondary filters so they do not lead the experience.

## Visual System

The visual thesis is **independent culture magazine meets personal field notebook**.

- Cold off-white paper, charcoal ink, restrained cobalt and acid-yellow accents.
- Rectangular content frames, hairline rules, asymmetric editorial grids, large serif display type, compact sans-serif metadata.
- Rounded shapes appear only for status, touch controls, and occasional special marks; cards and structural containers remain square.
- No generic gradient hero, glass panels, floating dashboard cards, decorative emoji icons, or repeated icon-title-description modules.
- Motion is limited to purposeful reveals, drawer transitions, hover crops, and the Marginalia sequence; reduced-motion settings disable nonessential movement.

The first issue is **Night Radio / Issue 08**. It establishes the visual system without requiring future monthly content automation.

## Core Flows

### Home

The first viewport contains the masthead, issue identity, one editorial feature, one listening selection, and a visible entry into today's practice. The Today plan remains interactive and device-saved but appears as part of the issue rather than a dashboard summary.

### Language Lab

Selecting a mode filters the editorial index. Search, level, and duration remain available in a compact utility row. Selecting an item opens its learning dossier instead of immediately sending the user to an external site.

### Activity Detail

The dossier presents source context and four optional output steps:

1. Notice three expressions or visual/verbal details.
2. Save one useful word or sentence.
3. Shadow or repeat a short, user-selected excerpt without storing copyrighted source text by default.
4. Record a written 60-second speaking outline.

The user's notes and completion state are stored in IndexedDB. External publisher content opens in a separate tab. The app stores only metadata, original prompts, and user-created notes.

Completing an activity reveals **Marginalia**, a collage-like panel of short prewritten editorial annotations. It is labeled as fictional editorial material and never presented as genuine user reviews.

### Archive

Archive reads existing local records and displays honest empty, partial, and completed states. It does not invent streaks, rankings, scores, or cross-device synchronization.

## Content Model

Existing rights-aware seed records are migrated into the five new modes. New film and music entries use metadata, original descriptions, original prompts, and outbound official or publisher links. No lyrics, transcripts, full articles, or unlicensed stills are copied into the application.

Each activity has an ID, mode, format, title, publisher or creator, level, duration, source URL, original editorial note, prompts for the four learning steps, usage basis, and optional fictional Marginalia entries.

## Data and Failure States

IndexedDB remains the device-local persistence layer. A new activity-progress record stores notes, saved language, speaking outline, completion state, and timestamps. Existing Today, IELTS, library-save, and portfolio records remain compatible.

If IndexedDB is unavailable, reading and external links still work. Editing controls display a clear warning and never claim that work was saved. Empty Archive states explain what action will create each type of evidence.

## Accessibility and Responsive Behavior

- Semantic landmarks and heading order across every route.
- Keyboard-operable navigation, filters, drawers, and completion controls.
- Visible focus states and sufficient text/background contrast.
- Touch targets remain at least 44 pixels where controls are dense.
- Editorial asymmetry collapses into a deliberate single-column reading order on narrow screens.
- IELTS retains its calm split-pane desktop mode and usable stacked mobile fallback.

## Verification

- Domain tests cover mode filtering, activity progress records, and Archive summaries.
- Rendered-route tests cover the masthead, current issue, five Language Lab modes, and public access behavior.
- Existing Today, IELTS, seed-rights, and Portfolio tests continue to pass.
- Production build and artifact validation must pass before a new checkpoint is published.

## Explicitly Deferred

- AI speaking assessment, transcription, or automatic IELTS band estimates.
- Real public community, comments, profiles, or social features.
- Monthly issue CMS or automatic issue rotation.
- Cross-device synchronization and uploads.
- Full Route Map and Life Abroad simulations.
