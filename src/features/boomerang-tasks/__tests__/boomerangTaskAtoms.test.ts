import { createStore } from "jotai";

import { createBoomerangTask, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import {
  allBoomerangTasksCompleteAtom,
  boomerangTasksAtom,
  boomerangTasksByTurnAtom,
  boomerangTasksByTurnMapAtom,
  resetBoomerangTasksStoreAtom,
  setBoomerangTasksAtom,
} from "../model/boomerangTaskAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("boomerangTaskAtoms", () => {
  it("starts with an empty map", () => {
    const store = createStore();
    expect(store.get(boomerangTasksAtom).size).toBe(0);
  });

  it("setBoomerangTasksAtom adds tasks to the map", () => {
    const store = createStore();
    const task1 = createBoomerangTask({ id: "t1", parent_turn_id: "turn_1" as TurnId });
    const task2 = createBoomerangTask({ id: "t2", parent_turn_id: "turn_1" as TurnId });

    store.set(setBoomerangTasksAtom, [task1, task2]);

    const map = store.get(boomerangTasksAtom);
    expect(map.size).toBe(2);
    expect(map.get("t1")).toEqual(task1);
    expect(map.get("t2")).toEqual(task2);
  });

  it("setBoomerangTasksAtom merges with existing tasks", () => {
    const store = createStore();
    const task1 = createBoomerangTask({ id: "t1", parent_turn_id: "turn_1" as TurnId });
    store.set(setBoomerangTasksAtom, [task1]);

    const task2 = createBoomerangTask({ id: "t2", parent_turn_id: "turn_2" as TurnId });
    store.set(setBoomerangTasksAtom, [task2]);

    const map = store.get(boomerangTasksAtom);
    expect(map.size).toBe(2);
    expect(map.has("t1")).toBe(true);
    expect(map.has("t2")).toBe(true);
  });

  it("setBoomerangTasksAtom updates existing task by id", () => {
    const store = createStore();
    store.set(setBoomerangTasksAtom, [
      createBoomerangTask({ id: "t1", status: "pending", label: "Original" }),
    ]);

    store.set(setBoomerangTasksAtom, [
      createBoomerangTask({ id: "t1", status: "success", label: "Updated" }),
    ]);

    const map = store.get(boomerangTasksAtom);
    expect(map.size).toBe(1);
    expect(map.get("t1")?.status).toBe("success");
    expect(map.get("t1")?.label).toBe("Updated");
  });

  it("boomerangTasksByTurnMapAtom groups tasks by parent_turn_id", () => {
    const store = createStore();
    store.set(setBoomerangTasksAtom, [
      createBoomerangTask({ id: "t1", parent_turn_id: "turn_A" as TurnId }),
      createBoomerangTask({ id: "t2", parent_turn_id: "turn_A" as TurnId }),
      createBoomerangTask({ id: "t3", parent_turn_id: "turn_B" as TurnId }),
    ]);

    const grouped = store.get(boomerangTasksByTurnMapAtom);
    expect(grouped.get("turn_A" as TurnId)).toHaveLength(2);
    expect(grouped.get("turn_B" as TurnId)).toHaveLength(1);
  });

  it("boomerangTasksByTurnAtom returns tasks for specific turn", () => {
    const store = createStore();
    store.set(setBoomerangTasksAtom, [
      createBoomerangTask({ id: "t1", parent_turn_id: "turn_A" as TurnId, label: "Task A1" }),
      createBoomerangTask({ id: "t2", parent_turn_id: "turn_B" as TurnId, label: "Task B1" }),
    ]);

    const tasksA = store.get(boomerangTasksByTurnAtom("turn_A" as TurnId));
    expect(tasksA).toHaveLength(1);
    expect(tasksA[0]?.label).toBe("Task A1");

    const tasksB = store.get(boomerangTasksByTurnAtom("turn_B" as TurnId));
    expect(tasksB).toHaveLength(1);
    expect(tasksB[0]?.label).toBe("Task B1");
  });

  it("boomerangTasksByTurnAtom returns empty array for unknown turn", () => {
    const store = createStore();
    const tasks = store.get(boomerangTasksByTurnAtom("unknown" as TurnId));
    expect(tasks).toHaveLength(0);
  });

  it("allBoomerangTasksCompleteAtom returns true when all tasks are done", () => {
    const store = createStore();
    store.set(setBoomerangTasksAtom, [
      createBoomerangTask({ id: "t1", parent_turn_id: "turn_1" as TurnId, status: "success" }),
      createBoomerangTask({ id: "t2", parent_turn_id: "turn_1" as TurnId, status: "error" }),
    ]);

    expect(store.get(allBoomerangTasksCompleteAtom("turn_1" as TurnId))).toBe(true);
  });

  it("allBoomerangTasksCompleteAtom returns false when some tasks are pending", () => {
    const store = createStore();
    store.set(setBoomerangTasksAtom, [
      createBoomerangTask({ id: "t1", parent_turn_id: "turn_1" as TurnId, status: "success" }),
      createBoomerangTask({ id: "t2", parent_turn_id: "turn_1" as TurnId, status: "running" }),
    ]);

    expect(store.get(allBoomerangTasksCompleteAtom("turn_1" as TurnId))).toBe(false);
  });

  it("allBoomerangTasksCompleteAtom returns false when no tasks exist", () => {
    const store = createStore();
    expect(store.get(allBoomerangTasksCompleteAtom("turn_1" as TurnId))).toBe(false);
  });

  it("resetBoomerangTasksStoreAtom clears all tasks", () => {
    const store = createStore();
    store.set(setBoomerangTasksAtom, [
      createBoomerangTask({ id: "t1" }),
      createBoomerangTask({ id: "t2" }),
    ]);
    expect(store.get(boomerangTasksAtom).size).toBe(2);

    store.set(resetBoomerangTasksStoreAtom);
    expect(store.get(boomerangTasksAtom).size).toBe(0);
  });
});
