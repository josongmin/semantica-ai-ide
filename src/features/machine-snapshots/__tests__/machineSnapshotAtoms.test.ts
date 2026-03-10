import { createStore } from "jotai";

import type { MachineSnapshot } from "../../../shared/protocol";
import {
  isSnapshotBusyAtom,
  machineSnapshotsAtom,
  resetMachineSnapshotsStoreAtom,
  setMachineSnapshotsAtom,
  sortedSnapshotsAtom,
} from "../model/machineSnapshotAtoms";
function createSnapshot(overrides: Partial<MachineSnapshot> = {}): MachineSnapshot {
  return {
    id: `snap_${Math.random().toString(36).slice(2, 8)}`,
    label: "Test Snapshot",
    created_at_ms: Date.now(),
    size_mb: 128.5,
    status: "ready",
    ...overrides,
  };
}

describe("machineSnapshotAtoms", () => {
  it("starts with empty snapshots", () => {
    const store = createStore();
    expect(store.get(machineSnapshotsAtom)).toHaveLength(0);
  });

  it("setMachineSnapshotsAtom replaces all snapshots", () => {
    const store = createStore();
    const s1 = createSnapshot({ id: "s1", label: "Before refactor" });
    const s2 = createSnapshot({ id: "s2", label: "After feature" });

    store.set(setMachineSnapshotsAtom, [s1, s2]);
    expect(store.get(machineSnapshotsAtom)).toHaveLength(2);

    // Full replace
    const s3 = createSnapshot({ id: "s3", label: "New only" });
    store.set(setMachineSnapshotsAtom, [s3]);
    expect(store.get(machineSnapshotsAtom)).toHaveLength(1);
    expect(store.get(machineSnapshotsAtom)[0]?.id).toBe("s3");
  });

  it("sortedSnapshotsAtom returns snapshots sorted newest first", () => {
    const store = createStore();
    store.set(setMachineSnapshotsAtom, [
      createSnapshot({ id: "s1", created_at_ms: 1000 }),
      createSnapshot({ id: "s2", created_at_ms: 3000 }),
      createSnapshot({ id: "s3", created_at_ms: 2000 }),
    ]);

    const sorted = store.get(sortedSnapshotsAtom);
    expect(sorted[0]?.id).toBe("s2");
    expect(sorted[1]?.id).toBe("s3");
    expect(sorted[2]?.id).toBe("s1");
  });

  it("isSnapshotBusyAtom returns true when any snapshot is creating", () => {
    const store = createStore();
    store.set(setMachineSnapshotsAtom, [
      createSnapshot({ id: "s1", status: "ready" }),
      createSnapshot({ id: "s2", status: "creating" }),
    ]);

    expect(store.get(isSnapshotBusyAtom)).toBe(true);
  });

  it("isSnapshotBusyAtom returns true when any snapshot is restoring", () => {
    const store = createStore();
    store.set(setMachineSnapshotsAtom, [
      createSnapshot({ id: "s1", status: "ready" }),
      createSnapshot({ id: "s2", status: "restoring" }),
    ]);

    expect(store.get(isSnapshotBusyAtom)).toBe(true);
  });

  it("isSnapshotBusyAtom returns false when all snapshots are ready", () => {
    const store = createStore();
    store.set(setMachineSnapshotsAtom, [
      createSnapshot({ id: "s1", status: "ready" }),
      createSnapshot({ id: "s2", status: "ready" }),
    ]);

    expect(store.get(isSnapshotBusyAtom)).toBe(false);
  });

  it("isSnapshotBusyAtom returns false when no snapshots", () => {
    const store = createStore();
    expect(store.get(isSnapshotBusyAtom)).toBe(false);
  });

  it("resetMachineSnapshotsStoreAtom clears all snapshots", () => {
    const store = createStore();
    store.set(setMachineSnapshotsAtom, [
      createSnapshot({ id: "s1" }),
      createSnapshot({ id: "s2" }),
    ]);
    expect(store.get(machineSnapshotsAtom)).toHaveLength(2);

    store.set(resetMachineSnapshotsStoreAtom);
    expect(store.get(machineSnapshotsAtom)).toHaveLength(0);
  });

  it("handles different snapshot statuses", () => {
    const store = createStore();
    store.set(setMachineSnapshotsAtom, [
      createSnapshot({ id: "s1", status: "ready" }),
      createSnapshot({ id: "s2", status: "creating" }),
      createSnapshot({ id: "s3", status: "restoring" }),
    ]);

    const snapshots = store.get(machineSnapshotsAtom);
    expect(snapshots[0]?.status).toBe("ready");
    expect(snapshots[1]?.status).toBe("creating");
    expect(snapshots[2]?.status).toBe("restoring");
  });
});
