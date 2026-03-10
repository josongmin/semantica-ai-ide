import React from "react";

import type { ProjectTodo, ProjectTodoId, ProjectTodoStatus } from "../../shared/protocol";
import { Collapsible, EmptyState } from "../../shared/ui";
import { TodoBoardCard } from "./TodoBoardCard";

interface TodoBoardColumnProps {
  status: ProjectTodoStatus;
  todos: readonly ProjectTodo[];
  onUpdateStatus: (id: ProjectTodoId, status: ProjectTodoStatus) => void;
  onDelete: (todo: ProjectTodo) => void;
}

const columnLabels: Record<ProjectTodoStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Failed",
};

const columnIcons: Record<ProjectTodoStatus, string> = {
  pending: "circle-outline",
  in_progress: "play",
  completed: "check",
  failed: "error",
};

export const TodoBoardColumn = React.memo(function TodoBoardColumn({
  status,
  todos,
  onUpdateStatus,
  onDelete,
}: TodoBoardColumnProps) {
  return (
    <Collapsible
      title={columnLabels[status]}
      icon={columnIcons[status]}
      badge={todos.length}
      defaultCollapsed={status === "completed" && todos.length > 5}
    >
      {todos.length === 0 ? (
        <EmptyState icon="inbox" title={`No ${columnLabels[status].toLowerCase()} items`} />
      ) : (
        <div className="space-y-1">
          {todos.map((todo) => (
            <TodoBoardCard
              key={todo.id}
              todo={todo}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </Collapsible>
  );
});
