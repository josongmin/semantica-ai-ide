import { memo, useMemo } from "react";

import { cn, Icon } from "~shared/ui";

import { useTaskBoardState } from "./hooks/useTaskSurfaceState";
import { EmptyState } from "./shared";
import {
  ALL_STATUSES,
  PRIORITY_META,
  type ProjectTask,
  SOURCE_META,
  STATUS_META,
  type TaskPriority,
  type TaskStatus,
} from "./taskAtoms";

// ─── Board View ─────────────────────────────────────────

export const TaskBoardView = memo(function TaskBoardView() {
  const { tasks, selectedId, setSelectedId } = useTaskBoardState();

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, ProjectTask[]> = { todo: [], "in-progress": [], done: [], blocked: [] };
    for (const t of tasks) grouped[t.status].push(t);
    // Sort within each column by priority then updatedAt
    const priorityOrder: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    for (const status of ALL_STATUSES) {
      grouped[status].sort((a, b) => {
        const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pd !== 0) return pd;
        return b.updatedAt - a.updatedAt;
      });
    }
    return grouped;
  }, [tasks]);

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex h-full overflow-x-auto p-3 gap-3">
      {ALL_STATUSES.map((status) => (
        <BoardColumn
          key={status}
          status={status}
          tasks={columns[status]}
          selectedId={selectedId}
          onSelectTask={setSelectedId}
        />
      ))}
    </div>
  );
});

// ─── BoardColumn ────────────────────────────────────────

const BoardColumn = memo(function BoardColumn({
  status,
  tasks,
  selectedId,
  onSelectTask,
}: {
  status: TaskStatus;
  tasks: readonly ProjectTask[];
  selectedId: string | null;
  onSelectTask: (id: string) => void;
}) {
  const meta = STATUS_META[status];

  return (
    <div className="flex flex-col min-w-[260px] w-[260px] shrink-0 rounded-lg bg-vsc-surface-1/50 border border-vsc-border/20">
      {/* Column header */}
      <div className="flex items-center h-9 px-3 gap-2 shrink-0 border-b border-vsc-border/20">
        <Icon name={meta.icon} tokenSize="xs" className={meta.color} />
        <span className="text-xs font-medium text-vsc-text-primary">{meta.label}</span>
        <span className="ml-auto min-w-[20px] h-[18px] px-1.5 rounded-full bg-vsc-surface-2 text-2xs text-vsc-text-ghost text-center leading-[18px]">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col flex-1 overflow-y-auto p-2 gap-2">
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-2xs text-vsc-text-ghost">No tasks</div>
        )}
        {tasks.map((task) => (
          <BoardCard key={task.id} task={task} isSelected={task.id === selectedId} onSelect={onSelectTask} />
        ))}
      </div>
    </div>
  );
});

// ─── BoardCard ──────────────────────────────────────────

const BoardCard = memo(function BoardCard({
  task,
  isSelected,
  onSelect,
}: {
  task: ProjectTask;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const priorityMeta = PRIORITY_META[task.priority];
  const sourceMeta = SOURCE_META[task.source];

  return (
    <button
      type="button"
      onClick={() => onSelect(task.id)}
      className={cn(
        "flex flex-col w-full p-2.5 rounded-md text-left transition-all duration-fast",
        "border bg-vsc-surface-0 hover:bg-vsc-list-hover",
        isSelected ? "border-vsc-accent/50 shadow-sm ring-1 ring-vsc-accent/20" : "border-vsc-border/20",
      )}
    >
      {/* Priority indicator + title */}
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5 w-2 h-2 rounded-full shrink-0", priorityMeta.bg.replace("/15", ""))} />
        <span className={cn("text-xs leading-snug text-vsc-text-primary", task.status === "done" && "line-through opacity-60")}>
          {task.title}
        </span>
      </div>

      {/* Bottom row: source + labels */}
      <div className="flex items-center gap-1.5 mt-2 ml-4">
        <span className="flex items-center gap-1">
          <Icon name={sourceMeta.icon} tokenSize="2xs" className={cn(sourceMeta.color, "opacity-70")} />
          <span className="text-2xs text-vsc-text-ghost">{sourceMeta.label}</span>
        </span>
        {(task.labels ?? []).length > 0 && (
          <>
            <span className="w-px h-3 bg-vsc-border/30 mx-0.5" />
            {(task.labels ?? []).slice(0, 2).map((label) => (
              <span
                key={label}
                className="inline-flex h-[14px] px-1 rounded bg-vsc-surface-2 text-2xs text-vsc-text-ghost leading-[14px]"
              >
                {label}
              </span>
            ))}
          </>
        )}
      </div>
    </button>
  );
});
