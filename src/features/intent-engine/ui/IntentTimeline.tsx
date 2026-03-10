/**
 * IntentTimeline — Compact timeline showing intent session history.
 *
 * Each row displays: category icon + intent text + status badge + timestamp.
 */

import React, { useCallback } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { IntentSession } from "../model/types";

// ─── Category Icons ─────────────────────────────────────

const categoryIcons: Record<string, { name: string; className: string }> = {
  feature: { name: "add", className: "text-(--color-intent-feature)" },
  bugfix: { name: "bug", className: "text-(--color-intent-bugfix)" },
  refactor: { name: "references", className: "text-(--color-intent-refactor)" },
  investigate: { name: "search", className: "text-(--color-intent-investigate)" },
  security: { name: "shield", className: "text-(--color-intent-security)" },
  performance: { name: "dashboard", className: "text-(--color-intent-performance)" },
  test: { name: "beaker", className: "text-(--color-intent-test)" },
  explore: { name: "compass", className: "text-(--color-intent-explore)" },
};

// ─── Status Badges ──────────────────────────────────────

const statusBadges: Record<string, { label: string; className: string }> = {
  input: { label: "Input", className: "text-vsc-text-ghost/50 bg-vsc-surface-2/30" },
  analyzing: { label: "Analyzing", className: "text-(--color-status-analyzing) bg-(--color-status-analyzing)/10" },
  planned: { label: "Planned", className: "text-(--color-status-planned) bg-(--color-status-planned)/10" },
  executing: { label: "Executing", className: "text-(--color-status-executing) bg-(--color-status-executing)/10" },
  completed: { label: "Done", className: "text-(--color-status-completed) bg-(--color-status-completed)/10" },
};

// ─── Time Formatter ─────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Timeline Row ───────────────────────────────────────

const TimelineRow = React.memo(function TimelineRow({
  session,
  onClick,
}: {
  session: IntentSession;
  onClick?: (session: IntentSession) => void;
}) {
  const iconInfo = categoryIcons[session.intent.category] ?? { name: "question", className: "text-vsc-text-ghost" };
  const badge = statusBadges[session.status] ?? statusBadges.input;

  const handleClick = useCallback(() => onClick?.(session), [onClick, session]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md",
        "text-left transition-colors duration-150",
        onClick
          ? "hover:bg-vsc-surface-2/30 cursor-pointer"
          : "cursor-default",
      )}
    >
      {/* Category icon */}
      <Icon
        name={iconInfo.name}
        className={cn("shrink-0", iconInfo.className)}
        tokenSize="xs"
      />

      {/* Intent text */}
      <span className="flex-1 min-w-0 text-xs text-vsc-text-secondary truncate">
        {session.intent.text}
      </span>

      {/* Status badge */}
      <span className={cn("shrink-0 px-1.5 py-0.5 rounded text-2xs font-medium", badge?.className)}>
        {badge?.label}
      </span>

      {/* Timestamp */}
      <span className="shrink-0 text-2xs text-vsc-text-ghost/40 tabular-nums">
        {formatRelativeTime(session.completedAt ?? session.startedAt)}
      </span>
    </button>
  );
});

// ─── Props ──────────────────────────────────────────────

interface IntentTimelineProps {
  sessions: readonly IntentSession[];
  onSessionClick?: (session: IntentSession) => void;
  className?: string;
}

// ─── Main Component ─────────────────────────────────────

export const IntentTimeline = React.memo(function IntentTimeline({
  sessions,
  onSessionClick,
  className,
}: IntentTimelineProps) {
  if (sessions.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-6 gap-1.5", className)}>
        <Icon name="lightbulb" className="text-vsc-text-ghost/20" tokenSize="lg" />
        <p className="text-xs text-vsc-text-ghost/40">No intent history yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {sessions.map((session) => (
        <TimelineRow
          key={session.id}
          session={session}
          onClick={onSessionClick}
        />
      ))}
    </div>
  );
});
