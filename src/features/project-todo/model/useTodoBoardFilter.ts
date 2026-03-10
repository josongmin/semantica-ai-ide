import { useMemo } from "react";
import { useAtomValue } from "jotai";

import { projectTodoListAtom } from "~entities/project-todo";

import {
  todoBoardFilterAtom,
  todoBoardSearchAtom,
  todoBoardSortAtom,
  type TodoSortKey,
} from "../../../shared/lib";
import type { ProjectTodo, ProjectTodoPriority, ProjectTodoStatus } from "../../../shared/protocol";

type GroupedTodos = Record<ProjectTodoStatus, readonly ProjectTodo[]>;

/** Sort a list immutably. "date" returns a copy as-is since projectTodoListAtom already sorts by updated_at_ms desc. */
function sortTodos(todos: readonly ProjectTodo[], key: TodoSortKey): ProjectTodo[] {
  switch (key) {
    case "date":
      return [...todos];
    case "priority": {
      const order: Record<ProjectTodoPriority, number> = { high: 0, medium: 1, low: 2 };
      return [...todos].sort((a, b) => order[a.priority] - order[b.priority]);
    }
    case "status": {
      const order: Record<ProjectTodoStatus, number> = {
        in_progress: 0,
        pending: 1,
        failed: 2,
        completed: 3,
      };
      return [...todos].sort((a, b) => order[a.status] - order[b.status]);
    }
  }
}

export function useTodoBoardFilter() {
  const todos = useAtomValue(projectTodoListAtom);
  const search = useAtomValue(todoBoardSearchAtom);
  const filter = useAtomValue(todoBoardFilterAtom);
  const sort = useAtomValue(todoBoardSortAtom);

  const filtered = useMemo(() => {
    let list: readonly ProjectTodo[] = todos;

    // 1. Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.label.toLowerCase().includes(q));
    }

    // 2. Status filter
    if (filter !== "all") {
      list = list.filter((t) => t.status === filter);
    }

    // 3. Sort
    return sortTodos(list, sort);
  }, [todos, search, filter, sort]);

  // Group by status for Kanban columns
  const grouped: GroupedTodos = useMemo(() => {
    return {
      pending: filtered.filter((t) => t.status === "pending"),
      in_progress: filtered.filter((t) => t.status === "in_progress"),
      completed: filtered.filter((t) => t.status === "completed"),
      failed: filtered.filter((t) => t.status === "failed"),
    };
  }, [filtered]);

  return { filtered, grouped, total: todos.length };
}
