import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type {
  TerminalAgentAction,
  TerminalOutput,
  TerminalSession,
  TerminalSessionId,
} from "../../../shared/protocol";

const MAX_OUTPUT_LINES = 500;

/** Active terminal sessions */
export const terminalSessionsAtom = atom<readonly TerminalSession[]>([]);

/** Terminal output ring buffer */
export const terminalOutputBufferAtom = atom<readonly TerminalOutput[]>([]);

/** Pending agent commands awaiting approval */
export const pendingTerminalActionsAtom = atom<readonly TerminalAgentAction[]>([]);

/** Active session ID (user-selected tab) */
export const activeTerminalSessionIdAtom = atom<TerminalSessionId | null>(null);

/** Per-session lookup */
export const terminalSessionFamily = createBoundedAtomFamily(
  (id: TerminalSessionId) =>
    atom((get) => get(terminalSessionsAtom).find((s) => s.id === id) ?? null),
  { maxSize: 200 },
  (a: TerminalSessionId, b: TerminalSessionId) => a === b,
);
setDebugLabel(terminalSessionFamily, "terminalSessionFamily");

/** Append terminal output (ring buffer — bounded to MAX_OUTPUT_LINES) */
export const appendTerminalOutputAtom = atom(null, (get, set, output: TerminalOutput) => {
  const prev = get(terminalOutputBufferAtom);
  const next = prev.length >= MAX_OUTPUT_LINES ? [...prev.slice(1), output] : [...prev, output];
  set(terminalOutputBufferAtom, next);
});

/** Clear terminal output buffer */
export const clearTerminalOutputAtom = atom(null, (_get, set) => {
  set(terminalOutputBufferAtom, []);
});

/** Switch active terminal session */
export const setActiveSessionAtom = atom(null, (_get, set, sessionId: TerminalSessionId | null) => {
  set(activeTerminalSessionIdAtom, sessionId);
  set(terminalOutputBufferAtom, []);
});

/** Reset all terminal-bridge state */
export const resetTerminalBridgeStoreAtom = atom(null, (_get, set) => {
  set(terminalSessionsAtom, []);
  set(terminalOutputBufferAtom, []);
  set(pendingTerminalActionsAtom, []);
  set(activeTerminalSessionIdAtom, null);
  terminalSessionFamily.setShouldRemove(() => true);
  terminalSessionFamily.setShouldRemove(null);
});
registerResetAtom(resetTerminalBridgeStoreAtom);

/** Output filtered by active session */
export const activeSessionOutputAtom = atom((get) => {
  const sessionId = get(activeTerminalSessionIdAtom);
  if (!sessionId) return get(terminalOutputBufferAtom);
  return get(terminalOutputBufferAtom).filter((o) => o.sessionId === sessionId);
});

/** Pending action count for badge */
export const pendingActionCountAtom = atom(
  (get) => get(pendingTerminalActionsAtom).filter((a) => a.status === "pending").length,
);

/** Upsert terminal action */
export const upsertTerminalActionAtom = atom(null, (get, set, action: TerminalAgentAction) => {
  const prev = get(pendingTerminalActionsAtom);
  const idx = prev.findIndex((a) => a.id === action.id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = action;
    set(pendingTerminalActionsAtom, next);
  } else {
    set(pendingTerminalActionsAtom, [...prev, action]);
  }
});
