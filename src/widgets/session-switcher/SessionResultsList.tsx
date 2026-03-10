import React, { useCallback } from "react";

import type { SessionListEntry } from "../../shared/protocol";
import { cn, StatusDot, Text } from "../../shared/ui";
import type { ScoredEntry } from "./hooks/useSessionSearch";

const STATUS_LABEL: Record<string, string> = {
  idle: "idle",
  running: "running",
  paused: "paused",
  error: "error",
  completed: "done",
};

/** Memoized session list item -- avoids inline arrow in .map() */
const SessionItem = React.memo(function SessionItem({
  session,
  index,
  isFocused,
  isActive,
  onSelect,
}: {
  session: SessionListEntry;
  index: number;
  isFocused: boolean;
  isActive: boolean;
  onSelect: (entry: SessionListEntry) => void;
}) {
  const handleClick = useCallback(() => onSelect(session), [onSelect, session]);
  const statusLabel = STATUS_LABEL[session.status] ?? session.status;
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors duration-fast",
        isFocused ? "bg-vsc-list-hover" : "hover:bg-vsc-list-hover",
        isActive && "border-l-2 border-l-vsc-focus pl-[10px]",
      )}
      data-testid={`session-switcher-item-${index}`}
    >
      <StatusDot
        status={session.status === "completed" ? "success" : session.status}
        size="sm"
        className="shrink-0"
      />
      <span className="flex-1 min-w-0 truncate">
        <Text size="xs" tone="primary" as="span">
          {session.title}
        </Text>
      </span>
      <Text size="2xs" tone="ghost" as="span" className="shrink-0">
        {statusLabel}
      </Text>
      <Text size="2xs" tone="ghost" as="span" className="shrink-0 tabular-nums">
        {session.turn_count}t
      </Text>
    </button>
  );
});

export interface SessionResultsListProps {
  results: ScoredEntry[];
  focusIndex: number;
  activeTabId: string | null;
  onSelect: (entry: SessionListEntry) => void;
  listRef: React.Ref<HTMLDivElement>;
}

/**
 * Renders the filtered/ranked session results with focus highlighting.
 */
export const SessionResultsList = React.memo(function SessionResultsList({
  results,
  focusIndex,
  activeTabId,
  onSelect,
  listRef,
}: SessionResultsListProps) {
  return (
    <div ref={listRef} className="max-h-[min(400px,50vh)] overflow-y-auto py-1">
      {results.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <Text size="xs" tone="tertiary">
            No sessions found
          </Text>
        </div>
      ) : (
        results.map((session, index) => (
          <SessionItem
            key={session.session_id}
            session={session}
            index={index}
            isFocused={index === focusIndex}
            isActive={session.session_id === activeTabId}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
});
