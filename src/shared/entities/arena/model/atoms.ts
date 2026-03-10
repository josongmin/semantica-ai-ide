import { atom } from "jotai";

import { createBoundedAtomFamily } from "~shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "~shared/lib/atoms/debugLabel";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { ArenaResponse, ArenaResponseId, ArenaWinner } from "~shared/protocol";

// ─── Arena Response Atoms ──────────────────────────────────

/** Per-response atom family — only subscribers of a specific response re-render.
 *  Bounded to 500 entries to prevent unbounded memory growth between resets. */
export const arenaResponseAtomFamily = createBoundedAtomFamily(
  (_id: string) => atom<ArenaResponse | null>(null),
  { maxSize: 500 },
  (a: string, b: string) => a === b,
);
setDebugLabel(arenaResponseAtomFamily, "arenaResponseAtomFamily");

/** Ordered list of response IDs */
export const arenaResponseIdsAtom = atom<readonly string[]>([]);

/** Set for O(1) membership checks when upserting */
const arenaResponseIdSetAtom = atom<ReadonlySet<string>>(new Set<string>());

/** Current arena winner selection */
export const arenaWinnerAtom = atom<ArenaWinner>(null);

/** Model ID assigned to slot A */
export const arenaModelAAtom = atom<string>("");

/** Model ID assigned to slot B */
export const arenaModelBAtom = atom<string>("");

/** Write-only: upsert an arena response into the store */
export const upsertArenaResponseAtom = atom(null, (get, set, response: ArenaResponse) => {
  set(arenaResponseAtomFamily(response.id), response);

  const idSet = get(arenaResponseIdSetAtom);
  if (!idSet.has(response.id)) {
    const nextSet = new Set(idSet);
    nextSet.add(response.id);
    set(arenaResponseIdSetAtom, nextSet);
    set(arenaResponseIdsAtom, [...get(arenaResponseIdsAtom), response.id]);
  }
});

/** Write-only: append a text chunk to an existing arena response (streaming) */
export const appendArenaTextAtom = atom(
  null,
  (get, set, payload: { id: ArenaResponseId; chunk: string }) => {
    if (!payload.chunk) return;
    const response = get(arenaResponseAtomFamily(payload.id));
    if (!response) return;
    set(arenaResponseAtomFamily(payload.id), {
      ...response,
      text: response.text + payload.chunk,
    });
  },
);

/** Write-only: set the arena winner */
export const setArenaWinnerAtom = atom(null, (_get, set, winner: ArenaWinner) => {
  set(arenaWinnerAtom, winner);
});

/** Write-only: reset all arena state */
export const resetArenaStoreAtom = atom(null, (get, set) => {
  for (const id of get(arenaResponseIdSetAtom)) {
    arenaResponseAtomFamily.remove(id);
  }
  set(arenaResponseIdsAtom, []);
  set(arenaResponseIdSetAtom, new Set());
  set(arenaWinnerAtom, null);
  set(arenaModelAAtom, "");
  set(arenaModelBAtom, "");
});

// ─── Derived Atoms ─────────────────────────────────────────

/** Derived: response assigned to slot A (first match) */
export const slotAResponseAtom = atom<ArenaResponse | null>((get) => {
  const ids = get(arenaResponseIdsAtom);
  for (const id of ids) {
    const response = get(arenaResponseAtomFamily(id));
    if (response?.slot === "A") return response;
  }
  return null;
});

/** Derived: response assigned to slot B (first match) */
export const slotBResponseAtom = atom<ArenaResponse | null>((get) => {
  const ids = get(arenaResponseIdsAtom);
  for (const id of ids) {
    const response = get(arenaResponseAtomFamily(id));
    if (response?.slot === "B") return response;
  }
  return null;
});

/** Derived: true if either slot A or slot B response is currently streaming */
export const arenaIsStreamingAtom = atom<boolean>((get) => {
  const ids = get(arenaResponseIdsAtom);
  for (const id of ids) {
    const response = get(arenaResponseAtomFamily(id));
    if (response?.status === "streaming") return true;
  }
  return false;
});

registerResetAtom(resetArenaStoreAtom);
