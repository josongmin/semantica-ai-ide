import React, { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { projectTodosByTurnAtom } from "~entities/project-todo";

import { useProjectTodoActions } from "../../features/project-todo";
import { currentPageAtom } from "../../shared/lib";
import type { TurnId } from "../../shared/protocol";
import { Collapsible, Icon, ProgressBar } from "../../shared/ui";
import { ProjectTodoItemRow } from "./ProjectTodoItemRow";

const MAX_VISIBLE_ITEMS = 5;

interface ProjectTodoCardWidgetProps {
  turnId: TurnId;
}

export const ProjectTodoCardWidget = React.memo(function ProjectTodoCardWidget({
  turnId,
}: ProjectTodoCardWidgetProps) {
  const todos = useAtomValue(projectTodosByTurnAtom(turnId));
  const setPage = useSetAtom(currentPageAtom);
  const { loadTodos } = useProjectTodoActions();

  const openTodoBoard = useCallback(() => {
    loadTodos();
    setPage("todos");
  }, [loadTodos, setPage]);

  const counts = useMemo(() => {
    let pending = 0, inProgress = 0, completed = 0, failed = 0;
    for (const t of todos) {
      switch (t.status) {
        case "pending": pending++; break;
        case "in_progress": inProgress++; break;
        case "completed": completed++; break;
        case "failed": failed++; break;
      }
    }
    return { total: todos.length, pending, inProgress, completed, failed };
  }, [todos]);

  const summaryText = useMemo(() => {
    if (counts.total === 0) return "";
    const parts: string[] = [];
    if (counts.pending > 0) parts.push(`${counts.pending} pending`);
    if (counts.inProgress > 0) parts.push(`${counts.inProgress} active`);
    if (counts.completed > 0) parts.push(`${counts.completed} done`);
    if (counts.failed > 0) parts.push(`${counts.failed} failed`);
    return parts.join(", ");
  }, [counts]);

  if (counts.total === 0) return null;

  const isAllDone = counts.completed + counts.failed === counts.total;
  const activeTodos = todos.filter((t) => t.status !== "completed");
  const visibleTodos =
    activeTodos.length > 0
      ? activeTodos.slice(0, MAX_VISIBLE_ITEMS)
      : todos.slice(0, MAX_VISIBLE_ITEMS);
  const remaining = todos.length - MAX_VISIBLE_ITEMS;

  return (
    <Collapsible
      title="Project TODOs"
      icon="tasklist"
      badge={`${counts.pending + counts.inProgress}`}
      summary={summaryText}
      defaultCollapsed={false}
      headerRight={
        <div className="flex items-center gap-1">
          <ProgressBar
            value={counts.completed}
            max={counts.total}
            label={`${Math.round((counts.completed / counts.total) * 100)}%`}
            className="w-16"
            barClassName={(() => { if (counts.failed > 0) return "bg-vsc-error"; if (isAllDone) return "bg-vsc-success"; return "bg-vsc-info"; })()}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openTodoBoard();
            }}
            aria-label="Open TODO board"
            className="flex items-center justify-center p-0.5 rounded hover:bg-vsc-toolbar
                       transition-colors duration-fast cursor-pointer focus-ring"
          >
            <Icon
              name="link-external"
              tokenSize="2xs"
              className="text-vsc-text-tertiary hover:text-vsc-text-primary transition-colors duration-fast"
            />
          </button>
        </div>
      }
    >
      <div role="list" className="space-y-0.5">
        {visibleTodos.map((todo) => (
          <ProjectTodoItemRow key={todo.id} todo={todo} />
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={openTodoBoard}
            aria-label={`View all ${todos.length} TODOs`}
            className="w-full text-left px-1 py-0.5 text-xs text-vsc-text-tertiary
                       hover:text-vsc-text-secondary transition-colors duration-fast cursor-pointer focus-ring"
          >
            +{remaining} more — View all
          </button>
        )}
      </div>
    </Collapsible>
  );
});
