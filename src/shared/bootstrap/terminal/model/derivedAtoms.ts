/**
 * Terminal derived atoms — all computed/derived read-only atoms.
 *
 * These atoms compose session, task, and preference atoms for UI consumption.
 */
import { atom } from "jotai";

import type { TerminalSessionId } from "~shared/protocol/types/core";
import type { TerminalAgentAction } from "~shared/protocol/types/terminal";

import {
  activeTerminalSessionIdAtom,
  terminalSessionAtomFamily,
  terminalSessionOrderAtom,
} from "./sessionAtoms";
import {
  terminalTaskAtomFamily,
  terminalTaskOrderAtom,
} from "./taskAtoms";

// ─── Session Derived ───────────────────────────────────────

/** The currently active terminal session object (or null) */
export const activeTerminalSessionAtom = atom((get) => {
  const id = get(activeTerminalSessionIdAtom);
  return id ? get(terminalSessionAtomFamily(id)) : null;
});

/** Count of active terminal sessions */
export const terminalSessionCountAtom = atom((get) => {
  return get(terminalSessionOrderAtom).length;
});

/** All terminal sessions as an array (for list rendering) */
export const allTerminalSessionsAtom = atom((get) => {
  const ids = get(terminalSessionOrderAtom);
  return ids
    .map((id) => get(terminalSessionAtomFamily(id)))
    .filter((s): s is NonNullable<typeof s> => s !== null);
});

/** Sessions that have an active (running) command */
export const busyTerminalSessionsAtom = atom((get) => {
  return get(allTerminalSessionsAtom).filter((s) => s.isActive);
});

// ─── Task Derived ──────────────────────────────────────────

/** All agent actions pending approval */
export const pendingTerminalTasksAtom = atom((get) => {
  const ids = get(terminalTaskOrderAtom);
  return ids
    .map((id) => get(terminalTaskAtomFamily(id)))
    .filter(
      (a): a is TerminalAgentAction =>
        a !== null && a.status === "pending",
    );
});

/** Count of pending approvals (for badge display) */
export const pendingTerminalTaskCountAtom = atom((get) => {
  return get(pendingTerminalTasksAtom).length;
});

/** All tasks for a given session */
export const tasksForSessionAtom = atom(
  (get) => (sessionId: TerminalSessionId) => {
    const ids = get(terminalTaskOrderAtom);
    return ids
      .map((id) => get(terminalTaskAtomFamily(id)))
      .filter(
        (a): a is TerminalAgentAction =>
          a !== null && a.sessionId === sessionId,
      );
  },
);

/** Whether any task requires approval (for notification indicators) */
export const hasApprovalsPendingAtom = atom((get) => {
  return get(pendingTerminalTaskCountAtom) > 0;
});

// ─── Composite Derived ─────────────────────────────────────

/** Summary stats for the terminal status bar */
export const terminalStatusSummaryAtom = atom((get) => {
  const sessions = get(terminalSessionCountAtom);
  const busy = get(busyTerminalSessionsAtom).length;
  const pending = get(pendingTerminalTaskCountAtom);

  return {
    sessionCount: sessions,
    busyCount: busy,
    pendingApprovals: pending,
  } as const;
});
