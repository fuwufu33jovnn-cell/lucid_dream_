export const LAUNCHER_SIZE = 44;
export const LAUNCHER_GUTTER = 10;
export const LAUNCHER_STORAGE_KEY = "lucid-dream-study-launcher-position";

export function hasLauncherMoved(start, current, threshold = 6) {
  return Math.hypot(current.x - start.x, current.y - start.y) >= threshold;
}

export function clampLauncherPosition(position, viewport) {
  return {
    x: Math.min(Math.max(position.x, LAUNCHER_GUTTER), Math.max(LAUNCHER_GUTTER, viewport.width - LAUNCHER_SIZE - LAUNCHER_GUTTER)),
    y: Math.min(Math.max(position.y, LAUNCHER_GUTTER), Math.max(LAUNCHER_GUTTER, viewport.height - LAUNCHER_SIZE - LAUNCHER_GUTTER)),
  };
}

export function snapLauncherPosition(position, viewport) {
  const clamped = clampLauncherPosition(position, viewport);
  const midpoint = (viewport.width - LAUNCHER_SIZE) / 2;
  return { ...clamped, x: clamped.x <= midpoint ? LAUNCHER_GUTTER : viewport.width - LAUNCHER_SIZE - LAUNCHER_GUTTER };
}
