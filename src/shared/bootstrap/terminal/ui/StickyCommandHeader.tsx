/**
 * StickyCommandHeader — RFC-TERMINAL-004 §3.1
 *
 * Pins the currently running (or last) command at the top of the terminal viewport.
 * Shows command text, status, elapsed time, and quick actions.
 *
 * Only visible when the command's block header has scrolled out of view.
 */

import { memo, useEffect, useState } from "react";

import { DurationLabel } from "~shared/ui/primitives/DurationLabel";
import { ExitCodeBadge } from "~shared/ui/primitives/ExitCodeBadge";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { CommandStatus, TerminalCommand } from "../model/types";

// ─── Status indicator ──────────────────────────────────────

function getStatusConfig(status: CommandStatus) {
  switch (status) {
    case "running":
      return { icon: "sync~spin", color: "text-vsc-info", bg: "bg-vsc-info/8", label: "Running" };
    case "succeeded":
      return { icon: "check", color: "text-vsc-success", bg: "bg-vsc-success/8", label: "Done" };
    case "failed":
      return { icon: "error", color: "text-vsc-error", bg: "bg-vsc-error/8", label: "Failed" };
    case "cancelled":
      return { icon: "circle-slash", color: "text-vsc-warning", bg: "bg-vsc-warning/8", label: "Cancelled" };
    case "unknown":
      return { icon: "question", color: "text-vsc-text-ghost", bg: "bg-vsc-surface-1", label: "Unknown" };
  }
}

// ─── Elapsed timer ─────────────────────────────────────────

function useElapsedTime(startedAt: number, isRunning: boolean): number | null {
  // Stores a timestamp snapshot that triggers re-render each second
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning || startedAt === 0) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt, isRunning]);

  if (!isRunning || startedAt === 0) return null;
  return now - startedAt;
}

// ─── Component ─────────────────────────────────────────────

export interface StickyCommandHeaderProps {
  command: TerminalCommand | undefined;
  className?: string;
}

export const StickyCommandHeader = memo(function StickyCommandHeader({
  command,
  className,
}: StickyCommandHeaderProps) {
  const isRunning = command?.status === "running";
  const elapsed = useElapsedTime(command?.startedAt ?? 0, isRunning);
  const config = command ? getStatusConfig(command.status) : null;

  if (!command || !config) return null;

  const displayDuration = isRunning ? elapsed : command.duration;

  return (
    <div
      className={cn(
        "pointer-events-auto",
        "sticky top-0 z-(--z-overlay)",
        "flex items-center gap-2 px-3 py-1.5",
        "bg-vsc-surface-0/95 backdrop-blur-md",
        "border-b border-vsc-border/30",
        "ring-1 ring-vsc-border/10",
        "animate-[slide-in-top_120ms_var(--ease-spring)]",
        config.bg,
        className,
      )}
    >
      {/* Status icon */}
      <Icon
        name={config.icon}
        size={13}
        className={cn(config.color, isRunning && "animate-spin")}
      />

      {/* Command text */}
      <span className="flex-1 min-w-0 truncate font-mono text-2xs text-vsc-text-primary">
        <span className="text-vsc-accent/60 mr-1">$</span>
        {command.command}
      </span>

      {/* Status label */}
      <span className={cn("text-3xs font-medium", config.color)}>
        {config.label}
      </span>

      {/* Duration / elapsed */}
      <DurationLabel durationMs={displayDuration} />

      {/* Exit code (only when completed) */}
      {!isRunning && <ExitCodeBadge exitCode={command.exitCode} />}
    </div>
  );
});
