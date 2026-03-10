import { atom } from "jotai";

import { createStateAtomSet } from "../../../shared/lib";
import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { DebateSession, TurnId } from "../../../shared/protocol";

/** Per-turn debate session state (atomFamily keyed by TurnId) */
export const debateSessionFamily = createBoundedAtomFamily(
  (_turnId: TurnId) => atom<DebateSession | null>(null),
  { maxSize: 200 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(debateSessionFamily, "debateSessionFamily");

/** Write atom: set debate session for a specific turn */
export const setDebateSessionForTurnAtom = atom(
  null,
  (_get, set, payload: { turn_id: TurnId; session: DebateSession }) => {
    set(debateSessionFamily(payload.turn_id), payload.session);
  },
);

/** Reset atom: clear all per-turn debate session state */
export const resetDebateSessionAtom = atom(null, (_get, _set) => {
  // atomFamily entries are GC'd automatically
});

// ── Backward compat: session-level singleton (kept for tests / old consumers) ──
export const [debateSessionAtom, setDebateSessionAtom] = createStateAtomSet<DebateSession | null>(
  null,
);

registerResetAtom(resetDebateSessionAtom);
