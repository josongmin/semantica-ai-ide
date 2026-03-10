import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { AutoContextState, TurnId } from "../../../shared/protocol";

const DEFAULT_STATE: AutoContextState = {
  suggestions: [],
  total_token_cost: 0,
  budget_tokens: 0,
  status: "idle",
};

/** Per-turn auto-context state (atomFamily keyed by TurnId) */
export const autoContextFamily = createBoundedAtomFamily(
  (_turnId: TurnId) => atom<AutoContextState>(DEFAULT_STATE),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(autoContextFamily, "autoContextFamily");

/** Write atom: set auto-context for a specific turn */
export const setAutoContextForTurnAtom = atom(
  null,
  (_get, set, payload: { turn_id: TurnId; state: AutoContextState }) => {
    set(autoContextFamily(payload.turn_id), payload.state);
  },
);

/** Reset atom: clear all per-turn auto-context */
export const resetAutoContextAtom = atom(null, (_get, _set) => {
  // atomFamily entries are GC'd automatically; no manual cleanup needed
});

// ── Backward compat: global atom delegates to last-updated turn ──
// (kept for any remaining consumers; prefer autoContextFamily directly)
export const autoContextAtom = atom<AutoContextState>(DEFAULT_STATE);
export const setAutoContextAtom = atom(null, (_get, set, state: AutoContextState) => {
  set(autoContextAtom, state);
});

registerResetAtom(resetAutoContextAtom);
