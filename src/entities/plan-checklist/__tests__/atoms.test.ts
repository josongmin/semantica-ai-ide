import { createStore } from "jotai";

import { createPlanChecklistItem } from "../../../shared/lib/mocks";
import type { PlanChecklistItem } from "../../../shared/protocol";
import {
  planChecklistAtomFamily,
  planChecklistProgressAtomFamily,
  resetPlanChecklistStoreAtom,
  updatePlanItemStatusAtom,
  upsertPlanChecklistAtom,
} from "../model/atoms";

describe("plan-checklist atoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("defaults to empty checklist for unknown turn", () => {
    const items = store.get(planChecklistAtomFamily("turn_unknown"));
    expect(items).toEqual([]);
  });

  it("upsertPlanChecklistAtom sets items for a turn", () => {
    const items: PlanChecklistItem[] = [
      createPlanChecklistItem({ id: "p1", label: "Step 1" }),
      createPlanChecklistItem({ id: "p2", label: "Step 2" }),
    ];

    store.set(upsertPlanChecklistAtom, { turn_id: "turn_1", items });

    const result = store.get(planChecklistAtomFamily("turn_1"));
    expect(result).toHaveLength(2);
    expect(result[0]?.label).toBe("Step 1");
    expect(result[1]?.label).toBe("Step 2");
  });

  it("upsertPlanChecklistAtom replaces existing items", () => {
    store.set(upsertPlanChecklistAtom, {
      turn_id: "turn_1",
      items: [createPlanChecklistItem({ id: "p1", label: "Old" })],
    });

    store.set(upsertPlanChecklistAtom, {
      turn_id: "turn_1",
      items: [createPlanChecklistItem({ id: "p2", label: "New" })],
    });

    const result = store.get(planChecklistAtomFamily("turn_1"));
    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe("New");
  });

  it("updatePlanItemStatusAtom updates a single item status", () => {
    store.set(upsertPlanChecklistAtom, {
      turn_id: "turn_1",
      items: [
        createPlanChecklistItem({ id: "p1", label: "A", status: "pending" }),
        createPlanChecklistItem({ id: "p2", label: "B", status: "pending" }),
      ],
    });

    store.set(updatePlanItemStatusAtom, {
      turn_id: "turn_1",
      item_id: "p1",
      status: "completed",
    });

    const result = store.get(planChecklistAtomFamily("turn_1"));
    expect(result[0]?.status).toBe("completed");
    expect(result[1]?.status).toBe("pending");
  });

  it("planChecklistProgressAtomFamily computes progress", () => {
    store.set(upsertPlanChecklistAtom, {
      turn_id: "turn_1",
      items: [
        createPlanChecklistItem({ id: "p1", status: "completed" }),
        createPlanChecklistItem({ id: "p2", status: "in_progress" }),
        createPlanChecklistItem({ id: "p3", status: "failed" }),
        createPlanChecklistItem({ id: "p4", status: "pending" }),
      ],
    });

    const progress = store.get(planChecklistProgressAtomFamily("turn_1"));
    expect(progress.total).toBe(4);
    expect(progress.completed).toBe(1);
    expect(progress.inProgress).toBe(1);
    expect(progress.failed).toBe(1);
    expect(progress.items).toHaveLength(4);
  });

  it("planChecklistProgressAtomFamily returns zero for empty turn", () => {
    const progress = store.get(planChecklistProgressAtomFamily("turn_empty"));
    expect(progress.total).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.failed).toBe(0);
    expect(progress.inProgress).toBe(0);
  });

  it("resetPlanChecklistStoreAtom clears all checklists", () => {
    store.set(upsertPlanChecklistAtom, {
      turn_id: "turn_1",
      items: [createPlanChecklistItem({ id: "p1" })],
    });
    store.set(upsertPlanChecklistAtom, {
      turn_id: "turn_2",
      items: [createPlanChecklistItem({ id: "p2" })],
    });

    store.set(resetPlanChecklistStoreAtom);

    // After reset, atomFamily entries are removed, reads from a fresh store return defaults
    const store2 = createStore();
    expect(store2.get(planChecklistAtomFamily("turn_1"))).toEqual([]);
    expect(store2.get(planChecklistAtomFamily("turn_2"))).toEqual([]);
  });

  it("supports multiple turns independently", () => {
    store.set(upsertPlanChecklistAtom, {
      turn_id: "turn_A",
      items: [createPlanChecklistItem({ id: "a1", label: "Alpha" })],
    });
    store.set(upsertPlanChecklistAtom, {
      turn_id: "turn_B",
      items: [createPlanChecklistItem({ id: "b1", label: "Beta" })],
    });

    expect(store.get(planChecklistAtomFamily("turn_A"))[0]?.label).toBe("Alpha");
    expect(store.get(planChecklistAtomFamily("turn_B"))[0]?.label).toBe("Beta");
  });
});
