import { atom } from "jotai";

import type { ContextPressureLevel } from "~shared/protocol";

import { sessionMetaAtom } from "./atoms";

export const CONTEXT_THRESHOLDS = {
  elevated: 70,
  critical: 85,
  emergency: 95,
} as const;

/** Derived: context usage as a 0-100 percentage */
export const contextUsagePctAtom = atom((get) => {
  const meta = get(sessionMetaAtom);
  if (meta.max_context_tokens === undefined || meta.max_context_tokens === 0) return 0;
  const used = (meta.tokens_in ?? 0) + (meta.tokens_out ?? 0);
  return Math.min((used / meta.max_context_tokens) * 100, 100);
});

/** Derived: pressure level based on thresholds */
export const contextPressureLevelAtom = atom<ContextPressureLevel>((get) => {
  const pct = get(contextUsagePctAtom);
  if (pct >= CONTEXT_THRESHOLDS.critical) return "critical";
  if (pct >= CONTEXT_THRESHOLDS.elevated) return "elevated";
  return "normal";
});
