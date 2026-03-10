/**
 * Generic fuzzy scoring utility.
 *
 * Extracted from `features/slash-command/model/fuzzyMatch.ts` so it can be
 * reused across the codebase (e.g. prompt-history Ctrl+R search).
 *
 * Scoring:
 * - Exact prefix: 100 + queryLength (fast path)
 * - Prefix match: +15 for first char at position 0
 * - Word boundary: +10 when match starts after whitespace/separator
 * - Consecutive: +5 for each consecutive matched char
 * - Base: +1 per matched char
 */
export function fuzzyScore(
  query: string,
  target: string,
): { score: number; indices: number[] } | null {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Fast path: exact prefix match
  if (targetLower.startsWith(queryLower)) {
    return {
      score: 100 + query.length,
      indices: Array.from({ length: query.length }, (_, i) => i),
    };
  }

  // Subsequence matching
  let qi = 0;
  let score = 0;
  const indices: number[] = [];
  let prevMatchIndex = -2;

  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (targetLower[ti] === queryLower[qi]) {
      indices.push(ti);
      score += 1;

      // Consecutive bonus
      if (ti === prevMatchIndex + 1) {
        score += 5;
      }

      // Word boundary bonus
      if (ti === 0 || /[\s\-_]/.test(target[ti - 1] ?? "")) {
        score += 10;
      }

      // Prefix bonus
      if (ti === 0 && qi === 0) {
        score += 15;
      }

      prevMatchIndex = ti;
      qi++;
    }
  }

  // All query chars must be matched
  if (qi < query.length) return null;

  return { score, indices };
}
