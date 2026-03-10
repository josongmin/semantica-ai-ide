import React, { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { timelineEventsAtom } from "~entities/timeline-event";

import { clearFocusedTurnAtom, focusedTurnIdAtom } from "../../shared/lib";
import type { TimelineEvent, TurnId } from "../../shared/protocol";
import { cn, Icon, Text, Tooltip } from "../../shared/ui";

/** Map event types to codicon icon names */
const EVENT_ICON_MAP: Record<string, string> = {
  tool_call_start: "tools",
  tool_call_end: "check",
  error_raised: "error",
  error_recovered: "debug-restart",
  file_created: "new-file",
  file_modified: "edit",
  file_deleted: "trash",
  checkpoint_created: "bookmark",
  approval_requested: "shield",
  approval_granted: "pass",
  phase_changed: "layers",
};

/** Map event types to dot color classes */
const EVENT_COLOR_MAP: Record<string, string> = {
  error_raised: "bg-vsc-error",
  error_recovered: "bg-vsc-warning",
  checkpoint_created: "bg-vsc-info",
  approval_requested: "bg-vsc-warning",
  file_created: "bg-vsc-success",
  file_modified: "bg-vsc-info",
  file_deleted: "bg-vsc-error",
};

const DEFAULT_DOT_COLOR = "bg-vsc-text-tertiary";

/** Format short time label */
function formatShortTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const TimelineDot = React.memo(function TimelineDot({
  event,
  isActive,
  onClick,
}: {
  event: TimelineEvent;
  isActive: boolean;
  onClick: (turnId: string) => void;
}) {
  const handleClick = useCallback(() => {
    onClick(event.turn_id);
  }, [event.turn_id, onClick]);

  const iconName = EVENT_ICON_MAP[event.type] ?? "circle-outline";
  const dotColor = EVENT_COLOR_MAP[event.type] ?? DEFAULT_DOT_COLOR;

  return (
    <Tooltip content={`${event.summary} (${formatShortTime(event.timestamp_ms)})`}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Jump to: ${event.summary}`}
        className={cn(
          "relative flex items-center justify-center w-5 h-5 rounded-full",
          "transition-[transform,box-shadow] duration-fast cursor-pointer shrink-0",
          "hover:ring-2 hover:ring-vsc-focus/50",
          "focus-ring",
          isActive ? "ring-2 ring-vsc-focus scale-125" : "hover:scale-110",
        )}
      >
        <span className={cn("absolute inset-0 rounded-full opacity-20", dotColor)} />
        <Icon
          name={iconName}
          tokenSize="2xs"
          className={cn(
            "relative z-[--z-sticky]",
            isActive ? "text-vsc-fg" : "text-vsc-text-secondary",
          )}
        />
      </button>
    </Tooltip>
  );
});

/**
 * TimelineReplayBar — a horizontal bar of clickable dots representing
 * timeline events. Clicking a dot focuses (scrolls to + highlights)
 * the associated turn in the conversation.
 */
export const TimelineReplayBar = React.memo(function TimelineReplayBar() {
  const events = useAtomValue(timelineEventsAtom);
  const focusedTurnId = useAtomValue(focusedTurnIdAtom);
  const setFocusedTurnId = useSetAtom(focusedTurnIdAtom);
  const clearFocusedTurn = useSetAtom(clearFocusedTurnAtom);

  const handleDotClick = useCallback(
    (turnId: string) => {
      setFocusedTurnId(turnId as TurnId);
      clearFocusedTurn();
    },
    [setFocusedTurnId, clearFocusedTurn],
  );

  // Limit displayed dots to avoid overflow
  const displayEvents = useMemo(() => {
    if (events.length <= 50) return events;
    // Sample evenly for large event lists
    const step = Math.ceil(events.length / 50);
    return events.filter((_, i) => i % step === 0 || i === events.length - 1);
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-3 py-1 border-b border-vsc-border overflow-x-auto flex-nowrap"
      role="toolbar"
      aria-label="Timeline replay bar"
      data-testid="timeline-replay-bar"
    >
      <Icon name="history" tokenSize="xs" className="text-vsc-text-ghost shrink-0 mr-1" />

      {/* Connecting line + dots */}
      <div className="flex items-center gap-0 relative">
        {/* Background connector line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-vsc-border -translate-y-1/2 pointer-events-none" />

        {displayEvents.map((event, i) => (
          <React.Fragment key={event.id}>
            {i > 0 && <div className="w-2 shrink-0" />}
            <TimelineDot
              event={event}
              isActive={focusedTurnId === event.turn_id}
              onClick={handleDotClick}
            />
          </React.Fragment>
        ))}
      </div>

      <Text size="2xs" tone="ghost" className="ml-2 shrink-0 whitespace-nowrap">
        {events.length} event{events.length !== 1 ? "s" : ""}
      </Text>
    </div>
  );
});
