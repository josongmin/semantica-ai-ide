import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import type { ProjectTodo, ProjectTodoId } from "~shared/protocol";

import {
  deleteProjectTodoAtom,
  pendingTodoCountAtom,
  projectTodoCountsAtom,
  projectTodoListAtom,
  projectTodoMapAtom,
  syncProjectTodosAtom,
  updateProjectTodoStatusAtom,
  upsertProjectTodoAtom,
} from "../model/atoms";

function makeTodo(overrides: Partial<ProjectTodo> = {}): ProjectTodo {
  return {
    id: "todo_1" as ProjectTodoId,
    label: "Implement feature",
    status: "pending",
    priority: "medium",
    source_session_ids: [],
    created_at_ms: 1000,
    updated_at_ms: 1000,
    ...overrides,
  };
}

describe("project-todo atoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  // ── Core storage ────────────────────────────────────

  it("defaults to an empty map", () => {
    const map = store.get(projectTodoMapAtom);
    expect(map.size).toBe(0);
  });

  // ── syncProjectTodosAtom ────────────────────────────

  it("replaces the entire map on sync", () => {
    const todos = [
      makeTodo({ id: "t1" as ProjectTodoId, label: "A" }),
      makeTodo({ id: "t2" as ProjectTodoId, label: "B" }),
    ];
    store.set(syncProjectTodosAtom, todos);

    const map = store.get(projectTodoMapAtom);
    expect(map.size).toBe(2);
    expect(map.get("t1" as ProjectTodoId)?.label).toBe("A");
    expect(map.get("t2" as ProjectTodoId)?.label).toBe("B");
  });

  it("sync overwrites previous data", () => {
    store.set(syncProjectTodosAtom, [makeTodo({ id: "t1" as ProjectTodoId })]);
    store.set(syncProjectTodosAtom, [makeTodo({ id: "t2" as ProjectTodoId })]);

    const map = store.get(projectTodoMapAtom);
    expect(map.size).toBe(1);
    expect(map.has("t1" as ProjectTodoId)).toBe(false);
    expect(map.has("t2" as ProjectTodoId)).toBe(true);
  });

  // ── upsertProjectTodoAtom ───────────────────────────

  it("adds a new todo via upsert", () => {
    const todo = makeTodo({ id: "t1" as ProjectTodoId });
    store.set(upsertProjectTodoAtom, todo);

    const map = store.get(projectTodoMapAtom);
    expect(map.size).toBe(1);
    expect(map.get("t1" as ProjectTodoId)).toEqual(todo);
  });

  it("updates an existing todo via upsert", () => {
    store.set(upsertProjectTodoAtom, makeTodo({ id: "t1" as ProjectTodoId, label: "Old" }));
    store.set(upsertProjectTodoAtom, makeTodo({ id: "t1" as ProjectTodoId, label: "New" }));

    const map = store.get(projectTodoMapAtom);
    expect(map.size).toBe(1);
    expect(map.get("t1" as ProjectTodoId)?.label).toBe("New");
  });

  // ── updateProjectTodoStatusAtom ─────────────────────

  it("updates status of an existing todo", () => {
    store.set(upsertProjectTodoAtom, makeTodo({ id: "t1" as ProjectTodoId, status: "pending" }));
    store.set(updateProjectTodoStatusAtom, { id: "t1" as ProjectTodoId, status: "in_progress" });

    const todo = store.get(projectTodoMapAtom).get("t1" as ProjectTodoId);
    expect(todo?.status).toBe("in_progress");
    expect(todo!.updated_at_ms).toBeGreaterThan(1000);
  });

  it("no-ops when updating non-existent todo", () => {
    store.set(updateProjectTodoStatusAtom, { id: "nope" as ProjectTodoId, status: "completed" });
    expect(store.get(projectTodoMapAtom).size).toBe(0);
  });

  // ── deleteProjectTodoAtom ───────────────────────────

  it("deletes an existing todo", () => {
    store.set(upsertProjectTodoAtom, makeTodo({ id: "t1" as ProjectTodoId }));
    store.set(deleteProjectTodoAtom, "t1" as ProjectTodoId);
    expect(store.get(projectTodoMapAtom).size).toBe(0);
  });

  it("no-ops when deleting non-existent todo", () => {
    store.set(deleteProjectTodoAtom, "nope" as ProjectTodoId);
    expect(store.get(projectTodoMapAtom).size).toBe(0);
  });

  // ── Derived: projectTodoListAtom ────────────────────

  it("returns sorted list by updated_at_ms descending", () => {
    store.set(syncProjectTodosAtom, [
      makeTodo({ id: "t1" as ProjectTodoId, updated_at_ms: 100 }),
      makeTodo({ id: "t2" as ProjectTodoId, updated_at_ms: 300 }),
      makeTodo({ id: "t3" as ProjectTodoId, updated_at_ms: 200 }),
    ]);

    const list = store.get(projectTodoListAtom);
    expect(list.map((t) => t.id)).toEqual(["t2", "t3", "t1"]);
  });

  // ── Derived: projectTodoCountsAtom ──────────────────

  it("computes status counts correctly", () => {
    store.set(syncProjectTodosAtom, [
      makeTodo({ id: "t1" as ProjectTodoId, status: "pending" }),
      makeTodo({ id: "t2" as ProjectTodoId, status: "pending" }),
      makeTodo({ id: "t3" as ProjectTodoId, status: "in_progress" }),
      makeTodo({ id: "t4" as ProjectTodoId, status: "completed" }),
      makeTodo({ id: "t5" as ProjectTodoId, status: "failed" }),
    ]);

    const counts = store.get(projectTodoCountsAtom);
    expect(counts).toEqual({
      total: 5,
      pending: 2,
      inProgress: 1,
      completed: 1,
      failed: 1,
    });
  });

  it("returns zero counts for empty store", () => {
    const counts = store.get(projectTodoCountsAtom);
    expect(counts.total).toBe(0);
    expect(counts.pending).toBe(0);
  });

  // ── Derived: pendingTodoCountAtom ───────────────────

  it("returns sum of pending + in_progress", () => {
    store.set(syncProjectTodosAtom, [
      makeTodo({ id: "t1" as ProjectTodoId, status: "pending" }),
      makeTodo({ id: "t2" as ProjectTodoId, status: "in_progress" }),
      makeTodo({ id: "t3" as ProjectTodoId, status: "completed" }),
    ]);

    expect(store.get(pendingTodoCountAtom)).toBe(2);
  });
});
