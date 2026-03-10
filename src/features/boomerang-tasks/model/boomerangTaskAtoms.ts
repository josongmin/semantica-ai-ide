/**
 * Boomerang Task atoms for subtask delegation.
 *
 * A parent turn spawns subtasks (BoomerangTasks) that are delegated to agents
 * and merge results back when complete.
 */
import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { BoomerangTask, TurnId } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** All boomerang tasks keyed by id */
export const boomerangTasksAtom = atom<ReadonlyMap<string, BoomerangTask>>(new Map());

/** Write-only: replace all boomerang tasks from a serverEvent payload */
export const setBoomerangTasksAtom = atom(null, (get, set, tasks: readonly BoomerangTask[]) => {
  const existing = new Map(get(boomerangTasksAtom));
  for (const task of tasks) {
    existing.set(task.id, task);
  }
  set(boomerangTasksAtom, existing);
});

// ─── Derived: Group by Turn ──────────────────────────────────

/** Derived: groups boomerang tasks by parent_turn_id */
export const boomerangTasksByTurnMapAtom = atom((get) => {
  const map = get(boomerangTasksAtom);
  const grouped = new Map<TurnId, readonly BoomerangTask[]>();
  const temp = new Map<string, BoomerangTask[]>();

  for (const task of map.values()) {
    const key = task.parent_turn_id as string;
    const existing = temp.get(key);
    if (existing) {
      existing.push(task);
    } else {
      temp.set(key, [task]);
    }
  }

  for (const [key, tasks] of temp) {
    grouped.set(key as TurnId, tasks);
  }
  return grouped;
});

/** AtomFamily: get boomerang tasks for a specific turn */
export const boomerangTasksByTurnAtom = createBoundedAtomFamily(
  (turnId: TurnId) =>
    atom((get) => {
      return get(boomerangTasksByTurnMapAtom).get(turnId) ?? [];
    }),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(boomerangTasksByTurnAtom, "boomerangTasksByTurnAtom");

/** Derived: check if all tasks for a turn are complete */
export const allBoomerangTasksCompleteAtom = createBoundedAtomFamily(
  (turnId: TurnId) =>
    atom((get) => {
      const tasks = get(boomerangTasksByTurnAtom(turnId));
      if (tasks.length === 0) return false;
      return tasks.every((t) => t.status === "success" || t.status === "error");
    }),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(allBoomerangTasksCompleteAtom, "allBoomerangTasksCompleteAtom");

/** Write-only: reset all boomerang tasks */
export const resetBoomerangTasksStoreAtom = atom(null, (_get, set) => {
  set(boomerangTasksAtom, new Map());
});

registerResetAtom(resetBoomerangTasksStoreAtom);
