import React, { useMemo, useState } from "react";
import { useAtomValue } from "jotai";

import { timelineEventsAtom } from "~entities/timeline-event";
import type { TimelineEventType } from "~shared/protocol";
import { cn, Icon, Text } from "~shared/ui";

// ─── Event icons & colors ────────────────────────────────

const EVENT_ICON: Record<TimelineEventType, string> = {
  tool_call_start: "play",
  tool_call_end: "check",
  error_raised: "error",
  error_recovered: "pass-filled",
  file_created: "new-file",
  file_modified: "edit",
  file_deleted: "trash",
  checkpoint_created: "bookmark",
  approval_requested: "shield",
  approval_granted: "check",
  phase_changed: "arrow-right",
};

const EVENT_COLOR: Partial<Record<TimelineEventType, string>> = {
  error_raised: "text-vsc-error",
  error_recovered: "text-vsc-success",
  file_created: "text-vsc-success",
  file_deleted: "text-vsc-error",
  approval_requested: "text-vsc-warning",
  tool_call_start: "text-vsc-info",
};

type FilterCategory = "files" | "tools" | "errors" | "approvals" | "phases";

const FILTER_CATEGORIES: { id: FilterCategory; label: string; types: TimelineEventType[] }[] = [
  { id: "files", label: "Files", types: ["file_created", "file_modified", "file_deleted"] },
  { id: "tools", label: "Tools", types: ["tool_call_start", "tool_call_end"] },
  { id: "errors", label: "Errors", types: ["error_raised", "error_recovered"] },
  { id: "approvals", label: "Approvals", types: ["approval_requested", "approval_granted"] },
  { id: "phases", label: "Phases", types: ["phase_changed", "checkpoint_created"] },
];

const MAX_EVENTS = 200;

// ─── Event Log View (Bottom Zone) ───────────────────────

export const EventLogView = React.memo(function EventLogView() {
  const allEvents = useAtomValue(timelineEventsAtom);
  const [activeFilters, setActiveFilters] = useState<Set<FilterCategory>>(new Set());
  const [search, setSearch] = useState("");

  const toggleFilter = (cat: FilterCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filteredEvents = useMemo(() => {
    let events = allEvents;

    // Category filter
    if (activeFilters.size > 0) {
      const allowedTypes = new Set<TimelineEventType>();
      for (const cat of activeFilters) {
        const def = FILTER_CATEGORIES.find((c) => c.id === cat);
        if (def) def.types.forEach((t) => allowedTypes.add(t));
      }
      events = events.filter((e) => allowedTypes.has(e.type));
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      events = events.filter((e) => e.summary.toLowerCase().includes(q));
    }

    return events.slice(-MAX_EVENTS);
  }, [allEvents, activeFilters, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar: filters + search */}
      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-vsc-border/30 shrink-0">
        {FILTER_CATEGORIES.map((cat) => {
          const isOn = activeFilters.has(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleFilter(cat.id)}
              className={cn(
                "px-1.5 py-px rounded-full text-2xs cursor-pointer transition-colors duration-fast focus-ring",
                isOn
                  ? "bg-vsc-accent/20 text-vsc-accent font-medium"
                  : "text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
              )}
            >
              {cat.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-vsc-surface-2/40 rounded px-1.5 py-0.5">
          <Icon name="search" tokenSize="2xs" className="text-vsc-text-ghost" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter events..."
            className="bg-transparent border-none outline-none text-2xs text-vsc-fg w-24
                       placeholder:text-vsc-text-ghost"
          />
        </div>
        <Text size="3xs" tone="ghost" className="shrink-0 tabular-nums">
          {filteredEvents.length}
        </Text>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto scroll-shadow" role="log" aria-label="Event log">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-vsc-text-ghost text-xs">
            {allEvents.length === 0 ? "No events yet" : "No matching events"}
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-1.5 px-2 py-0.5 text-2xs
                         hover:bg-vsc-list-hover transition-colors duration-fast group"
            >
              <Icon
                name={EVENT_ICON[event.type]}
                tokenSize="2xs"
                className={cn("shrink-0", EVENT_COLOR[event.type] ?? "text-vsc-text-tertiary")}
              />
              <Text size="3xs" tone="ghost" mono className="shrink-0 tabular-nums w-[60px]">
                {new Date(event.timestamp_ms).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </Text>
              <span
                className={cn("truncate", EVENT_COLOR[event.type] ?? "text-vsc-text-secondary")}
              >
                {event.summary}
              </span>
              {typeof event.meta?.file === "string" && (
                <Text
                  size="3xs"
                  tone="ghost"
                  mono
                  className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-fast"
                >
                  {event.meta.file.split("/").pop()}
                </Text>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

/** @deprecated Use EventLogView instead */
export { EventLogView as EventLogPanel };
