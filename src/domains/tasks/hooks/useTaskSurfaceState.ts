import { useAtom, useAtomValue, useSetAtom } from "jotai";

import {
  addTaskAtom,
  filteredTasksAtom,
  type ProjectTask,
  selectedTaskAtom,
  selectedTaskIdAtom,
  taskCountsByStatusAtom,
  taskFilterAtom,
  type TaskPriority,
  type TaskStatus,
  taskViewModeAtom,
} from "../taskAtoms";

export function useTaskSurfaceState() {
  const viewMode = useAtomValue(taskViewModeAtom);
  const selectedTask = useAtomValue(selectedTaskAtom);

  return { viewMode, selectedTask } as const;
}

export function useTaskToolbarState() {
  const [viewMode, setViewMode] = useAtom(taskViewModeAtom);
  const [filter, setFilter] = useAtom(taskFilterAtom);
  const counts = useAtomValue(taskCountsByStatusAtom);
  const addTask = useSetAtom(addTaskAtom);

  const totalCount = counts.todo + counts["in-progress"] + counts.done + counts.blocked;

  return { viewMode, setViewMode, filter, setFilter, counts, totalCount, addTask } as const;
}

export function useTaskListState() {
  const tasks = useAtomValue(filteredTasksAtom);
  const [selectedId, setSelectedId] = useAtom(selectedTaskIdAtom);

  return { tasks, selectedId, setSelectedId } as const;
}

export function useTaskBoardState() {
  const tasks = useAtomValue(filteredTasksAtom);
  const selectedId = useAtomValue(selectedTaskIdAtom);
  const setSelectedId = useSetAtom(selectedTaskIdAtom);

  return { tasks, selectedId, setSelectedId } as const;
}

export type { ProjectTask, TaskPriority, TaskStatus };
