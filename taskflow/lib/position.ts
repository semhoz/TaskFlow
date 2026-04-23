import { generateKeyBetween } from "fractional-indexing";

/**
 * Wraps fractional-indexing so drag-and-drop never throws when neighbour
 * positions are lexicographically inverted (e.g. legacy mixed-case keys).
 */
export function safeGenerateKeyBetween(
  a: string | null,
  b: string | null
): string {
  if (a != null && b != null) {
    if (a === b) {
      return generateKeyBetween(a, null);
    }
    if (a > b) {
      return generateKeyBetween(b, a);
    }
  }
  return generateKeyBetween(a, b);
}
