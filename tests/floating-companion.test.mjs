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
