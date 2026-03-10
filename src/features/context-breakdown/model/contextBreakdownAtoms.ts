import { atom } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

export interface ContextSegment {
  readonly label: string;
  readonly tokens: number;
  readonly pct: number;
  readonly color: string;
}

/** Color palette for context segments */
const SEGMENT_COLORS = [
  "var(--vsc-chart-blue, #4fc1ff)",
  "var(--vsc-chart-green, #6a9955)",
  "var(--vsc-chart-yellow, #dcdcaa)",
  "var(--vsc-chart-orange, #ce9178)",
  "var(--vsc-chart-red, #f44747)",
] as const;

/**
 * Derives a context breakdown from session meta.
 * Segments: Input tokens, Output tokens, System (estimated), Available.
 *
 * Reuses `contextUsagePctAtom` from context-monitor for consistent
 * overall percentage, and only adds the detailed per-segment view.
 */
export const contextBreakdownAtom = atom<readonly ContextSegment[]>((get) => {
  const meta = get(sessionMetaAtom);
  const maxTokens = meta.max_context_tokens ?? 0;
  if (maxTokens === 0) return [];

  const tokensIn = meta.tokens_in ?? 0;
  const tokensOut = meta.tokens_out ?? 0;
  // Estimate system prompt overhead as ~5% of max or a minimum of 500 tokens.
  // Clamp to 0 when tokensIn + tokensOut exceeds maxTokens.
  const systemEstimate = Math.max(
    0,
    Math.min(Math.max(Math.round(maxTokens * 0.05), 500), maxTokens - tokensIn - tokensOut),
  );
  const used = tokensIn + tokensOut + systemEstimate;
  const available = Math.max(0, maxTokens - used);

  const pct = (n: number) => Math.round((n / maxTokens) * 1000) / 10;

  const segments: ContextSegment[] = [];

  if (tokensIn > 0) {
    segments.push({
      label: "Input",
      tokens: tokensIn,
      pct: pct(tokensIn),
      color: SEGMENT_COLORS[0],
    });
  }

  if (tokensOut > 0) {
    segments.push({
      label: "Output",
      tokens: tokensOut,
      pct: pct(tokensOut),
      color: SEGMENT_COLORS[1],
    });
  }

  if (systemEstimate > 0) {
    segments.push({
      label: "System",
      tokens: systemEstimate,
      pct: pct(systemEstimate),
      color: SEGMENT_COLORS[2],
    });
  }

  if (available > 0) {
    segments.push({
      label: "Available",
      tokens: available,
      pct: pct(available),
      color: SEGMENT_COLORS[3],
    });
  }

  return segments;
});
