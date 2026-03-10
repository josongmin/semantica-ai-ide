/**
 * Machine Snapshot atoms for saving and restoring dev environment state.
 *
 * Manages snapshot list with create/restore/delete operations.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { MachineSnapshot } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** All machine snapshots */
export const machineSnapshotsAtom = atom<readonly MachineSnapshot[]>([]);

/** Write-only: set snapshots from a serverEvent payload (full replace) */
export const setMachineSnapshotsAtom = atom(
  null,
  (_get, set, snapshots: readonly MachineSnapshot[]) => {
    set(machineSnapshotsAtom, snapshots);
  },
);

// ─── Derived Atoms ───────────────────────────────────────────

/** Derived: snapshots sorted by created_at_ms descending (newest first) */
export const sortedSnapshotsAtom = atom((get) => {
  const snapshots = get(machineSnapshotsAtom);
  return [...snapshots].sort((a, b) => b.created_at_ms - a.created_at_ms);
});

/** Derived: whether any snapshot is currently creating or restoring */
export const isSnapshotBusyAtom = atom((get) => {
  const snapshots = get(machineSnapshotsAtom);
  return snapshots.some((s) => s.status === "creating" || s.status === "restoring");
});

/** Write-only: reset all snapshots */
export const resetMachineSnapshotsStoreAtom = atom(null, (_get, set) => {
  set(machineSnapshotsAtom, []);
});

registerResetAtom(resetMachineSnapshotsStoreAtom);
