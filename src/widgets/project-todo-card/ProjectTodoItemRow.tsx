import React from "react";

import { PRIORITY_VARIANTS, STATUS_COLORS, STATUS_ICONS } from "../../shared/lib";
import type { ProjectTodo } from "../../shared/protocol";
import { Badge, cn, Icon, Spinner, Text } from "../../shared/ui";

interface ProjectTodoItemRowProps {
  todo: ProjectTodo;
}

export const ProjectTodoItemRow = React.memo(
  function ProjectTodoItemRow({ todo }: ProjectTodoItemRowProps) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 py-0.5 px-1 rounded-md text-xs",
          "transition-colors duration-fast",
          todo.status === "completed" && "opacity-70",
        )}
        role="listitem"
        aria-label={`${todo.label}: ${todo.status}`}
      >
        {todo.status === "in_progress" ? (
          <Spinner size="sm" className="text-vsc-info shrink-0" />
        ) : (
          <Icon
            name={STATUS_ICONS[todo.status]}
            tokenSize="2xs"
            className={cn("shrink-0", STATUS_COLORS[todo.status])}
          />
        )}
        <Text
          size="sm"
          tone={todo.status === "completed" ? "tertiary" : "primary"}
          className={cn("flex-1 truncate", todo.status === "completed" && "line-through")}
        >
          {todo.label}
        </Text>
        <Badge
          text={todo.priority}
          variant={PRIORITY_VARIANTS[todo.priority]}
          className="shrink-0 text-xs"
        />
      </div>
    );
  },
  (prev, next) =>
    prev.todo.id === next.todo.id &&
    prev.todo.status === next.todo.status &&
    prev.todo.label === next.todo.label &&
    prev.todo.priority === next.todo.priority,
);
