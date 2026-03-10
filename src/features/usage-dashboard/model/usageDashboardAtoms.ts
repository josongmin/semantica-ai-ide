import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { UsageStats } from "../../../shared/protocol";

/** The current usage stats (null = not yet loaded) */
export const usageStatsAtom = atom<UsageStats | null>(null);

/** Write-only: set the usage stats */
export const setUsageStatsAtom = atom(null, (_get, set, stats: UsageStats) => {
  set(usageStatsAtom, stats);
});

/** Write-only: reset the usage stats */
export const resetUsageStatsAtom = atom(null, (_get, set) => {
  set(usageStatsAtom, null);
});

/** Derived: average cost per session (0 when no sessions) */
export const avgCostPerSessionAtom = atom((get) => {
  const stats = get(usageStatsAtom);
  if (!stats || stats.total_sessions === 0) return 0;
  return stats.total_cost_usd / stats.total_sessions;
});

/** Derived: max tokens across all models (for bar chart scaling) */
export const maxModelTokensAtom = atom((get) => {
  const stats = get(usageStatsAtom);
  if (!stats || stats.per_model.length === 0) return 0;
  return Math.max(...stats.per_model.map((m) => m.tokens));
});

registerResetAtom(resetUsageStatsAtom);
