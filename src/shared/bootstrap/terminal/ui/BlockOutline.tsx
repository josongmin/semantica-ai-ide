/**
 * BlockOutline — RFC-TERMINAL-004 §2.6
 *
 * Mini navigator showing command block summary.
 * Clicking a row scrolls to that command block in the terminal.
 */

import { memo, useCallback } from "react";

import { DurationLabel } from "~shared/ui/primitives/DurationLabel";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { CommandStatus, TerminalCommand } from "../model/types";

// ─── Types ───────────────────────────────────────────────

export interface BlockOutlineProps {
  commands: TerminalCommand[];
  activeCommandId?: string;
  onCommandClick?: (command: TerminalCommand) => void;
  className?: string;
}

// ─── Status Config ───────────────────────────────────────

const OUTLINE_STATUS: Record<CommandStatus, { icon: string; color: string }> = {
  running: { icon: "loading~spin", color: "text-vsc-info" },
  succeeded: { icon: "check", color: "text-vsc-success" },
  failed: { icon: "close", color: "text-vsc-error" },
  cancelled: { icon: "circle-slash", color: "text-vsc-warning" },
  unknown: { icon: "question", color: "text-vsc-text-ghost" },
};

// ─── OutlineRow ──────────────────────────────────────────

interface OutlineRowProps {
  command: TerminalCommand;
  isActive: boolean;
  onClick?: (command: TerminalCommand) => void;
}

const OutlineRow = memo(function OutlineRow({ command, isActive, onClick }: OutlineRowProps) {
  const status = OUTLINE_STATUS[command.status];

  const handleClick = useCallback(() => onClick?.(command), [onClick, command]);

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 w-full px-2 py-1 text-left",
        "text-3xs font-mono truncate",
        "rounded-sm",
        "transition-colors duration-fast",
        isActive
          ? "bg-vsc-accent/15 text-vsc-accent"
          : "text-vsc-text-secondary hover:bg-vsc-surface-2/50 hover:text-vsc-text-primary",
      )}
      onClick={handleClick}
      title={command.command}
    >
      <Icon name={status.icon} size={10} className={cn("shrink-0", status.color)} />
      <span className="flex-1 min-w-0 truncate">{command.command}</span>
      <DurationLabel durationMs={command.duration} />
    </button>
  );
});

// ─── BlockOutline ────────────────────────────────────────

export const BlockOutline = memo(function BlockOutline({
  commands,
  activeCommandId,
  onCommandClick,
  className,
}: BlockOutlineProps) {
  if (commands.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-px py-1",
        "bg-vsc-surface-0/60",
        "border border-vsc-border/20 rounded-md",
        "overflow-y-auto scrollbar-none",
        "max-h-40",
        className,
      )}
      role="list"
      aria-label="Command outline"
      data-testid="block-outline"
    >
      {commands.map((cmd) => (
        <OutlineRow
          key={cmd.commandId}
          command={cmd}
          isActive={cmd.commandId === activeCommandId}
          onClick={onCommandClick}
        />
      ))}
    </div>
  );
});
