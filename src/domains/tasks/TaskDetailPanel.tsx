import React, { memo, useCallback, useEffect } from "react";
import { useSetAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import {
  ALL_STATUSES,
  deleteTaskAtom,
  PRIORITY_META,
  type ProjectTask,
  selectedTaskIdAtom,
  SOURCE_META,
  STATUS_META,
  type TaskStatus,
  updateTaskStatusAtom,
} from "./taskAtoms";

// ─── Detail Panel ───────────────────────────────────────

export const TaskDetailPanel = memo(function TaskDetailPanel({ task }: { task: ProjectTask }) {
  const setSelectedId = useSetAtom(selectedTaskIdAtom);
  const updateStatus = useSetAtom(updateTaskStatusAtom);
  const deleteTask = useSetAtom(deleteTaskAtom);

  const statusMeta = STATUS_META[task.status];
  const priorityMeta = PRIORITY_META[task.priority];
  const sourceMeta = SOURCE_META[task.source];

  const handleClose = useCallback(() => setSelectedId(null), [setSelectedId]);

  const handleStatusChange = useCallback(
    (status: TaskStatus) => {
      updateStatus({ id: task.id, status });
    },
    [task.id, updateStatus],
  );

  const handleDelete = useCallback(() => {
    deleteTask(task.id);
  }, [task.id, deleteTask]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setSelectedId]);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col w-full sm:w-[360px] sm:shrink-0 border-l border-vsc-border/40 bg-vsc-surface-0 overflow-y-auto animate-[slideInRight_150ms_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-4 shrink-0 border-b border-vsc-border/20">
        <span className="text-xs font-medium text-vsc-text-secondary">Task Details</span>
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-vsc-list-hover transition-colors duration-fast text-vsc-text-ghost hover:text-vsc-text-secondary focus-ring"
          title="Close (Esc)"
        >
          <Icon name="close" tokenSize="xs" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col p-4 gap-5">
        {/* Title */}
        <div>
          <h3 className="text-sm font-semibold text-vsc-text-primary leading-snug">{task.title}</h3>
          <span className="text-2xs text-vsc-text-ghost mt-1 block">{task.id}</span>
        </div>

        {/* Status + Priority row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Icon name={statusMeta.icon} tokenSize="xs" className={statusMeta.color} />
            <span className={cn("text-xs font-medium", statusMeta.color)}>{statusMeta.label}</span>
          </div>
          <span className="w-px h-4 bg-vsc-border/30" />
          <span className={cn("inline-flex items-center h-[20px] px-2 rounded text-2xs font-medium", priorityMeta.bg, priorityMeta.color)}>
            {priorityMeta.label} priority
          </span>
        </div>

        {/* Description */}
        {task.description !== "" && (
          <div>
            <DetailLabel>Description</DetailLabel>
            <p className="text-xs text-vsc-text-secondary leading-relaxed mt-1">{task.description}</p>
          </div>
        )}

        {/* Source */}
        <div>
          <DetailLabel>Source</DetailLabel>
          <div className="flex items-center gap-1.5 mt-1">
            <Icon name={sourceMeta.icon} tokenSize="xs" className={sourceMeta.color} />
            <span className="text-xs text-vsc-text-secondary">{sourceMeta.label}</span>
          </div>
        </div>

        {/* Assignee */}
        {task.assignee !== undefined && (
          <div>
            <DetailLabel>Assignee</DetailLabel>
            <div className="flex items-center gap-1.5 mt-1">
              <Icon name="person" tokenSize="xs" className="text-vsc-text-tertiary" />
              <span className="text-xs text-vsc-text-secondary">{task.assignee}</span>
            </div>
          </div>
        )}

        {/* File paths */}
        {task.filePaths !== undefined && task.filePaths.length > 0 && (
          <div>
            <DetailLabel>Files</DetailLabel>
            <div className="flex flex-col gap-1 mt-1">
              {task.filePaths.map((fp) => (
                <span
                  key={fp}
                  className="inline-flex items-center gap-1.5 text-xs text-vsc-accent hover:text-vsc-accent/80 cursor-pointer transition-colors duration-fast truncate"
                  title={fp}
                >
                  <Icon name="file" tokenSize="2xs" className="shrink-0 opacity-60" />
                  <span className="truncate">{fp}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        {task.labels !== undefined && task.labels.length > 0 && (
          <div>
            <DetailLabel>Labels</DetailLabel>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {task.labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex h-[22px] px-2 rounded-full bg-vsc-surface-2 text-xs text-vsc-text-secondary items-center"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Blocked by */}
        {task.blockedBy !== undefined && task.blockedBy.length > 0 && (
          <div>
            <DetailLabel>Blocked By</DetailLabel>
            <div className="flex flex-col gap-1 mt-1">
              {task.blockedBy.map((bid) => (
                <span key={bid} className="flex items-center gap-1.5 text-xs text-vsc-error/80">
                  <Icon name="debug-disconnect" tokenSize="2xs" />
                  <span>{bid}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Estimated time */}
        {task.estimatedMinutes !== undefined && (
          <div>
            <DetailLabel>Estimated Time</DetailLabel>
            <span className="text-xs text-vsc-text-secondary mt-1 block">
              {task.estimatedMinutes >= 60
                ? `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`
                : `${task.estimatedMinutes}m`}
            </span>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-vsc-border/20">
          <TimestampRow label="Created" value={formatDate(task.createdAt)} />
          <TimestampRow label="Updated" value={formatDate(task.updatedAt)} />
          {task.completedAt !== undefined && <TimestampRow label="Completed" value={formatDate(task.completedAt)} />}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-vsc-border/20">
          {/* Status change buttons */}
          <DetailLabel>Change Status</DetailLabel>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.filter((s) => s !== task.status).map((s) => {
              const m = STATUS_META[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "flex items-center gap-1 h-7 px-2.5 rounded-md text-xs transition-colors duration-fast",
                    "bg-vsc-surface-1 hover:bg-vsc-surface-2 text-vsc-text-secondary focus-ring",
                  )}
                >
                  <Icon name={m.icon} tokenSize="2xs" className={m.color} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick complete for non-done tasks */}
          {task.status !== "done" && (
            <button
              type="button"
              onClick={() => handleStatusChange("done")}
              className={cn(
                "flex items-center justify-center gap-1.5 h-8 px-4 mt-1 rounded-md text-xs font-medium",
                "bg-vsc-success/15 text-vsc-success hover:bg-vsc-success/25",
                "transition-colors duration-fast focus-ring",
              )}
            >
              <Icon name="check" tokenSize="xs" />
              <span>Mark Complete</span>
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              "flex items-center justify-center gap-1.5 h-7 px-4 rounded-md text-xs",
              "text-vsc-error/70 hover:bg-vsc-error/10 hover:text-vsc-error",
              "transition-colors duration-fast focus-ring",
            )}
          >
            <Icon name="trash" tokenSize="2xs" />
            <span>Delete Task</span>
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Sub-components ─────────────────────────────────────

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-2xs text-vsc-text-ghost uppercase tracking-wider font-medium">{children}</span>;
}

function TimestampRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-2xs text-vsc-text-ghost">{label}</span>
      <span className="text-2xs text-vsc-text-tertiary">{value}</span>
    </div>
  );
}
