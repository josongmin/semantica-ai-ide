/**
 * BlockActions — RFC-TERMINAL-017 §4.2
 *
 * Contextual action bar shown at the bottom of command blocks.
 * Actions vary based on command status (failed blocks get more options).
 */

import { memo, useCallback } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { exportBlockAsJSON, exportBlockAsMarkdown } from "../lib/blockExport";
import type { DiagnosticEvent, ParsedTerminalEvent, TerminalCommand } from "../model/types";

// ─── Types ───────────────────────────────────────────────

export interface BlockActionsProps {
  command: TerminalCommand;
  diagnostics: DiagnosticEvent[];
  /** Full parsed events for this command's session (used for MD/JSON export) */
  parsedEvents?: ParsedTerminalEvent[];
  onRerun?: (command: TerminalCommand) => void;
  onCopyCommand?: (command: TerminalCommand) => void;
  onCopyBlock?: (command: TerminalCommand) => void;
  onOpenProblems?: (command: TerminalCommand, diagnostics: DiagnosticEvent[]) => void;
  onExplain?: (command: TerminalCommand) => void;
  onAskAgent?: (command: TerminalCommand, intent: "explain" | "fix" | "debug") => void;
  className?: string;
}

// ─── ActionButton ────────────────────────────────────────

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "accent" | "danger";
  className?: string;
}

const ActionButton = memo(function ActionButton({
  icon,
  label,
  onClick,
  variant = "default",
  className,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
        "text-3xs font-medium cursor-pointer",
        "transition-[transform,filter] duration-fast active:scale-95 active:brightness-75",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vsc-accent/50",
        variant === "default" && "text-vsc-text-secondary hover:text-vsc-text-primary hover:bg-vsc-surface-2/60",
        variant === "accent" && "text-vsc-accent/80 hover:text-vsc-accent hover:bg-vsc-accent/10",
        variant === "danger" && "text-vsc-error/70 hover:text-vsc-error hover:bg-vsc-error/10",
        className,
      )}
      onClick={onClick}
      title={label}
    >
      <Icon name={icon} size={12} />
      <span>{label}</span>
    </button>
  );
});

// ─── BlockActions ────────────────────────────────────────

export const BlockActions = memo(function BlockActions({
  command,
  diagnostics,
  parsedEvents = [],
  onRerun,
  onCopyCommand,
  onCopyBlock,
  onOpenProblems,
  onExplain,
  onAskAgent,
  className,
}: BlockActionsProps) {
  const isFailed = command.status === "failed";
  const isFinished = command.status !== "running";
  const hasDiagnostics = diagnostics.length > 0;
  const hasParsedEvents = parsedEvents.some((e) => e.commandId === command.commandId);

  const handleCopyCommand = useCallback(() => {
    void navigator.clipboard.writeText(command.command);
  }, [command.command]);

  const handleCopyBlockMd = useCallback(() => {
    const md = exportBlockAsMarkdown(command, parsedEvents);
    void navigator.clipboard.writeText(md);
    onCopyBlock?.(command);
  }, [command, parsedEvents, onCopyBlock]);

  const handleExportJSON = useCallback(() => {
    const json = exportBlockAsJSON(command, parsedEvents);
    void navigator.clipboard.writeText(json);
  }, [command, parsedEvents]);

  // Don't show actions for running commands
  if (!isFinished) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1",
        "border-t border-vsc-border/15",
        "bg-vsc-surface-0/40",
        className,
      )}
    >
      {/* Always available */}
      {onRerun && (
        <ActionButton
          icon="debug-restart"
          label="Rerun"
          onClick={() => onRerun(command)}
        />
      )}

      <ActionButton
        icon="copy"
        label="Copy"
        onClick={onCopyCommand ? () => onCopyCommand(command) : handleCopyCommand}
      />

      <ActionButton
        icon="markdown"
        label="Copy MD"
        onClick={handleCopyBlockMd}
      />

      {/* Export JSON — only shown when there are parsed events */}
      {hasParsedEvents && (
        <ActionButton
          icon="json"
          label="Export JSON"
          onClick={handleExportJSON}
        />
      )}

      {/* Separator */}
      {isFailed && <span className="w-px h-3.5 bg-vsc-border/20" />}

      {/* Failed block extras */}
      {isFailed && hasDiagnostics && onOpenProblems && (
        <ActionButton
          icon="warning"
          label="Problems"
          variant="danger"
          onClick={() => onOpenProblems(command, diagnostics)}
        />
      )}

      {isFailed && onExplain && (
        <ActionButton
          icon="lightbulb"
          label="Explain"
          variant="accent"
          onClick={() => onExplain(command)}
        />
      )}

      {isFailed && onAskAgent && (
        <ActionButton
          icon="hubot"
          label="Fix with Agent"
          variant="accent"
          onClick={() => onAskAgent(command, "fix")}
        />
      )}
    </div>
  );
});
