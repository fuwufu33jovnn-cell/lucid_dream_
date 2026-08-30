import test from "node:test";
import assert from "node:assert/strict";
import { clampLauncherPosition, hasLauncherMoved, snapLauncherPosition } from "../app/lib/floating-companion.mjs";

test("launcher drag starts only after a six pixel gesture", () => {
  assert.equal(hasLauncherMoved({ x: 10, y: 10 }, { x: 14, y: 13 }), false);
  assert.equal(hasLauncherMoved({ x: 10, y: 10 }, { x: 16, y: 10 }), true);
});

test("launcher remains inside the viewport and snaps to its nearest edge", () => {
  const viewport = { width: 800, height: 600 };
  assert.deepEqual(clampLauncherPosition({ x: -40, y: 900 }, viewport), { x: 10, y: 546 });
  assert.deepEqual(snapLauncherPosition({ x: 120, y: 280 }, viewport), { x: 10, y: 280 });
  assert.deepEqual(snapLauncherPosition({ x: 680, y: 280 }, viewport), { x: 746, y: 280 });
});

test("launcher art inherits the GitHub Pages base path and uses a springy compact interaction", async () => {
  const { readFile } = await import("node:fs/promises");
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const source = await readFile(new URL("../app/components/floating-study-window.tsx", import.meta.url), "utf8");
  assert.match(config, /env:\s*\{[\s\S]*NEXT_PUBLIC_BASE_PATH:\s*githubPagesBasePath/);
  assert.match(css, /\.floating-study-launcher\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s);
  assert.match(css, /@keyframes\s+pomeranian-press/);
  assert.match(css, /cubic-bezier\(\.16,\s*1,\s*\.3,\s*1\)/);
  assert.match(source, /setLauncherAnimating\(true\);\s*setOpen\(\(value\) => !value\);\s*launcherTimer\.current = window\.setTimeout/s);
});
