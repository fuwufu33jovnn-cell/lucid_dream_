# LUCID DREAM Language Lab UX Repair Design

## Goal

Make media learning usable without full-screen workarounds or repeated scrolling, remove empty filter combinations, distinguish recently imported media, and make IELTS practice feel different from a timed mock.

## Approved requirements

- Media embeds must keep a complete 16:9 viewport and never force horizontal page scrolling.
- Imported media must expose a "recent seven days" shelf and refresh an existing record instead of creating duplicates.
- Imported and curated video learning must use an external floating helper that can be moved and resized.
- The helper provides subtitle display modes: English, Chinese, and bilingual. It must not pretend that arbitrary YouTube captions are available. Users can add their own short study transcript; AI translation remains visibly unavailable until a gateway is connected.
- Mode is the parent filter. Only content collections that exist inside the selected mode are shown. Changing the parent resets the child to All and selects the first visible result without changing to another parent.
- Empty search/filter results remain stable and do not jump to another drawer.
- IELTS launch offers Practice and Mock. Practice can pause and resume its timer; Mock cannot pause.
- Desktop and mobile layouts must fit the viewport without document-level horizontal overflow.

## Non-goals for this checkpoint

- Scraping, downloading, or reproducing arbitrary YouTube/Spotify captions, transcripts, or lyrics.
- Claiming bilingual captions are automatic before an AI gateway or user-provided study transcript exists.
- Audio pronunciation scoring.

