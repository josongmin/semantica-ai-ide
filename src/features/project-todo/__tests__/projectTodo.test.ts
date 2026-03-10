import { createStore } from "jotai";

import {
  deleteProjectTodoAtom,
  projectTodoCountsAtom,
  projectTodoListAtom,
  projectTodoMapAtom,
  syncProjectTodosAtom,
  updateProjectTodoStatusAtom,
  upsertProjectTodoAtom,
} from "~entities/project-todo";

import type { ProjectTodo, ProjectTodoId } from "../../../shared/protocol";

function makeTodo(o: {
  id: ProjectTodoId;
  label: string;
  status?: "pending" | "in_progress" | "completed" | "failed";
  priority?: "high" | "medium" | "low";
  updated_at_ms?: number;
}): ProjectTodo {
  return {
    id: o.id,
    label: o.label,
    status: o.status ?? "pending",
    priority: o.priority ?? "medium",
    source_session_ids: [],
    created_at_ms: Date.now(),
    updated_at_ms: o.updated_at_ms ?? Date.now(),
  };
}

describe("project-todo atoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("starts with empty map", () => {
    expect(store.get(projectTodoMapAtom).size).toBe(0);
    expect(store.get(projectTodoListAtom)).toEqual([]);
  });

  it("syncProjectTodosAtom replaces entire map", () => {
    const todos = [
      makeTodo({ id: "t1" as ProjectTodoId, label: "A" }),
      makeTodo({ id: "t2" as ProjectTodoId, label: "B" }),
    ];
    store.set(syncProjectTodosAtom, todos);
    expect(store.get(projectTodoMapAtom).size).toBe(2);
    expect(store.get(projectTodoMapAtom).get("t1" as ProjectTodoId)?.label).toBe("A");
  });

  it("upsertProjectTodoAtom adds a new TODO", () => {
    const todo = makeTodo({ id: "t1" as ProjectTodoId, label: "Task" });
    store.set(upsertProjectTodoAtom, todo);
    expect(store.get(projectTodoMapAtom).size).toBe(1);
  });

  it("upsertProjectTodoAtom updates existing TODO", () => {
    const todo = makeTodo({ id: "t1" as ProjectTodoId, label: "Original" });
    store.set(upsertProjectTodoAtom, todo);
    store.set(upsertProjectTodoAtom, { ...todo, label: "Updated" });
    expect(store.get(projectTodoMapAtom).size).toBe(1);
    expect(store.get(projectTodoMapAtom).get("t1" as ProjectTodoId)?.label).toBe("Updated");
  });

  it("updateProjectTodoStatusAtom changes status", () => {
    const todo = makeTodo({ id: "t1" as ProjectTodoId, label: "Task", status: "pending" });
    store.set(upsertProjectTodoAtom, todo);
    store.set(updateProjectTodoStatusAtom, { id: "t1" as ProjectTodoId, status: "in_progress" });
    expect(store.get(projectTodoMapAtom).get("t1" as ProjectTodoId)?.status).toBe("in_progress");
  });

  it("updateProjectTodoStatusAtom ignores non-existent ID", () => {
    store.set(updateProjectTodoStatusAtom, { id: "ghost" as ProjectTodoId, status: "completed" });
    expect(store.get(projectTodoMapAtom).size).toBe(0);
  });

  it("deleteProjectTodoAtom removes TODO", () => {
    store.set(upsertProjectTodoAtom, makeTodo({ id: "t1" as ProjectTodoId, label: "Task" }));
    expect(store.get(projectTodoMapAtom).size).toBe(1);
    store.set(deleteProjectTodoAtom, "t1" as ProjectTodoId);
    expect(store.get(projectTodoMapAtom).size).toBe(0);
  });

  it("projectTodoCountsAtom computes correct counts", () => {
    store.set(syncProjectTodosAtom, [
      makeTodo({ id: "t1" as ProjectTodoId, label: "A", status: "pending" }),
      makeTodo({ id: "t2" as ProjectTodoId, label: "B", status: "in_progress" }),
      makeTodo({ id: "t3" as ProjectTodoId, label: "C", status: "completed" }),
      makeTodo({ id: "t4" as ProjectTodoId, label: "D", status: "failed" }),
      makeTodo({ id: "t5" as ProjectTodoId, label: "E", status: "pending" }),
    ]);
    const counts = store.get(projectTodoCountsAtom);
    expect(counts.total).toBe(5);
    expect(counts.pending).toBe(2);
    expect(counts.inProgress).toBe(1);
    expect(counts.completed).toBe(1);
    expect(counts.failed).toBe(1);
  });

  it("projectTodoListAtom sorts by updated_at_ms descending", () => {
    store.set(syncProjectTodosAtom, [
      makeTodo({ id: "t1" as ProjectTodoId, label: "Old", updated_at_ms: 1000 }),
      makeTodo({ id: "t2" as ProjectTodoId, label: "New", updated_at_ms: 3000 }),
      makeTodo({ id: "t3" as ProjectTodoId, label: "Mid", updated_at_ms: 2000 }),
    ]);
    const list = store.get(projectTodoListAtom);
    expect(list.map((t) => t.label)).toEqual(["New", "Mid", "Old"]);
  });
});
