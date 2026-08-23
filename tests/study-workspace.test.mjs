import assert from "node:assert/strict";
import test from "node:test";

import { parseStudySegments, youtubeEmbedUrl } from "../app/lib/study-workspace.ts";

test("official YouTube links become privacy-enhanced embed URLs", () => {
  assert.equal(youtubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=test"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ?t=42"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
});

test("non-YouTube or malformed URLs never become embeds", () => {
  assert.equal(youtubeEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(youtubeEmbedUrl("javascript:alert(1)"), null);
});

test("manual transcript becomes ordered clickable study segments", () => {
  assert.deepEqual(parseStudySegments("First paragraph.\n\nSecond paragraph."), [
    { id: "segment-1", original: "First paragraph." },
    { id: "segment-2", original: "Second paragraph." },
  ]);
});
