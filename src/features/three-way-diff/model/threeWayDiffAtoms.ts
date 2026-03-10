import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ThreeWayDiffData, ThreeWayDiffResolution, TurnId } from "../../../shared/protocol";

/** Map of all three-way diffs by id */
const threeWayDiffMapAtom = atom<ReadonlyMap<string, ThreeWayDiffData>>(new Map());

/** Write-only: push a new three-way diff */
export const pushThreeWayDiffAtom = atom(null, (get, set, data: ThreeWayDiffData) => {
  const map = new Map(get(threeWayDiffMapAtom));
  map.set(data.id, data);
  set(threeWayDiffMapAtom, map);
});

/** Write-only: resolve a three-way diff */
export const resolveThreeWayDiffAtom = atom(
  null,
  (get, set, payload: { id: string; resolution: ThreeWayDiffResolution }) => {
    const map = new Map(get(threeWayDiffMapAtom));
    const existing = map.get(payload.id);
    if (!existing) return;
    map.set(payload.id, { ...existing, status: "resolved", resolution: payload.resolution });
    set(threeWayDiffMapAtom, map);
  },
);

/** Read-only: get three-way diffs for a specific turn */
export const threeWayDiffsByTurnFamily = createBoundedAtomFamily(
  (turnId: TurnId) =>
    atom((get) => {
      const map = get(threeWayDiffMapAtom);
      const result: ThreeWayDiffData[] = [];
      for (const d of map.values()) {
        if (d.turn_id === turnId) result.push(d);
      }
      return result as readonly ThreeWayDiffData[];
    }),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);

/** Write-only: reset all three-way diff state */
export const resetThreeWayDiffStoreAtom = atom(null, (_get, set) => {
  set(threeWayDiffMapAtom, new Map());
});

registerResetAtom(resetThreeWayDiffStoreAtom);
