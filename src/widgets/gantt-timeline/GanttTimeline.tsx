import React, { useCallback, useMemo, useState } from "react";
import { useAtomValue } from "jotai";

import { ganttEntriesAtom, ganttTimelineBoundsAtom } from "../../features/gantt-timeline";
import type { GanttEntry, GanttToolType } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

// ─── Color mapping by tool type ─────────────────────────────

const TOOL_TYPE_COLORS: Record<GanttToolType, string> = {
  read: "bg-[var(--vscode-charts-blue,#3794ff)]",
  write: "bg-[var(--vscode-charts-green,#89d185)]",
  bash: "bg-[var(--vscode-charts-orange,#d18616)]",
  search: "bg-[var(--vscode-charts-purple,#b267e6)]",
  other: "bg-vsc-text-ghost",
};

const TOOL_TYPE_LABELS: Record<GanttToolType, string> = {
  read: "Read",
  write: "Write",
  bash: "Bash",
  search: "Search",
  other: "Other",
};

const STATUS_INDICATORS: Record<GanttEntry["status"], string> = {
  running: "animate-pulse opacity-80",
  success: "",
  error: "ring-1 ring-vsc-error",
};

/** Format milliseconds to human-readable duration */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

// ─── Gantt Bar ──────────────────────────────────────────────

interface GanttBarProps {
  readonly entry: GanttEntry;
  readonly startMs: number;
  readonly durationMs: number;
  readonly isHovered: boolean;
  readonly onHover: (id: string | null) => void;
}

const GanttBar = React.memo(function GanttBar({
  entry,
  startMs,
  durationMs,
  isHovered,
  onHover,
}: GanttBarProps) {
  const leftPct = durationMs > 0 ? ((entry.start_ms - startMs) / durationMs) * 100 : 0;
  const widthPct = durationMs > 0 ? ((entry.end_ms - entry.start_ms) / durationMs) * 100 : 100;
  const entryDuration = entry.end_ms - entry.start_ms;

  const handleMouseEnter = useCallback(() => onHover(entry.id), [entry.id, onHover]);
  const handleMouseLeave = useCallback(() => onHover(null), [onHover]);

  const tooltipText = `${entry.tool_name} (${TOOL_TYPE_LABELS[entry.tool_type]}) - ${formatDuration(entryDuration)} - ${entry.status}`;

  return (
    <div
      className={cn(
        "absolute h-6 rounded-sm cursor-pointer transition-opacity duration-fast",
        TOOL_TYPE_COLORS[entry.tool_type],
        STATUS_INDICATORS[entry.status],
        isHovered ? "opacity-100 ring-1 ring-vsc-focus" : "opacity-80 hover:opacity-100",
      )}
      style={{
        left: `${leftPct}%`,
        width: `${Math.max(widthPct, 0.5)}%`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="listitem"
      aria-label={`${entry.tool_name}: ${formatDuration(entryDuration)}, ${entry.status}`}
      title={tooltipText}
      data-testid={`gantt-bar-${entry.id}`}
    >
      {/* Label inside bar when wide enough */}
      {widthPct > 8 && (
        <Text
          size="2xs"
          className="px-1 leading-6 truncate min-w-0 text-vsc-bg pointer-events-none select-none"
        >
          {entry.tool_name}
        </Text>
      )}
    </div>
  );
});

// ─── Legend ─────────────────────────────────────────────────

const LEGEND_ITEMS: { type: GanttToolType; label: string }[] = [
  { type: "read", label: "Read" },
  { type: "write", label: "Write" },
  { type: "bash", label: "Bash" },
  { type: "search", label: "Search" },
  { type: "other", label: "Other" },
];

const GanttLegend = React.memo(function GanttLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap" data-testid="gantt-legend">
      {LEGEND_ITEMS.map(({ type, label }) => (
        <div key={type} className="flex items-center gap-1">
          <div className={cn("w-3 h-2 rounded-sm", TOOL_TYPE_COLORS[type])} aria-hidden="true" />
          <Text size="2xs" tone="secondary">
            {label}
          </Text>
        </div>
      ))}
    </div>
  );
});

// ─── Main Widget ────────────────────────────────────────────

export interface GanttTimelineProps {
  readonly className?: string;
}

/**
 * GanttTimeline -- horizontal bar chart showing tool execution durations.
 *
 * Parallel executions stack vertically. Bars are colored by tool type.
 * Hover shows tool name, duration, and status.
 */
export const GanttTimeline = React.memo(function GanttTimeline({ className }: GanttTimelineProps) {
  const entries = useAtomValue(ganttEntriesAtom);
  const bounds = useAtomValue(ganttTimelineBoundsAtom);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Group overlapping entries into lanes for vertical stacking
  const lanes = useMemo(() => {
    if (entries.length === 0) return [];
    const sorted = [...entries].sort((a, b) => a.start_ms - b.start_ms);
    const result: GanttEntry[][] = [];

    for (const entry of sorted) {
      let placed = false;
      for (const lane of result) {
        const lastInLane = lane[lane.length - 1];
        if (lastInLane !== undefined && lastInLane.end_ms <= entry.start_ms) {
          lane.push(entry);
          placed = true;
          break;
        }
      }
      if (!placed) {
        result.push([entry]);
      }
    }
    return result;
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3 p-4", className)} data-testid="gantt-timeline">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="graph-line" tokenSize="sm" className="text-vsc-text-secondary" />
          <Text size="sm" weight="bold">
            Tool Execution Timeline
          </Text>
          <Text size="2xs" tone="ghost">
            ({entries.length} tool{entries.length !== 1 ? "s" : ""})
          </Text>
        </div>
        <Text size="2xs" tone="secondary" mono>
          Total: {formatDuration(bounds.durationMs)}
        </Text>
      </div>

      {/* Timeline Chart */}
      <div
        className="relative border border-vsc-border rounded-md bg-vsc-surface-1 overflow-hidden"
        data-testid="gantt-chart"
        role="list"
        aria-label="Tool execution Gantt chart"
      >
        {/* Time axis markers */}
        <div className="flex justify-between px-2 py-0.5 border-b border-vsc-border/50 bg-vsc-surface-1">
          <Text size="2xs" tone="ghost" mono>
            0ms
          </Text>
          {bounds.durationMs > 0 && (
            <Text size="2xs" tone="ghost" mono>
              {formatDuration(bounds.durationMs)}
            </Text>
          )}
        </div>

        {/* Lanes */}
        <div className="px-2 py-1.5">
          {lanes.map((lane, laneIndex) => (
            <div
              key={laneIndex}
              className="relative h-8 mb-1 last:mb-0"
              data-testid={`gantt-lane-${laneIndex}`}
            >
              {lane.map((entry) => (
                <GanttBar
                  key={entry.id}
                  entry={entry}
                  startMs={bounds.startMs}
                  durationMs={bounds.durationMs}
                  isHovered={hoveredId === entry.id}
                  onHover={setHoveredId}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <GanttLegend />
    </div>
  );
});
