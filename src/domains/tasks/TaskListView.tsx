import React, { memo, useCallback, useMemo, useRef } from "react";

import { formatRelativeTime } from "~shared/lib";
import { cn, Icon } from "~shared/ui";

import { useTaskListState } from "./hooks/useTaskSurfaceState";
import { EmptyState } from "./shared";
import {
  PRIORITY_META,
  type ProjectTask,
  SOURCE_META,
  STATUS_META,
  type TaskPriority,
  type TaskStatus,
} from "./taskAtoms";

// ─── List View ──────────────────────────────────────────

export const TaskListView = memo(function TaskListView() {
  const { tasks, selectedId, setSelectedId } = useTaskListState();
  const listRef = useRef<HTMLDivElement>(null);

  // Sort: blocked and critical first, then by updatedAt
  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const statusOrder: Record<TaskStatus, number> = { blocked: 0, "in-progress": 1, todo: 2, done: 3 };
      const priorityOrder: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const sd = statusOrder[a.status] - statusOrder[b.status];
      if (sd !== 0) return sd;
      const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pd !== 0) return pd;
      return b.updatedAt - a.updatedAt;
    });
  }, [tasks]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (sorted.length === 0) return;
      const currentIdx = sorted.findIndex((t) => t.id === selectedId);

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIdx = currentIdx < sorted.length - 1 ? currentIdx + 1 : 0;
        const nextTask = sorted[nextIdx];
        if (nextTask !== undefined) setSelectedId(nextTask.id);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : sorted.length - 1;
        const prevTask = sorted[prevIdx];
        if (prevTask !== undefined) setSelectedId(prevTask.id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedId(null);
      }
    },
    [sorted, selectedId, setSelectedId],
  );

  if (sorted.length === 0) {
    return <EmptyState />;
  }

  return (
    <div ref={listRef} className="flex flex-col h-full overflow-y-auto" onKeyDown={handleKeyDown} tabIndex={0} role="listbox" aria-label="Task list">
      {/* Header */}
      <div className="flex items-center h-8 px-4 text-2xs text-vsc-text-ghost uppercase tracking-wider font-medium shrink-0 border-b border-vsc-border/20 bg-vsc-surface-0/80 backdrop-blur-sm sticky top-0 z-(--z-sticky)">
        <span className="w-6" />
        <span className="w-16">Priority</span>
        <span className="flex-1">Title</span>
        <span className="w-16">Source</span>
        <span className="w-28">Labels</span>
        <span className="w-20 text-right">Updated</span>
        <span className="w-10" />
      </div>

      {/* Rows */}
      {sorted.map((task) => (
        <TaskRow key={task.id} task={task} isSelected={task.id === selectedId} onSelect={setSelectedId} />
      ))}
    </div>
  );
});

// ─── TaskRow ────────────────────────────────────────────

const TaskRow = memo(function TaskRow({
  task,
  isSelected,
  onSelect,
}: {
  task: ProjectTask;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const statusMeta = STATUS_META[task.status];
  const priorityMeta = PRIORITY_META[task.priority];
  const sourceMeta = SOURCE_META[task.source];

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(task.id)}
      className={cn(
        "flex items-center w-full h-10 px-4 text-left transition-colors duration-fast",
        "border-b border-vsc-border/10 shrink-0",
        isSelected
          ? "bg-vsc-accent/8 border-l-2 border-l-vsc-accent"
          : "hover:bg-vsc-list-hover border-l-2 border-l-transparent",
        task.status === "done" && "opacity-60",
      )}
    >
      {/* Status icon */}
      <span className="w-6 flex items-center justify-center shrink-0">
        <Icon name={statusMeta.icon} tokenSize="xs" className={statusMeta.color} title={statusMeta.label} />
      </span>

      {/* Priority badge */}
      <span className="w-16 shrink-0">
        <span className={cn("inline-flex items-center h-[18px] px-1.5 rounded text-2xs font-medium", priorityMeta.bg, priorityMeta.color)}>
          {priorityMeta.label}
        </span>
      </span>

      {/* Title */}
      <span className={cn("flex-1 text-xs truncate pr-3", task.status === "done" ? "text-vsc-text-tertiary line-through" : "text-vsc-text-primary")}>
        {task.title}
      </span>

      {/* Source */}
      <span className="w-16 shrink-0 flex items-center gap-1">
        <Icon name={sourceMeta.icon} tokenSize="2xs" className={sourceMeta.color} />
        <span className="text-2xs text-vsc-text-ghost">{sourceMeta.label}</span>
      </span>

      {/* Labels */}
      <span className="w-28 shrink-0 flex items-center gap-1 overflow-hidden">
        {(task.labels ?? []).slice(0, 2).map((label) => (
          <span
            key={label}
            className="inline-flex h-[16px] px-1.5 rounded-full bg-vsc-surface-2 text-2xs text-vsc-text-tertiary truncate max-w-[60px]"
          >
            {label}
          </span>
        ))}
        {(task.labels ?? []).length > 2 && <span className="text-2xs text-vsc-text-ghost">+{(task.labels ?? []).length - 2}</span>}
      </span>

      {/* Updated */}
      <span className="w-20 text-right text-2xs text-vsc-text-ghost shrink-0">{formatRelativeTime(task.updatedAt)}</span>

      {/* Actions spacer */}
      <span className="w-10 shrink-0" />
    </button>
  );
});
