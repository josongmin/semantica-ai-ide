import React, { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  type TimelineEventType,
  timelineFilterAtom,
  toggleTimelineFilterBatchAtom,
} from "~entities/timeline-event";

import { cn } from "../../shared/ui";

interface FilterCategory {
  readonly id: string;
  readonly label: string;
  readonly types: readonly TimelineEventType[];
}

const FILTER_CATEGORIES: readonly FilterCategory[] = [
  { id: "files", label: "Files", types: ["file_created", "file_modified", "file_deleted"] },
  { id: "tools", label: "Tools", types: ["tool_call_start", "tool_call_end"] },
  { id: "errors", label: "Errors", types: ["error_raised", "error_recovered"] },
  { id: "approvals", label: "Approvals", types: ["approval_requested", "approval_granted"] },
  { id: "phases", label: "Phases", types: ["checkpoint_created", "phase_changed"] },
];

export const TimelineFilterBar = React.memo(function TimelineFilterBar({
  className,
}: {
  className?: string;
}) {
  const filter = useAtomValue(timelineFilterAtom);
  const toggleBatch = useSetAtom(toggleTimelineFilterBatchAtom);

  const activeCategories = useMemo(() => {
    if (filter.size === 0) return new Set<string>();
    const active = new Set<string>();
    for (const cat of FILTER_CATEGORIES) {
      if (cat.types.every((t) => filter.has(t))) {
        active.add(cat.id);
      }
    }
    return active;
  }, [filter]);

  const handleToggle = useCallback(
    (category: FilterCategory) => {
      toggleBatch(category.types);
    },
    [toggleBatch],
  );

  return (
    <div
      className={cn("flex items-center gap-1 flex-wrap", className)}
      data-testid="timeline-filter-bar"
    >
      {FILTER_CATEGORIES.map((cat) => {
        const isActive = activeCategories.has(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleToggle(cat)}
            className={cn(
              "px-1.5 py-0.5 rounded-full text-2xs transition-[color,background-color,box-shadow,transform] duration-fast cursor-pointer focus-ring active:scale-95",
              isActive
                ? "bg-vsc-focus/20 text-vsc-focus ring-1 ring-vsc-focus/40"
                : "bg-vsc-toolbar/50 text-vsc-text-tertiary hover:bg-vsc-toolbar hover:text-vsc-text-secondary",
            )}
            aria-pressed={isActive}
            data-testid={`filter-pill-${cat.id}`}
          >
            <span className={isActive ? "font-medium" : ""}>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
});
