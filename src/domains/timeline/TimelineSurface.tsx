/**
 * Demo surface — renders sample timeline data for showcase purposes.
 *
 * Shows commits, builds, tests, deploys, and incidents on a
 * scrollable timeline grouped by day or week.
 */

import { memo, useMemo, useState } from "react";

import { Icon } from "~shared/ui/primitives/Icon";

// ─── Types ──────────────────────────────────────────────

type TimelineEntryKind = "commit" | "build" | "test" | "deploy" | "incident";
type TimelineEntryStatus = "success" | "failure" | "warning" | "info" | "resolved";

interface TimelineEntry {
  id: string;
  kind: TimelineEntryKind;
  status: TimelineEntryStatus;
  title: string;
  detail?: string;
  timestamp: number;
}

type ViewMode = "day" | "week";

// ─── Constants ──────────────────────────────────────────

const kindIcon: Record<TimelineEntryKind, string> = {
  commit: "git-commit",
  build: "package",
  test: "beaker",
  deploy: "cloud-upload",
  incident: "flame",
};

const statusColor: Record<TimelineEntryStatus, string> = {
  success: "text-vsc-success",
  failure: "text-vsc-error",
  warning: "text-vsc-warning",
  info: "text-vsc-info",
  resolved: "text-vsc-text-ghost",
};

// ─── Demo Data (no real-time integration yet) ───────────

const DAY_MS = 86_400_000;

function buildTimestamp(daysAgo: number, hours: number, minutes: number): number {
  const now = new Date();
  const day = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysAgo,
    hours,
    minutes,
  );
  return day.getTime();
}

const MOCK_ENTRIES: readonly TimelineEntry[] = [
  // Today
  { id: "t-01", kind: "deploy",   status: "success",  title: "v2.4.1 deployed",                detail: "v2.4.1 → production",              timestamp: buildTimestamp(0, 14, 32) },
  { id: "t-02", kind: "test",     status: "success",  title: "All 142 passed",                  detail: "Unit + integration suite",          timestamp: buildTimestamp(0, 14, 28) },
  { id: "t-03", kind: "build",    status: "success",  title: "Build #847 succeeded",            detail: "1m 42s",                            timestamp: buildTimestamp(0, 14, 15) },
  { id: "t-04", kind: "commit",   status: "info",     title: "fix: token expiry edge case",     detail: "auth/tokenService.ts",              timestamp: buildTimestamp(0, 13, 45) },
  { id: "t-05", kind: "incident", status: "resolved", title: "Login 500 errors",                detail: "Resolved in 35m — token TTL issue", timestamp: buildTimestamp(0, 11, 20) },
  { id: "t-06", kind: "commit",   status: "info",     title: "feat: rate limiting middleware",   detail: "middleware/rateLimit.ts",            timestamp: buildTimestamp(0, 10, 30) },
  { id: "t-07", kind: "test",     status: "success",  title: "All 140 passed",                  detail: "Unit suite",                        timestamp: buildTimestamp(0,  9, 15) },
  { id: "t-08", kind: "build",    status: "success",  title: "Build #846 succeeded",            detail: "1m 38s",                            timestamp: buildTimestamp(0,  9,  0) },
  // Yesterday
  { id: "t-09", kind: "commit",   status: "info",     title: "refactor: extract validation",    detail: "validation/schema.ts",              timestamp: buildTimestamp(1, 18, 30) },
  { id: "t-10", kind: "test",     status: "warning",  title: "138 passed, 2 failed",            detail: "tokenRefresh, sessionTimeout",      timestamp: buildTimestamp(1, 16, 45) },
  { id: "t-11", kind: "build",    status: "success",  title: "Build #845 succeeded",            detail: "1m 51s",                            timestamp: buildTimestamp(1, 15,  0) },
  { id: "t-12", kind: "commit",   status: "info",     title: "perf: cache token verification",  detail: "auth/cache.ts",                     timestamp: buildTimestamp(1, 12,  0) },
  { id: "t-13", kind: "incident", status: "resolved", title: "DB connection timeout",           detail: "Resolved in 20m — pool exhaustion", timestamp: buildTimestamp(1, 10, 30) },
  // 2 days ago
  { id: "t-14", kind: "deploy",   status: "success",  title: "v2.4.0 deployed",                detail: "v2.4.0 → production",               timestamp: buildTimestamp(2, 17,  0) },
  { id: "t-15", kind: "test",     status: "success",  title: "All 138 passed",                  detail: "Full suite",                        timestamp: buildTimestamp(2, 16, 45) },
  { id: "t-16", kind: "build",    status: "success",  title: "Build #844 succeeded",            detail: "1m 44s",                            timestamp: buildTimestamp(2, 16, 30) },
  { id: "t-17", kind: "commit",   status: "info",     title: "feat: add health check endpoint", detail: "api/health.ts",                     timestamp: buildTimestamp(2, 14, 15) },
  { id: "t-18", kind: "build",    status: "failure",  title: "Build #843 failed",               detail: "Type error in healthCheck.ts",      timestamp: buildTimestamp(2, 13, 50) },
  { id: "t-19", kind: "commit",   status: "info",     title: "chore: upgrade dependencies",     detail: "package.json",                      timestamp: buildTimestamp(2, 10,  0) },
];

// ─── Helpers ────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getDayLabel(ts: number): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const entryDay = new Date(ts);
  const entryDayStart = new Date(
    entryDay.getFullYear(),
    entryDay.getMonth(),
    entryDay.getDate(),
  ).getTime();

  const diff = today - entryDayStart;
  if (diff < DAY_MS) return "Today";
  if (diff < 2 * DAY_MS) return "Yesterday";
  const days = Math.floor(diff / DAY_MS);
  return `${days} days ago`;
}

function getWeekLabel(ts: number): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const entryDay = new Date(ts);
  const entryDayStart = new Date(
    entryDay.getFullYear(),
    entryDay.getMonth(),
    entryDay.getDate(),
  ).getTime();

  const diff = today - entryDayStart;
  if (diff < 7 * DAY_MS) return "This Week";
  if (diff < 14 * DAY_MS) return "Last Week";
  const weeks = Math.floor(diff / (7 * DAY_MS));
  return `${weeks} weeks ago`;
}

interface GroupedEntries {
  label: string;
  entries: TimelineEntry[];
}

function groupEntries(
  entries: readonly TimelineEntry[],
  mode: ViewMode,
): GroupedEntries[] {
  const labelFn = mode === "day" ? getDayLabel : getWeekLabel;
  const groups: GroupedEntries[] = [];
  let currentLabel = "";

  for (const entry of entries) {
    const label = labelFn(entry.timestamp);
    if (label !== currentLabel) {
      groups.push({ label, entries: [] });
      currentLabel = label;
    }
    const lastGroup = groups[groups.length - 1];
    if (lastGroup !== undefined) {
      lastGroup.entries.push(entry);
    }
  }

  return groups;
}

// ─── Sub-components ─────────────────────────────────────

const TimelineEntryRow = memo(function TimelineEntryRow({
  entry,
  isLast,
}: {
  entry: TimelineEntry;
  isLast: boolean;
}) {
  return (
    <div className="flex items-start gap-3 group cursor-pointer hover:bg-vsc-surface-1/50 transition-colors px-4 py-1.5">
      {/* Vertical line + dot */}
      <div className="flex flex-col items-center w-4 shrink-0 pt-0.5">
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor[entry.status].replace("text-", "bg-")}`} />
        {!isLast && (
          <div className="w-px flex-1 min-h-4 bg-vsc-border/30" />
        )}
      </div>

      {/* Time */}
      <span className="text-3xs text-vsc-text-ghost font-mono w-10 shrink-0 pt-0.5">
        {formatTime(entry.timestamp)}
      </span>

      {/* Kind icon */}
      <Icon
        name={kindIcon[entry.kind]}
        size={14}
        className={`shrink-0 pt-0.5 ${statusColor[entry.status]}`}
      />

      {/* Kind label */}
      <span className="text-3xs text-vsc-text-ghost w-14 shrink-0 pt-0.5">
        {entry.kind}
      </span>

      {/* Title + detail */}
      <div className="min-w-0 flex-1">
        <span className="text-xs text-vsc-text-primary group-hover:text-vsc-text-primary">
          {entry.title}
        </span>
        {entry.detail && (
          <span className="text-2xs text-vsc-text-ghost ml-2">
            {entry.detail}
          </span>
        )}
      </div>
    </div>
  );
});

const DayGroup = memo(function DayGroup({
  group,
}: {
  group: GroupedEntries;
}) {
  return (
    <div className="mb-2">
      <div className="px-4 py-2 sticky top-0 z-(--z-sticky) backdrop-blur-md bg-vsc-surface-0/80 border-b border-vsc-border/30">
        <h3 className="text-xs font-semibold text-vsc-text-primary">
          {group.label}
        </h3>
      </div>
      {group.entries.map((entry, idx) => (
        <TimelineEntryRow
          key={entry.id}
          entry={entry}
          isLast={idx === group.entries.length - 1}
        />
      ))}
    </div>
  );
});

// ─── Main Component ─────────────────────────────────────

export const TimelineSurface = memo(function TimelineSurface() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const entries: readonly TimelineEntry[] = useMemo(
    () => (import.meta.env.DEV ? MOCK_ENTRIES : []),
    [],
  );

  const groups = useMemo(
    () => groupEntries(entries, viewMode),
    [entries, viewMode],
  );

  return (
    <div className="flex flex-col h-full bg-vsc-bg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-vsc-border/30">
        <Icon name="history" size={16} className="text-[var(--color-lens-runtime)]" />
        <h2 className="text-sm font-semibold text-vsc-text-primary">
          Timeline
        </h2>

        {/* View toggle */}
        <div className="ml-auto flex items-center rounded border border-vsc-border/30 overflow-hidden">
          <button
            className={`px-2.5 py-1 text-3xs transition-colors ${
              viewMode === "day"
                ? "bg-vsc-surface-2 text-vsc-text-primary"
                : "text-vsc-text-ghost hover:text-vsc-text-secondary"
            }`}
            onClick={() => setViewMode("day")}
          >
            Day
          </button>
          <button
            className={`px-2.5 py-1 text-3xs transition-colors ${
              viewMode === "week"
                ? "bg-vsc-surface-2 text-vsc-text-primary"
                : "text-vsc-text-ghost hover:text-vsc-text-secondary"
            }`}
            onClick={() => setViewMode("week")}
          >
            Week
          </button>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-vsc-text-ghost">
            <Icon name="history" size={32} />
            <div className="text-sm">No timeline events</div>
            <div className="text-xs text-vsc-text-ghost/60">Events will appear as your project evolves</div>
          </div>
        )}
        {groups.map((group) => (
          <DayGroup key={group.label} group={group} />
        ))}
      </div>
    </div>
  );
});
