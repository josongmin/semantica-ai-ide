import React, { useCallback } from "react";

import type { SessionListEntry } from "../../shared/protocol";
import { cn, StatusDot, Text } from "../../shared/ui";

const STATUS_LABEL: Record<string, string> = {
  idle: "idle",
  running: "running",
  paused: "paused",
  error: "error",
  completed: "done",
};

interface SessionItemProps {
  readonly session: SessionListEntry;
  readonly index: number;
  readonly isFocused: boolean;
  readonly isActive: boolean;
  readonly onSelect: (entry: SessionListEntry) => void;
}

/** Memoized session list item -- avoids inline arrow in .map() */
export const SessionItem = React.memo(function SessionItem({
  session,
  index,
  isFocused,
  isActive,
  onSelect,
}: SessionItemProps) {
  const handleClick = useCallback(() => onSelect(session), [onSelect, session]);
  const statusLabel = STATUS_LABEL[session.status] ?? session.status;
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors duration-fast focus-ring",
        isFocused ? "bg-vsc-list-hover" : "hover:bg-vsc-list-hover",
        isActive && "border-l-2 border-l-vsc-focus pl-2.5",
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
