import { useCallback } from "react";
import { useSetAtom } from "jotai";

import { deleteProjectTodoAtom, updateProjectTodoStatusAtom } from "~entities/project-todo";

import { getVscodeApi } from "../../../shared/lib";
import type {
  ProjectTodoId,
  ProjectTodoPriority,
  ProjectTodoStatus,
} from "../../../shared/protocol";

export function useProjectTodoActions() {
  const setUpdateStatus = useSetAtom(updateProjectTodoStatusAtom);
  const setDelete = useSetAtom(deleteProjectTodoAtom);

  const loadTodos = useCallback(() => {
    getVscodeApi().postMessage({ type: "LOAD_PROJECT_TODOS" });
  }, []);

  const addTodo = useCallback((label: string, priority: ProjectTodoPriority) => {
    getVscodeApi().postMessage({ type: "ADD_PROJECT_TODO", label, priority });
  }, []);

  const updateStatus = useCallback(
    (id: ProjectTodoId, status: ProjectTodoStatus) => {
      // Optimistic update
      setUpdateStatus({ id, status });
      getVscodeApi().postMessage({ type: "UPDATE_PROJECT_TODO", id, status });
    },
    [setUpdateStatus],
  );

  const deleteTodo = useCallback(
    (id: ProjectTodoId) => {
      // Optimistic delete
      setDelete(id);
      getVscodeApi().postMessage({ type: "DELETE_PROJECT_TODO", id });
    },
    [setDelete],
  );

  return { loadTodos, addTodo, updateStatus, deleteTodo };
}
