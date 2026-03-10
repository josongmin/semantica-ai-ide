import React, { useCallback } from "react";

import {
  formatRelativeTime,
  PRIORITY_VARIANTS,
  STATUS_COLORS,
  STATUS_ICONS,
} from "../../shared/lib";
import type { ProjectTodo, ProjectTodoId, ProjectTodoStatus } from "../../shared/protocol";
import { Badge, Button, cn, Icon, Spinner, Text } from "../../shared/ui";

interface TodoBoardCardProps {
  todo: ProjectTodo;
  onUpdateStatus: (id: ProjectTodoId, status: ProjectTodoStatus) => void;
  onDelete: (todo: ProjectTodo) => void;
}

/** Status transitions available for each current status */
const nextStatuses: Record<ProjectTodoStatus, readonly ProjectTodoStatus[]> = {
  pending: ["in_progress", "completed"],
  in_progress: ["completed", "failed"],
  completed: ["pending"],
  failed: ["pending", "in_progress"],
};

const statusActionIcons: Record<ProjectTodoStatus, string> = {
  pending: "circle-outline",
  in_progress: "play",
  completed: "check",
  failed: "error",
};

const statusActionLabels: Record<ProjectTodoStatus, string> = {
  pending: "Reopen",
  in_progress: "Start",
  completed: "Complete",
  failed: "Mark failed",
};

/** Individual status transition button -- avoids inline arrow in .map() */
const TransitionButton = React.memo(function TransitionButton({
  todoId,
  status,
  onUpdateStatus,
}: {
  todoId: ProjectTodoId;
  status: ProjectTodoStatus;
  onUpdateStatus: (id: ProjectTodoId, status: ProjectTodoStatus) => void;
}) {
  const handleClick = useCallback(
    () => onUpdateStatus(todoId, status),
    [onUpdateStatus, todoId, status],
  );
  return (
    <Button
      variant="ghost"
      size="icon"
      icon={statusActionIcons[status]}
      onClick={handleClick}
      title={statusActionLabels[status]}
      aria-label={statusActionLabels[status]}
    />
  );
});

export const TodoBoardCard = React.memo(function TodoBoardCard({
  todo,
  onUpdateStatus,
  onDelete,
}: TodoBoardCardProps) {
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(todo);
    },
    [todo, onDelete],
  );

  const transitions = nextStatuses[todo.status];

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`${todo.label}: ${todo.status}, ${todo.priority} priority`}
      className={cn(
        "group flex flex-col gap-1 px-2.5 py-2 rounded-md border border-vsc-border",
        "hover:bg-vsc-list-hover focus:bg-vsc-list-hover transition-colors duration-fast focus-ring",
        todo.status === "completed" && "opacity-70",
      )}
      data-testid={`todo-card-${todo.id}`}
    >
      {/* Main row: status icon + label + priority badge */}
      <div className="flex items-center gap-1.5">
        {todo.status === "in_progress" ? (
          <Spinner size="sm" className="text-vsc-info shrink-0" />
        ) : (
          <Icon
            name={STATUS_ICONS[todo.status]}
            tokenSize="xs"
            className={cn("shrink-0", STATUS_COLORS[todo.status])}
          />
        )}
        <Text
          size="sm"
          weight="medium"
          tone="primary"
          className={cn("flex-1 truncate", todo.status === "completed" && "line-through")}
        >
          {todo.label}
        </Text>
        <Badge
          text={todo.priority}
          variant={PRIORITY_VARIANTS[todo.priority]}
          className="shrink-0"
        />
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-2 pl-5">
        <Text size="2xs" tone="ghost" mono>
          {formatRelativeTime(todo.updated_at_ms)}
        </Text>
        {todo.source_session_ids.length > 0 && (
          <Text size="2xs" tone="ghost">
            {todo.source_session_ids.length} session
            {todo.source_session_ids.length !== 1 ? "s" : ""}
          </Text>
        )}
      </div>

      {/* Hover action bar */}
      <div
        className="flex items-center gap-1 pl-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100
                   transition-opacity duration-fast"
      >
        {transitions.map((s) => (
          <TransitionButton key={s} todoId={todo.id} status={s} onUpdateStatus={onUpdateStatus} />
        ))}
        <Button
          variant="ghost"
          size="icon"
          icon="trash"
          onClick={handleDelete}
          title="Delete"
          aria-label="Delete"
          className="text-vsc-text-tertiary hover:text-vsc-error transition-colors duration-fast"
        />
      </div>
    </div>
  );
});
