import React, { useCallback } from "react";

import { useProjectTodoActions, useTodoBoardFilter } from "../../features/project-todo";
import type { ProjectTodo, ProjectTodoId, ProjectTodoStatus } from "../../shared/protocol";
import { EmptyState, ErrorBoundary, InlineBanner } from "../../shared/ui";
import { TodoBoardColumn } from "./TodoBoardColumn";

interface TodoBoardProps {
  onDelete: (todo: ProjectTodo) => void;
}

const COLUMN_ORDER: readonly ProjectTodoStatus[] = [
  "in_progress",
  "pending",
  "failed",
  "completed",
];

export const TodoBoard = React.memo(function TodoBoard({ onDelete }: TodoBoardProps) {
  const { grouped, total } = useTodoBoardFilter();
  const { updateStatus } = useProjectTodoActions();

  const handleUpdateStatus = useCallback(
    (id: ProjectTodoId, status: ProjectTodoStatus) => {
      updateStatus(id, status);
    },
    [updateStatus],
  );

  if (total === 0) {
    return (
      <EmptyState
        icon="tasklist"
        title="No project TODOs yet"
        description="TODOs will appear here as the agent creates tasks across sessions"
      />
    );
  }

  return (
    <div className="space-y-0.5 py-1" role="region" aria-label="Todo board">
      {COLUMN_ORDER.map((status) => {
        const todos = grouped[status];
        // Hide empty completed/failed columns when no items
        if (todos.length === 0 && (status === "completed" || status === "failed")) return null;
        return (
          <ErrorBoundary
            key={status}
            fallback={<InlineBanner variant="error">Column failed to render</InlineBanner>}
          >
            <TodoBoardColumn
              status={status}
              todos={todos}
              onUpdateStatus={handleUpdateStatus}
              onDelete={onDelete}
            />
          </ErrorBoundary>
        );
      })}
    </div>
  );
});
