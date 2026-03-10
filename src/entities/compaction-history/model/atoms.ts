import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { CompactionEvent } from "../../../shared/protocol";

/** All compaction events in the current session, append-only */
export const compactionEventsAtom = atom<readonly CompactionEvent[]>([]);

/** Maximum compaction events to retain in memory */
const MAX_COMPACTION_EVENTS = 200;

/** Write-only: add a compaction event (caps at MAX_COMPACTION_EVENTS) */
export const addCompactionEventAtom = atom(null, (get, set, event: CompactionEvent) => {
  const events = get(compactionEventsAtom);
  const next =
    events.length >= MAX_COMPACTION_EVENTS
      ? [...events.slice(-MAX_COMPACTION_EVENTS + 1), event]
      : [...events, event];
  set(compactionEventsAtom, next);
});

/** Derived: total tokens saved across all compaction events */
export const totalTokensSavedAtom = atom((get) => {
  const events = get(compactionEventsAtom);
  return events.reduce((sum, e) => sum + (e.tokens_before - e.tokens_after), 0);
});

/** Write-only: reset compaction history (call on session change) */
export const resetCompactionHistoryAtom = atom(null, (_get, set) => {
  set(compactionEventsAtom, []);
});

registerResetAtom(resetCompactionHistoryAtom);
