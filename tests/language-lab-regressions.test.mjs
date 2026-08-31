import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Language Lab owns exactly one shared floating study window", async () => {
  const editorial = await readFile(new URL("../app/components/editorial-lab.tsx", import.meta.url), "utf8");
  const media = await readFile(new URL("../app/components/media-learning-panel.tsx", import.meta.url), "utf8");
  const personal = await readFile(new URL("../app/components/personal-media-shelf.tsx", import.meta.url), "utf8");

  const count = [editorial, media, personal]
    .map((source) => (source.match(/<FloatingStudyWindow\b/g) ?? []).length)
    .reduce((sum, value) => sum + value, 0);

  assert.equal(count, 1);
  assert.match(editorial, /<FloatingStudyWindow\b/);
  assert.doesNotMatch(media, /<FloatingStudyWindow\b/);
  assert.doesNotMatch(personal, /<FloatingStudyWindow\b/);
});

test("curated music drawers use concrete embeddable official YouTube videos", async () => {
  const source = await readFile(new URL("../app/lib/cultural-library.ts", import.meta.url), "utf8");

  for (const id of ["yorushika-video", "kiikiii-visual", "illit-visual", "akg-official"]) {
    const entry = source.match(new RegExp(`\\{ id: "${id}"[^\\n]+\\}`))?.[0] ?? "";
    assert.match(entry, /youtubeId:\s*"[^"]+"/, `${id} needs a concrete YouTube video id`);
    assert.match(entry, /youtube\.com\/watch\?v=/, `${id} needs a direct watch URL`);
  }
});

test("non-embeddable sources render as a clear source card instead of a fake player", async () => {
  const source = await readFile(new URL("../app/components/media-learning-panel.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /media-source-card/);
  assert.match(source, /OPEN OFFICIAL SOURCE/);
  assert.match(css, /\.media-source-card\b/);
});
