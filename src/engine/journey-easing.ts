/**
 * Pure motion policy for explicit scene navigation.
 * Scroll-wheel/touch gestures remain native and may interrupt navigation.
 */
export function easeInOutCubic(t: number): number {
  const x = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Longer travel should remain legible, never snap between entire scenes.
 * A single stop typically travels around 2000 CSS pixels.
 */
export function journeyDuration(distance: number, viewportHeight: number): number {
  if (!Number.isFinite(distance) || !Number.isFinite(viewportHeight)) return 2500;
  const screens = Math.abs(distance) / Math.max(1, viewportHeight);
  // 12% quicker than the previous preview without changing cubic easing.
  return Math.round(Math.min(4600, Math.max(2300, 1800 + screens * 780)) / 1.12);
}

/** Detect an external scrollbar, focus or programmatic scroll during wheel easing. */
export function wheelScrollWasInterrupted(actualTop: number, lastAppliedTop: number | null): boolean {
  return lastAppliedTop !== null && Number.isFinite(actualTop) &&
    Math.abs(actualTop - lastAppliedTop) > 80;
}
