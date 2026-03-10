import React, { useMemo } from "react";
import { useAtomValue } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";
import { filteredTimelineAtom, timelineFilterAtom } from "~entities/timeline-event";

import { activityFeedVisibleAtom } from "../../shared/lib/atoms/dialogAtoms";
import type { TimelineEventType } from "../../shared/protocol";
import { Badge, cn, Icon, Spinner, Text } from "../../shared/ui";
import { TimelineFilterBar } from "./TimelineFilterBar";

const eventIcons: Record<TimelineEventType, string> = {
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

const eventColors: Partial<Record<TimelineEventType, string>> = {
  error_raised: "text-vsc-error",
  error_recovered: "text-vsc-success",
  file_created: "text-vsc-success",
  file_deleted: "text-vsc-error",
  approval_requested: "text-vsc-warning",
};

/** Max events shown in the feed (prevents DOM bloat) */
const MAX_VISIBLE_EVENTS = 50;

export const ActivityFeed = React.memo(function ActivityFeed() {
  const visible = useAtomValue(activityFeedVisibleAtom);
  const events = useAtomValue(filteredTimelineAtom);
  const meta = useAtomValue(sessionMetaAtom);
  const filter = useAtomValue(timelineFilterAtom);
  const isRunning = meta.status === "running";
  const isFiltered = filter.size > 0;
  const visibleEvents = useMemo(() => events.slice(-MAX_VISIBLE_EVENTS), [events]);

  return (
    <div
      className={cn(
        "border-t border-vsc-border bg-vsc-surface-1 overflow-hidden transition-[max-height,opacity] duration-slow ease-in-out",
        visible ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0 border-t-transparent",
      )}
      role="region"
      aria-label="Activity feed"
      aria-hidden={!visible}
    >
      <div className="px-3 py-1 border-b border-vsc-border sticky top-0 bg-vsc-surface-1 z-[--z-sticky]">
        <div className="flex items-center gap-2">
          <Text size="3xs" weight="medium" tone="tertiary" className="tracking-wide">
            Activity
          </Text>
          {isFiltered && <Badge text="Filtered" variant="info" />}
          <div className="flex-1" />
          <TimelineFilterBar />
        </div>
      </div>

      {visibleEvents.length === 0 ? (
        <div className="px-3 py-4 text-center">
          {isRunning ? (
            <div className="flex items-center justify-center gap-1.5">
              <Spinner size="sm" />
              <Text size="xs" tone="tertiary">
                Waiting for activity...
              </Text>
            </div>
          ) : (
            <Text size="xs" tone="tertiary">
              No activity yet
            </Text>
          )}
        </div>
      ) : (
        <div className="py-0.5 overflow-y-auto scroll-shadow max-h-[168px] stagger-children" role="list">
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              role="listitem"
              aria-label={event.summary}
              tabIndex={0}
              className="flex items-center gap-1.5 px-3 py-0.5 text-xs hover:bg-vsc-list-hover transition-colors duration-fast focus-ring"
            >
              <Icon
                name={eventIcons[event.type]}
                tokenSize="2xs"
                className={cn("shrink-0", eventColors[event.type] ?? "text-vsc-text-tertiary")}
              />
              <Text size="2xs" tone="ghost" mono className="shrink-0">
                {new Date(event.timestamp_ms).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </Text>
              <Text size="xs" tone="secondary" truncate>
                {event.summary}
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
