import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import type { ProjectTodo, ProjectTodoId, ProjectTodoStatus } from "~shared/protocol";

// ─── Core Storage ────────────────────────────────────────
// Single Map atom (not atomFamily) — project TODOs are a small, cross-session collection
// rendered as a whole list. No per-item subscription isolation needed.

export const projectTodoMapAtom = atom<ReadonlyMap<ProjectTodoId, ProjectTodo>>(new Map());

// ─── Write Atoms ─────────────────────────────────────────

/** Replace entire TODO map from host sync */
export const syncProjectTodosAtom = atom(null, (_get, set, todos: readonly ProjectTodo[]) => {
  const map = new Map<ProjectTodoId, ProjectTodo>();
  for (const todo of todos) {
    map.set(todo.id, todo);
  }
  set(projectTodoMapAtom, map);
});

/** Add or update a single TODO */
export const upsertProjectTodoAtom = atom(null, (get, set, todo: ProjectTodo) => {
  const prev = get(projectTodoMapAtom);
  const next = new Map(prev);
  next.set(todo.id, todo);
  set(projectTodoMapAtom, next);
});

/** Update only the status of a TODO */
export const updateProjectTodoStatusAtom = atom(
  null,
  (get, set, payload: { id: ProjectTodoId; status: ProjectTodoStatus }) => {
    const prev = get(projectTodoMapAtom);
    const existing = prev.get(payload.id);
    if (!existing) return;
    const next = new Map(prev);
    next.set(payload.id, {
      ...existing,
      status: payload.status,
      updated_at_ms: Date.now(),
    });
    set(projectTodoMapAtom, next);
  },
);

/** Delete a single TODO */
export const deleteProjectTodoAtom = atom(null, (get, set, id: ProjectTodoId) => {
  const prev = get(projectTodoMapAtom);
  if (!prev.has(id)) return;
  const next = new Map(prev);
  next.delete(id);
  set(projectTodoMapAtom, next);
});

// ─── Derived Atoms (read-only) ──────────────────────────

/** Sorted TODO list (most recently updated first) */
export const projectTodoListAtom = atom((get) => {
  const map = get(projectTodoMapAtom);
  return [...map.values()].sort((a, b) => b.updated_at_ms - a.updated_at_ms);
});

/** Aggregate counts by status */
export const projectTodoCountsAtom = atom((get) => {
  const map = get(projectTodoMapAtom);
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let failed = 0;
  for (const todo of map.values()) {
    switch (todo.status) {
      case "pending":
        pending++;
        break;
      case "in_progress":
        inProgress++;
        break;
      case "completed":
        completed++;
        break;
      case "failed":
        failed++;
        break;
    }
  }
  return { total: map.size, pending, inProgress, completed, failed };
});

/** Count of actionable TODOs (pending + in_progress) — for HeaderBar badge */
export const pendingTodoCountAtom = atom((get) => {
  const counts = get(projectTodoCountsAtom);
  return counts.pending + counts.inProgress;
});

/** TODOs originating from a specific turn (by source_turn_id) */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- atomFamily migration to jotai-family tracked separately
export const projectTodosByTurnAtom = atomFamily(
  (turnId: string) =>
    atom((get) => {
      const map = get(projectTodoMapAtom);
      const result: ProjectTodo[] = [];
      for (const todo of map.values()) {
        if (todo.source_turn_id === turnId) result.push(todo);
      }
      return result.sort((a, b) => b.updated_at_ms - a.updated_at_ms);
    }),
  (a: string, b: string) => a === b,
);

// NOTE: No resetProjectTodoStoreAtom — project TODOs persist across sessions.
// They are NOT cleared by RESET_STORES.
