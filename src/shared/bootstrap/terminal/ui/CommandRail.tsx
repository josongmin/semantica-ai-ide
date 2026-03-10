/**
 * CommandRail — RFC-TERMINAL-004 §3.2, RFC-005 §11.3
 *
 * Left gutter rail showing command status indicators.
 * Each command gets a dot/icon in the rail aligned to its block position.
 *
 * Layout (within the overlay, left side):
 * ┌──┐
 * │ ● │  ← succeeded (green dot)
 * │ ✕ │  ← failed (red X)
 * │ ◎ │  ← running (blue pulse)
 * │ ● │  ← succeeded
 * └──┘
 */

import { memo } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { CommandStatus, TerminalCommand } from "../model/types";

// ─── Rail Icon ─────────────────────────────────────────────

function getRailIndicator(status: CommandStatus): {
  className: string;
  icon?: string;
  dot?: boolean;
} {
  switch (status) {
    case "running":
      return { className: "text-vsc-info", icon: "circle-filled", dot: false };
    case "succeeded":
      return { className: "text-vsc-success", dot: true };
    case "failed":
      return { className: "text-vsc-error", icon: "close", dot: false };
    case "cancelled":
      return { className: "text-vsc-warning", icon: "circle-slash", dot: false };
    case "unknown":
      return { className: "text-vsc-text-ghost", dot: true };
  }
}

// ─── Rail Item ─────────────────────────────────────────────

interface RailItemProps {
  command: TerminalCommand;
  onClick?: (command: TerminalCommand) => void;
}

const RailItem = memo(function RailItem({ command, onClick }: RailItemProps) {
  const indicator = getRailIndicator(command.status);

  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center w-5 h-5",
        "hover:bg-vsc-surface-2/50 rounded-sm",
        "transition-colors duration-fast",
        indicator.className,
      )}
      onClick={() => onClick?.(command)}
      title={`${command.command} (${command.status})`}
    >
      {indicator.dot && (
        <span
          className={cn(
            "inline-block w-[6px] h-[6px] rounded-full",
            command.status === "running" && "animate-pulse",
            indicator.className.replace("text-", "bg-"),
          )}
        />
      )}
      {!indicator.dot && indicator.icon && (
        <Icon name={indicator.icon} size={10} />
      )}
    </button>
  );
});

// ─── CommandRail ───────────────────────────────────────────

export interface CommandRailProps {
  commands: TerminalCommand[];
  onCommandClick?: (command: TerminalCommand) => void;
  className?: string;
}

export const CommandRail = memo(function CommandRail({
  commands,
  onCommandClick,
  className,
}: CommandRailProps) {
  if (commands.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 py-1",
        "w-6 shrink-0",
        "border-r border-vsc-border/15",
        className,
      )}
      aria-label="Command status rail"
    >
      {commands.map((cmd) => (
        <RailItem key={cmd.commandId} command={cmd} onClick={onCommandClick} />
      ))}
    </div>
  );
});
