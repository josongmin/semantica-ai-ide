import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { TurnId, UserInputRequest, UserInputRequestStatus } from "../../../shared/protocol";

// ─── Core store: id → UserInputRequest ──────────────────────
const userInputMapAtom = atom<ReadonlyMap<string, UserInputRequest>>(new Map());

/** Read-only list of all requests (most recent first) */
export const userInputRequestsAtom = atom((get) => {
  const map = get(userInputMapAtom);
  return [...map.values()].sort((a, b) => b.created_at_ms - a.created_at_ms);
});

/** Upsert a request into the store */
export const pushUserInputRequestAtom = atom(null, (get, set, request: UserInputRequest) => {
  const prev = get(userInputMapAtom);
  const next = new Map(prev);
  next.set(request.id, request);
  set(userInputMapAtom, next);
});

/** Update status and optionally answer */
export const updateUserInputAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      id: string;
      status: UserInputRequestStatus;
      answer?: string | readonly string[];
    },
  ) => {
    const prev = get(userInputMapAtom);
    const existing = prev.get(payload.id);
    if (!existing) return;
    const next = new Map(prev);
    next.set(payload.id, {
      ...existing,
      status: payload.status,
      answer: payload.answer ?? existing.answer,
    });
    set(userInputMapAtom, next);
  },
);

/** Remove a request by id */
export const removeUserInputAtom = atom(null, (get, set, id: string) => {
  const prev = get(userInputMapAtom);
  if (!prev.has(id)) return;
  const next = new Map(prev);
  next.delete(id);
  set(userInputMapAtom, next);
});

/** Reset entire store */
export const resetUserInputStoreAtom = atom(null, (_get, set) => {
  set(userInputMapAtom, new Map());
});

/** Per-turn derived: all requests for a given turn (pending first, then answered) */
export const userInputsByTurnAtomFamily = createBoundedAtomFamily(
  (turnId: TurnId) =>
    atom((get) => {
      const all = get(userInputRequestsAtom);
      return all
        .filter((r) => r.turn_id === turnId)
        .sort((a, b) => {
          // pending first
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          return a.created_at_ms - b.created_at_ms;
        });
    }),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(userInputsByTurnAtomFamily, "userInputsByTurnAtomFamily");

registerResetAtom(resetUserInputStoreAtom);
