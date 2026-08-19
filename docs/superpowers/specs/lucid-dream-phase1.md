# LUCID DREAM Phase 1 Build Specification

**Approved:** 2026-08-18  
**Product:** Private overseas-career and English-learning web app  
**Primary route:** Singapore/APAC  
**Primary discipline:** Digital media art

## Scope

Phase 1 ships four working surfaces:

1. **Today:** editable 10-, 45-, and 90-minute plans with calm completion tracking.
2. **IELTS Exam:** a computer-test-style Reading practice with timer, passage/question split view, navigation, automatic IndexedDB checkpoints, reload recovery, and explicit saved status.
3. **Language Lab:** 24 rights-reviewed seed activities using publisher-hosted links or embeds and original LUCID DREAM prompts.
4. **Portfolio Walkthrough:** a digital-media case-study builder and timed English rehearsal covering brief, pain point, design choices, design system, iteration, and impact.

The seven-item product navigation remains visible. Route Map, Progress, and Life Abroad receive honest Phase 2/3 preview states rather than fake functionality.

## Deliberately deferred

- Web Push and device-level scheduled reminders;
- automatic exchange-rate synchronization;
- high-pressure Life Abroad simulations;
- private 100 MB+ portfolio asset upload;
- AI speaking scoring, transcription, and numeric IELTS band estimates;
- public community, rankings, or social profiles.

## Data model

Active exam state, Today completion state, selected time mode, library saves, and portfolio drafts are device-local IndexedDB records. LocalStorage is not used for exam answers or drafts. The first hosted checkpoint is private through ChatGPT sign-in; cross-device data synchronization remains a later persistence milestone and must not be implied by the UI.

## Content and copyright

The IELTS passage and questions are original realistic practice material, never labeled as an official past paper. Seed activities store metadata, original prompts, and outbound links or authorized embeds. They do not copy full transcripts, articles, lyrics, book chapters, portfolio pages, or conference videos.

## Visual direction

Use the approved combination of clear editorial hierarchy and one restrained handwritten-style motivational line. The interface should feel calm, slightly dreamlike, and professional: warm paper background, deep ink, muted blue, soft coral, crisp grid, large readable exam text, and minimal decoration.

## Platform acceptance

- Windows 10/11: current Chrome and Edge at 1280×720 and 1440×900;
- macOS: current Chrome and Safari;
- mobile: current Safari and Chrome for Today, Language Lab, and Portfolio; IELTS remains usable but recommends desktop;
- keyboard navigation, visible focus, reduced-motion support, and 200% zoom without blocked controls;
- no OS-specific paths, fonts, shortcuts, or Safari-only APIs;
- IndexedDB failure produces a visible warning and blocks strict exam mode rather than pretending answers are protected.

