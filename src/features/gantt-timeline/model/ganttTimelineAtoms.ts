import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { GanttEntry } from "../../../shared/protocol";

/** All Gantt entries for the current session */
export const ganttEntriesAtom = atom<readonly GanttEntry[]>([]);

/** Write-only: replace all Gantt entries */
export const setGanttEntriesAtom = atom(null, (_get, set, entries: readonly GanttEntry[]) => {
  set(ganttEntriesAtom, entries);
});

/** Write-only: reset Gantt entries */
export const resetGanttEntriesAtom = atom(null, (_get, set) => {
  set(ganttEntriesAtom, []);
});

/** Derived: timeline bounds (first start, last end) for normalization */
export const ganttTimelineBoundsAtom = atom((get) => {
  const entries = get(ganttEntriesAtom);
  if (entries.length === 0) return { startMs: 0, endMs: 0, durationMs: 0 };
  const startMs = Math.min(...entries.map((e) => e.start_ms));
  const endMs = Math.max(...entries.map((e) => e.end_ms));
  return { startMs, endMs, durationMs: endMs - startMs };
});

registerResetAtom(resetGanttEntriesAtom);
