import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { PlanChecklistItem, PlanChecklistItemStatus } from "../../../shared/protocol";

/** Per-turn checklist: atomFamily keyed by turn_id */
export const planChecklistAtomFamily = createBoundedAtomFamily(
  (_turnId: string) => atom<readonly PlanChecklistItem[]>([]),
  { maxSize: 500 },
  (a: string, b: string) => a === b,
);
setDebugLabel(planChecklistAtomFamily, "planChecklistAtomFamily");

/** Track which turn_ids have checklists (for reset cleanup) */
const planChecklistTurnIdsAtom = atom<ReadonlySet<string>>(new Set<string>());

/** Write-only: upsert full checklist for a turn (replaces items) */
export const upsertPlanChecklistAtom = atom(
  null,
  (get, set, payload: { turn_id: string; items: readonly PlanChecklistItem[] }) => {
    set(planChecklistAtomFamily(payload.turn_id), payload.items);

    const ids = get(planChecklistTurnIdsAtom);
    if (!ids.has(payload.turn_id)) {
      const next = new Set(ids);
      next.add(payload.turn_id);
      set(planChecklistTurnIdsAtom, next);
    }
  },
);

/** Write-only: update a single item's status within a turn's checklist */
export const updatePlanItemStatusAtom = atom(
  null,
  (get, set, payload: { turn_id: string; item_id: string; status: PlanChecklistItemStatus }) => {
    const items = get(planChecklistAtomFamily(payload.turn_id));
    const updated = items.map((item) =>
      item.id === payload.item_id ? { ...item, status: payload.status } : item,
    );
    set(planChecklistAtomFamily(payload.turn_id), updated);
  },
);

/** Derived: progress summary for a turn's checklist */
export const planChecklistProgressAtomFamily = createBoundedAtomFamily(
  (turnId: string) =>
    atom((get) => {
      const items = get(planChecklistAtomFamily(turnId));
      let completed = 0;
      let failed = 0;
      let inProgress = 0;
      for (const item of items) {
        if (item.status === "completed") completed++;
        else if (item.status === "failed") failed++;
        else if (item.status === "in_progress") inProgress++;
      }
      return { total: items.length, completed, failed, inProgress, items };
    }),
  { maxSize: 500 },
  (a: string, b: string) => a === b,
);
setDebugLabel(planChecklistProgressAtomFamily, "planChecklistProgressAtomFamily");

/** Write-only: reset plan checklist store (call on session change) */
export const resetPlanChecklistStoreAtom = atom(null, (get, set) => {
  const ids = get(planChecklistTurnIdsAtom);
  for (const turnId of ids) {
    planChecklistAtomFamily.remove(turnId);
    planChecklistProgressAtomFamily.remove(turnId);
  }
  set(planChecklistTurnIdsAtom, new Set());
});

registerResetAtom(resetPlanChecklistStoreAtom);
