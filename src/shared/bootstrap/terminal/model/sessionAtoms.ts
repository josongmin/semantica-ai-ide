/**
 * Terminal session atoms — session map, active session, and session CRUD.
 */
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import type { TerminalSessionId } from "~shared/protocol/types/core";
import type { TerminalSession } from "~shared/protocol/types/terminal";

// ─── Session Map ───────────────────────────────────────────

/** All known terminal session IDs in creation order */
export const terminalSessionOrderAtom = atom<readonly TerminalSessionId[]>([]);

/** Set for O(1) membership checks */
const terminalSessionIdSetAtom = atom<ReadonlySet<TerminalSessionId>>(
  new Set<TerminalSessionId>(),
);

/** Per-session atom family */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
export const terminalSessionAtomFamily = atomFamily(
  (_id: TerminalSessionId) => atom<TerminalSession | null>(null),
  (a: TerminalSessionId, b: TerminalSessionId) => a === b,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- debugLabel is not in the public type
(terminalSessionAtomFamily as any).debugLabel = "terminalSessionAtomFamily";

/** Currently focused terminal session */
export const activeTerminalSessionIdAtom = atom<TerminalSessionId | null>(null);

// ─── Session CRUD ──────────────────────────────────────────

/** Write-only: upsert a terminal session */
export const upsertTerminalSessionAtom = atom(
  null,
  (get, set, session: TerminalSession) => {
    set(terminalSessionAtomFamily(session.id), session);

    const idSet = get(terminalSessionIdSetAtom);
    if (!idSet.has(session.id)) {
      const nextSet = new Set(idSet);
      nextSet.add(session.id);
      set(terminalSessionIdSetAtom, nextSet);
      set(terminalSessionOrderAtom, [
        ...get(terminalSessionOrderAtom),
        session.id,
      ]);
    }
  },
);

/** Write-only: bulk-replace all terminal sessions */
export const setTerminalSessionsAtom = atom(
  null,
  (get, set, sessions: readonly TerminalSession[]) => {
    // Clean up removed sessions
    for (const id of get(terminalSessionIdSetAtom)) {
      if (!sessions.some((s) => s.id === id)) {
        terminalSessionAtomFamily.remove(id);
      }
    }

    const nextIds: TerminalSessionId[] = [];
    const nextSet = new Set<TerminalSessionId>();
    for (const s of sessions) {
      set(terminalSessionAtomFamily(s.id), s);
      nextIds.push(s.id);
      nextSet.add(s.id);
    }

    set(terminalSessionOrderAtom, nextIds);
    set(terminalSessionIdSetAtom, nextSet);

    // Reset active if no longer valid
    const active = get(activeTerminalSessionIdAtom);
    if (active && !nextSet.has(active)) {
      set(activeTerminalSessionIdAtom, nextIds[0] ?? null);
    }
  },
);

/** Write-only: remove a single terminal session */
export const removeTerminalSessionAtom = atom(
  null,
  (get, set, sessionId: TerminalSessionId) => {
    terminalSessionAtomFamily.remove(sessionId);

    const idSet = get(terminalSessionIdSetAtom);
    if (!idSet.has(sessionId)) return;

    const nextSet = new Set(idSet);
    nextSet.delete(sessionId);
    set(terminalSessionIdSetAtom, nextSet);
    set(
      terminalSessionOrderAtom,
      get(terminalSessionOrderAtom).filter((id) => id !== sessionId),
    );

    // If removed session was active, fall back to first available
    if (get(activeTerminalSessionIdAtom) === sessionId) {
      const remaining = get(terminalSessionOrderAtom);
      set(activeTerminalSessionIdAtom, remaining[0] ?? null);
    }
  },
);

/** Write-only: reset all terminal session state */
export const resetTerminalSessionsAtom = atom(null, (get, set) => {
  for (const id of get(terminalSessionIdSetAtom)) {
    terminalSessionAtomFamily.remove(id);
  }
  set(terminalSessionOrderAtom, []);
  set(terminalSessionIdSetAtom, new Set());
  set(activeTerminalSessionIdAtom, null);
});
