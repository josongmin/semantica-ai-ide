import React from "react";

import { cn } from "~shared/ui";

interface TimelineEvent {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly time: string;
  readonly isCheckpoint?: boolean;
}

const SAMPLE_EVENTS: TimelineEvent[] = [
  { id: "1", type: "analysis", label: "analysis_started", time: "12:00:01" },
  { id: "2", type: "agent", label: "agent_step_started", time: "12:00:02" },
  { id: "3", type: "agent", label: "agent_step_completed", time: "12:00:05" },
  {
    id: "4",
    type: "checkpoint",
    label: "checkpoint_created",
    time: "12:00:06",
    isCheckpoint: true,
  },
  { id: "5", type: "review", label: "review_generated", time: "12:00:10" },
];

export const EventTimeline = React.memo(function EventTimeline() {
  return (
    <div className="flex-1 overflow-y-auto scroll-shadow px-4 py-3">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-vsc-border" />

        {SAMPLE_EVENTS.map((event) => (
          <div
            key={event.id}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                // TODO: wire up event selection handler
              }
            }}
            className={cn(
              "flex items-center gap-3 py-1.5 px-1 -mx-1 rounded-sm",
              "cursor-pointer transition-colors duration-fast focus-ring",
              "hover:bg-vsc-list-hover",
            )}
          >
            {/* Dot */}
            <div
              className={cn(
                "w-3.5 h-3.5 shrink-0 border-2 z-[--z-base]",
                event.isCheckpoint
                  ? "bg-vsc-button border-vsc-button rotate-45 rounded-sm"
                  : "bg-vsc-surface-0 border-vsc-text-ghost rounded-full",
              )}
            />

            {/* Label */}
            <span className="flex-1 text-xs text-vsc-fg font-mono">{event.label}</span>

            {/* Time */}
            <span className="text-2xs text-vsc-text-tertiary tabular-nums">{event.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
