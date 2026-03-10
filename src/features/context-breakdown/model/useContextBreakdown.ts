import { useAtomValue } from "jotai";

import { contextUsagePctAtom, sessionMetaAtom } from "~entities/session/state";

import { contextBreakdownAtom, type ContextSegment } from "./contextBreakdownAtoms";

export interface ContextBreakdownResult {
  /** Context segments for visualization */
  segments: readonly ContextSegment[];
  /** Total used tokens (input + output) */
  totalUsed: number;
  /** Maximum available tokens */
  maxTokens: number;
  /** Usage as a 0-100 percentage — single source from session entity */
  usagePct: number;
}

/**
 * Hook for accessing context breakdown data.
 * Reuses `contextUsagePctAtom` from session entity to avoid duplicate derivation.
 */
export function useContextBreakdown(): ContextBreakdownResult {
  const segments = useAtomValue(contextBreakdownAtom);
  const usagePct = useAtomValue(contextUsagePctAtom);
  const meta = useAtomValue(sessionMetaAtom);
  const maxTokens = meta.max_context_tokens ?? 0;
  const totalUsed = (meta.tokens_in ?? 0) + (meta.tokens_out ?? 0);

  return { segments, totalUsed, maxTokens, usagePct };
}
