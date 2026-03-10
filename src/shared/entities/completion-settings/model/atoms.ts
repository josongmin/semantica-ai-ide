import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { CompletionSettings, CompletionStats } from "~shared/protocol";

const defaultSettings: CompletionSettings = {
  enabled: true,
  trigger_delay_ms: 300,
  max_lines: 5,
  accept_key: "Tab",
};

const defaultStats: CompletionStats = {
  shown_today: 0,
  accepted_today: 0,
  acceptance_rate: 0,
};

/** Current completion settings */
export const completionSettingsAtom = atom<CompletionSettings>(defaultSettings);

/** Today's completion stats */
export const completionStatsAtom = atom<CompletionStats>(defaultStats);

/** Write-only: partial merge of completion settings */
export const updateCompletionSettingsAtom = atom(
  null,
  (get, set, partial: Partial<CompletionSettings>) => {
    set(completionSettingsAtom, { ...get(completionSettingsAtom), ...partial });
  },
);

/** Write-only: replace completion stats */
export const setCompletionStatsAtom = atom(null, (_get, set, stats: CompletionStats) => {
  set(completionStatsAtom, stats);
});

/** Write-only: reset all completion settings state to defaults */
export const resetCompletionStoreAtom = atom(null, (_get, set) => {
  set(completionSettingsAtom, defaultSettings);
  set(completionStatsAtom, defaultStats);
});

registerResetAtom(resetCompletionStoreAtom);
