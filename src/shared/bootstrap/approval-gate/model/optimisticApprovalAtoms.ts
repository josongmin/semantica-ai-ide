import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

// ─── Types ──────────────────────────────────────────────
export type OptimisticApprovalStatus = "approved" | "rejected" | "pending";

// ─── Atoms ──────────────────────────────────────────────

/**
 * Map of tool call IDs to their optimistic approval status.
 * This reflects the user's intent *before* the server confirms.
 */
export const optimisticApprovalAtom = atom<ReadonlyMap<string, OptimisticApprovalStatus>>(
  new Map(),
);

/**
 * Write-only atom to set an optimistic approval status for a tool call.
 * Called immediately when the user clicks approve/deny, before the server responds.
 */
export const setOptimisticApprovalAtom = atom(
  null,
  (get, set, payload: { toolCallId: string; status: OptimisticApprovalStatus }) => {
    const current = get(optimisticApprovalAtom);
    const next = new Map(current);
    next.set(payload.toolCallId, payload.status);
    set(optimisticApprovalAtom, next);
  },
);

/**
 * Write-only atom to rollback an optimistic approval (e.g. on server error).
 * Removes the tool call from the optimistic map so UI falls back to server state.
 */
export const rollbackOptimisticAtom = atom(null, (get, set, toolCallId: string) => {
  const current = get(optimisticApprovalAtom);
  if (!current.has(toolCallId)) return;
  const next = new Map(current);
  next.delete(toolCallId);
  set(optimisticApprovalAtom, next);
});

/**
 * Write-only atom to confirm (commit) an optimistic approval.
 * Called when the server acknowledges the approval/denial.
 * Removes the entry since server state is now authoritative.
 */
export const confirmOptimisticAtom = atom(null, (get, set, toolCallId: string) => {
  const current = get(optimisticApprovalAtom);
  if (!current.has(toolCallId)) return;
  const next = new Map(current);
  next.delete(toolCallId);
  set(optimisticApprovalAtom, next);
});

/**
 * Write-only atom to reset all optimistic approvals (e.g. on session switch).
 */
export const resetOptimisticApprovalsAtom = atom(null, (_get, set) => {
  set(optimisticApprovalAtom, new Map());
});

registerResetAtom(resetOptimisticApprovalsAtom);
