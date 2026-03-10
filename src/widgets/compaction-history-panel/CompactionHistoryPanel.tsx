import React, { useMemo } from "react";
import { useAtomValue } from "jotai";

import { compactionEventsAtom, totalTokensSavedAtom } from "../../entities/compaction-history";
import { compactionPanelVisibleAtom } from "../../shared/lib/atoms/sidebarPanelAtoms";
import { formatTokens } from "../../shared/lib/formatters";
import type { CompactionEvent } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

/** Format a timestamp as a short time string */
function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CompactionRow = React.memo(function CompactionRow({ event }: { event: CompactionEvent }) {
  const saved = event.tokens_before - event.tokens_after;
  const pctSaved = event.tokens_before > 0 ? Math.round((saved / event.tokens_before) * 100) : 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-3 py-2 border-b border-vsc-border last:border-b-0",
        "hover:bg-vsc-list-hover transition-colors duration-fast",
      )}
      data-testid={`compaction-row-${event.id}`}
    >
      <div className="flex items-center gap-2">
        <Icon name="fold" tokenSize="xs" className="text-vsc-info shrink-0" />
        <Text size="xs" weight="medium" tone="primary" className="flex-1" truncate>
          {event.summary}
        </Text>
        <Text size="2xs" tone="ghost" mono>
          {formatTime(event.timestamp_ms)}
        </Text>
      </div>
      <div className="flex items-center gap-3 pl-5">
        <Text size="2xs" tone="tertiary">
          {formatTokens(event.tokens_before)} → {formatTokens(event.tokens_after)}
        </Text>
        <Text size="2xs" tone="success" weight="medium">
          -{formatTokens(saved)} ({pctSaved}%)
        </Text>
      </div>
    </div>
  );
});

/**
 * CompactionHistoryPanel — lists all auto-compaction events with timestamps
 * and token savings. Shows a summary banner with total tokens reclaimed.
 */
export const CompactionHistoryPanel = React.memo(function CompactionHistoryPanel() {
  const visible = useAtomValue(compactionPanelVisibleAtom);
  const events = useAtomValue(compactionEventsAtom);
  const totalSaved = useAtomValue(totalTokensSavedAtom);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => b.timestamp_ms - a.timestamp_ms),
    [events],
  );

  if (!visible || events.length === 0) return null;

  return (
    <div className="flex flex-col h-full" data-testid="compaction-history-panel">
      {/* Summary banner */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border bg-vsc-sidebar">
        <Icon name="fold" tokenSize="sm" className="text-vsc-info" />
        <Text size="xs" weight="medium" tone="primary">
          {events.length} compaction{events.length !== 1 ? "s" : ""}
        </Text>
        <Text size="xs" tone="success" weight="medium">
          {formatTokens(totalSaved)} tokens reclaimed
        </Text>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto scroll-shadow">
        {sortedEvents.map((event) => (
          <CompactionRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
});
