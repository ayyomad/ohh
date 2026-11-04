/**
 * Deterministic hatch pattern per board id.
 *
 * Pure function (no DOM): a hash of the id picks angle/spacing/stroke from
 * fixed ranges, so every board's placeholder is stable across renders and
 * reloads and two boards can't tell each other apart by accident.
 */

export interface HatchPattern {
  angle: number;
  spacing: number;
  strokeWidth: number;
}

const ANGLES = [30, 45, 60, 120, 135, 150] as const;
const SPACING_MIN = 6;
const SPACING_RANGE = 7; // 6..12
const STROKE_WIDTHS = [1, 2] as const;

/* FNV-1a: tiny, dependency-free, stable across sessions. */
function hashId(id: string): number {
  let hash = 0x811c9dc5;
  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function hatchFromId(id: string): HatchPattern {
  const hash = hashId(id);
  const angle = ANGLES[hash % ANGLES.length];
  const rest = Math.floor(hash / ANGLES.length);
  const spacing = SPACING_MIN + (rest % SPACING_RANGE);
  const strokeWidth = STROKE_WIDTHS[Math.floor(rest / SPACING_RANGE) % STROKE_WIDTHS.length];
  return { angle, spacing, strokeWidth };
}
