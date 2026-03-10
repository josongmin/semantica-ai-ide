import React, { memo, useCallback, useEffect, useRef, useState } from "react";

import { cn, Icon } from "~shared/ui";

import { useTaskToolbarState } from "./hooks/useTaskSurfaceState";
import {
  ALL_PRIORITIES,
  ALL_STATUSES,
  PRIORITY_META,
  STATUS_META,
  type TaskPriority,
  type TaskStatus,
} from "./taskAtoms";

// ─── TaskToolbar ────────────────────────────────────────────

export const TaskToolbar = memo(function TaskToolbar() {
  const { viewMode, setViewMode, filter, setFilter, counts, totalCount, addTask } = useTaskToolbarState();
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const priorityRef = useRef<HTMLButtonElement>(null);

  const handleStatusFilter = useCallback(
    (status: TaskStatus | null) => {
      setFilter({ ...filter, status });
    },
    [setFilter, filter],
  );

  const handlePriorityFilter = useCallback(
    (priority: TaskPriority | null) => {
      setFilter({ ...filter, priority });
      setShowPriorityMenu(false);
    },
    [setFilter, filter],
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilter({ ...filter, search: e.target.value });
    },
    [setFilter, filter],
  );

  const handleAddTask = useCallback(() => {
    const id = `task-${Date.now().toString(36)}`;
    addTask({
      id,
      title: "New task",
      description: "",
      status: "todo",
      priority: "medium",
      source: "user",
      labels: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }, [addTask]);

  // Close priority dropdown on outside click
  useEffect(() => {
    if (!showPriorityMenu) return;
    const handler = (e: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setShowPriorityMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPriorityMenu]);

  return (
    <div className="flex flex-col shrink-0 border-b border-vsc-border/40 bg-vsc-surface-0">
      {/* Top row: view toggle, search, add */}
      <div className="flex items-center h-[--height-row-lg] px-3 gap-2">
        {/* View mode toggle */}
        <div className="flex items-center rounded-md bg-vsc-surface-1 p-0.5 gap-px">
          <ToolbarToggle
            icon="list-flat"
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
            title="List view"
          />
          <ToolbarToggle
            icon="layout"
            active={viewMode === "board"}
            onClick={() => setViewMode("board")}
            title="Board view"
          />
        </div>

        {/* Search */}
        <div className="flex items-center flex-1 max-w-[280px] h-[26px] px-2 gap-1.5 rounded-md bg-vsc-surface-1 border border-transparent focus-within:border-vsc-accent/50 transition-colors duration-fast">
          <Icon name="search" tokenSize="2xs" className="text-vsc-text-ghost shrink-0" />
          <input
            type="text"
            value={filter.search}
            onChange={handleSearch}
            placeholder="Filter tasks..."
            className="flex-1 bg-transparent text-xs text-vsc-text-primary placeholder:text-vsc-text-ghost outline-none min-w-0"
          />
          {filter.search !== "" && (
            <button
              type="button"
              onClick={() => setFilter({ ...filter, search: "" })}
              className="text-vsc-text-ghost hover:text-vsc-text-secondary transition-colors duration-fast"
            >
              <Icon name="close" tokenSize="2xs" />
            </button>
          )}
        </div>

        {/* Priority filter */}
        <div className="relative">
          <button
            ref={priorityRef}
            type="button"
            onClick={() => setShowPriorityMenu((p) => !p)}
            className={cn(
              "flex items-center gap-1 h-[26px] px-2 rounded-md text-xs transition-colors duration-fast",
              "hover:bg-vsc-list-hover border border-transparent",
              filter.priority !== null
                ? "text-vsc-text-primary bg-vsc-surface-1 border-vsc-accent/30"
                : "text-vsc-text-tertiary",
            )}
          >
            <Icon name="filter" tokenSize="2xs" />
            <span>{filter.priority !== null ? PRIORITY_META[filter.priority].label : "Priority"}</span>
            <Icon name="chevron-down" tokenSize="2xs" className="opacity-50" />
          </button>
          {showPriorityMenu && (
            <div className="absolute top-full left-0 mt-1 w-36 py-1 rounded-md bg-vsc-surface-2 border border-vsc-border/60 shadow-lg z-[--z-overlay] animate-[fadeIn_100ms_ease-out]">
              <DropdownItem label="All priorities" active={filter.priority === null} onClick={() => handlePriorityFilter(null)} />
              {ALL_PRIORITIES.map((p) => (
                <DropdownItem
                  key={p}
                  label={PRIORITY_META[p].label}
                  active={filter.priority === p}
                  color={PRIORITY_META[p].color}
                  onClick={() => handlePriorityFilter(p)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Add task */}
        <button
          type="button"
          onClick={handleAddTask}
          className={cn(
            "flex items-center gap-1.5 h-[26px] px-3 rounded-md text-xs font-medium",
            "bg-vsc-accent/15 text-vsc-accent hover:bg-vsc-accent/25",
            "transition-colors duration-fast focus-ring",
          )}
        >
          <Icon name="add" tokenSize="2xs" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center h-8 px-3 gap-0.5">
        <StatusTab label="All" count={totalCount} active={filter.status === null} onClick={() => handleStatusFilter(null)} />
        {ALL_STATUSES.map((s) => (
          <StatusTab
            key={s}
            label={STATUS_META[s].label}
            count={counts[s]}
            active={filter.status === s}
            icon={STATUS_META[s].icon}
            iconColor={STATUS_META[s].color}
            onClick={() => handleStatusFilter(s)}
          />
        ))}
      </div>
    </div>
  );
});

// ─── Sub-components ─────────────────────────────────────────

function ToolbarToggle({ icon, active, onClick, title }: { icon: string; active: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center justify-center w-7 h-6 rounded transition-colors duration-fast focus-ring",
        active ? "bg-vsc-surface-2 text-vsc-text-primary shadow-sm" : "text-vsc-text-ghost hover:text-vsc-text-secondary",
      )}
    >
      <Icon name={icon} tokenSize="xs" />
    </button>
  );
}

function StatusTab({
  label,
  count,
  active,
  icon,
  iconColor,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  icon?: string;
  iconColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 h-7 px-2.5 rounded-md text-xs transition-colors duration-fast focus-ring",
        active
          ? "bg-vsc-surface-1 text-vsc-text-primary font-medium shadow-sm"
          : "text-vsc-text-tertiary hover:text-vsc-text-secondary hover:bg-vsc-list-hover",
      )}
    >
      {icon !== undefined && <Icon name={icon} tokenSize="2xs" className={cn(active ? iconColor : "opacity-60")} />}
      <span>{label}</span>
      <span
        className={cn(
          "ml-0.5 min-w-[18px] h-[16px] px-1 rounded-full text-2xs leading-[16px] text-center",
          active ? "bg-vsc-accent/20 text-vsc-accent" : "bg-vsc-surface-1 text-vsc-text-ghost",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function DropdownItem({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center w-full h-7 px-3 text-xs text-left transition-colors duration-fast",
        active ? "bg-vsc-accent/10 text-vsc-accent" : "text-vsc-text-secondary hover:bg-vsc-list-hover",
      )}
    >
      <span className={cn(color)}>{label}</span>
      {active && <Icon name="check" tokenSize="2xs" className="ml-auto text-vsc-accent" />}
    </button>
  );
}
