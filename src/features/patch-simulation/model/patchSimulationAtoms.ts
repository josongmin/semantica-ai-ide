import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ConflictRisk, PatchSimulationResult, TurnId } from "../../../shared/protocol";

/** Per-turn patch simulation results (atomFamily keyed by TurnId) */
export const patchSimulationFamily = createBoundedAtomFamily(
  (_turnId: TurnId) => atom<Readonly<Record<string, PatchSimulationResult>>>({}),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(patchSimulationFamily, "patchSimulationFamily");

/** Write atom: upsert a patch simulation result for a specific turn + file */
export const setPatchSimulationForTurnAtom = atom(
  null,
  (get, set, payload: { turn_id: TurnId } & PatchSimulationResult) => {
    const { turn_id: turnId, ...result } = payload;
    const current = get(patchSimulationFamily(turnId));
    set(patchSimulationFamily(turnId), {
      ...current,
      [result.file_path]: result,
    });
  },
);

/** Read-only: per-turn simulation results as an array */
export const patchSimulationListFamily = createBoundedAtomFamily(
  (turnId: TurnId) => atom((get) => Object.values(get(patchSimulationFamily(turnId)))),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(patchSimulationListFamily, "patchSimulationListFamily");

/** Read-only: per-turn highest conflict risk */
export const worstConflictRiskFamily = createBoundedAtomFamily(
  (turnId: TurnId) =>
    atom<ConflictRisk>((get) => {
      const results = get(patchSimulationListFamily(turnId));
      const order: ConflictRisk[] = ["none", "low", "medium", "high"];
      let worst: ConflictRisk = "none";
      for (const r of results) {
        if (order.indexOf(r.conflict_risk) > order.indexOf(worst)) {
          worst = r.conflict_risk;
        }
      }
      return worst;
    }),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(worstConflictRiskFamily, "worstConflictRiskFamily");

/** Reset atom: clear all per-turn patch simulation state */
export const resetPatchSimulationAtom = atom(null, (_get, _set) => {
  // atomFamily entries are GC'd automatically; no manual cleanup needed
});

// ── Backward compat: session-level aliases (kept for tests) ──
export const patchSimulationMapAtom = atom<Readonly<Record<string, PatchSimulationResult>>>({});
export const setPatchSimulationAtom = atom(null, (get, set, result: PatchSimulationResult) => {
  const current = get(patchSimulationMapAtom);
  set(patchSimulationMapAtom, { ...current, [result.file_path]: result });
});
export const patchSimulationListAtom = atom((get) => Object.values(get(patchSimulationMapAtom)));
export const worstConflictRiskAtom = atom<ConflictRisk>((get) => {
  const results = get(patchSimulationListAtom);
  const order: ConflictRisk[] = ["none", "low", "medium", "high"];
  let worst: ConflictRisk = "none";
  for (const r of results) {
    if (order.indexOf(r.conflict_risk) > order.indexOf(worst)) {
      worst = r.conflict_risk;
    }
  }
  return worst;
});

registerResetAtom(resetPatchSimulationAtom);
