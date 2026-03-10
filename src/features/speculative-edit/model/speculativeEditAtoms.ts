import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { SpeculativeEditState, TurnId } from "../../../shared/protocol";

const DEFAULT_STATE: SpeculativeEditState = {
  edits: [],
  status: "idle",
};

/** Per-turn speculative edit state (atomFamily keyed by TurnId) */
export const speculativeEditFamily = createBoundedAtomFamily(
  (_turnId: TurnId) => atom<SpeculativeEditState>(DEFAULT_STATE),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(speculativeEditFamily, "speculativeEditFamily");

/** Write atom: set speculative edits for a specific turn */
export const setSpeculativeEditForTurnAtom = atom(
  null,
  (_get, set, payload: { turn_id: TurnId; state: SpeculativeEditState }) => {
    set(speculativeEditFamily(payload.turn_id), payload.state);
  },
);

/** Reset atom: clear all per-turn speculative edit state */
export const resetSpeculativeEditAtom = atom(null, (_get, _set) => {
  // atomFamily entries are GC'd automatically
});

// ── Backward compat: session-level singleton (kept for tests / old consumers) ──
export const speculativeEditAtom = atom<SpeculativeEditState>(DEFAULT_STATE);
export const setSpeculativeEditAtom = atom(null, (_get, set, state: SpeculativeEditState) => {
  set(speculativeEditAtom, state);
});

registerResetAtom(resetSpeculativeEditAtom);
