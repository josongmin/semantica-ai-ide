import React from "react";

import type { TodoFilterStatus, TodoSortKey } from "~shared/lib";
import { cn, Icon, Input } from "~shared/ui";

const sortLabels: Record<TodoSortKey, string> = {
  date: "Date",
  priority: "Priority",
  status: "Status",
};

const filterLabels: Record<TodoFilterStatus, string> = {
  all: "All",
  pending: "Pending",
  in_progress: "Active",
  completed: "Done",
  failed: "Failed",
};

interface TodoBoardToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: TodoFilterStatus;
  onFilterChange: (value: TodoFilterStatus) => void;
  sortBy: TodoSortKey;
  onSortChange: (value: TodoSortKey) => void;
}

export const TodoBoardToolbar = React.memo(function TodoBoardToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
}: TodoBoardToolbarProps) {
  return (
    <div className="px-3 py-1.5 flex items-center gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Icon
          name="search"
          tokenSize="sm"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-vsc-text-tertiary pointer-events-none"
        />
        <Input
          type="text"
          size="sm"
          placeholder="Search TODOs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search TODOs"
          className="pl-7 pr-2 text-sm"
          data-testid="todo-search"
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1 shrink-0">
        {(Object.keys(filterLabels) as TodoFilterStatus[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            className={cn(
              "px-1.5 py-0.5 text-2xs rounded transition-colors duration-fast cursor-pointer focus-ring",
              filter === key
                ? "bg-vsc-focus/20 text-vsc-focus ring-1 ring-vsc-focus/40"
                : "text-vsc-text-tertiary hover:bg-vsc-toolbar",
            )}
            aria-label={`Filter: ${filterLabels[key]}`}
            data-testid={`filter-${key}`}
          >
            {filterLabels[key]}
          </button>
        ))}
      </div>

      {/* Sort buttons */}
      <div className="flex items-center gap-1 shrink-0 border-l border-vsc-border pl-2">
        {(Object.keys(sortLabels) as TodoSortKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSortChange(key)}
            className={cn(
              "px-1.5 py-0.5 text-2xs rounded transition-colors duration-fast cursor-pointer focus-ring",
              sortBy === key
                ? "bg-vsc-focus/20 text-vsc-focus ring-1 ring-vsc-focus/40"
                : "text-vsc-text-tertiary hover:bg-vsc-toolbar",
            )}
            aria-label={`Sort by ${key}`}
            data-testid={`sort-${key}`}
          >
            {sortLabels[key]}
          </button>
        ))}
      </div>
    </div>
  );
});
