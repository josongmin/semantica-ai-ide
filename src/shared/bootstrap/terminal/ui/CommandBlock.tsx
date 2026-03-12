/**
 * CommandBlock — RFC-TERMINAL-004 §3, RFC-005 §11.3
 *
 * A single command block in the terminal overlay. Each executed command
 * gets its own block with header (command text, status, duration, provenance)
 * and collapsible output region.
 *
 * Layout:
 * ┌─[rail]─┬─[header: $ npm test ─── ✓ 3.2s ─── agent]──────┐
 * │  ●     │  output line 1                                    │
 * │        │  output line 2                                    │
 * │        │  ...                                              │
 * └────────┴───────────────────────────────────────────────────┘
 */

import { memo, useCallback, useState } from "react";

import { DurationLabel } from "~shared/ui/primitives/DurationLabel";
import { ExitCodeBadge } from "~shared/ui/primitives/ExitCodeBadge";
import { Icon } from "~shared/ui/primitives/Icon";
import { ProvenanceBadge, type ProvenanceSource } from "~shared/ui/primitives/ProvenanceBadge";
import { cn } from "~shared/ui/variants";

import type {
  CommandProvenance,
  CommandStatus,
  DiagnosticEvent,
  FileLinkEvent,
  ParsedTerminalEvent,
  TerminalCommand,
  UrlEvent,
} from "../model/types";
import { BlockActions } from "./BlockActions";
import { BlockSummaryFooter } from "./BlockSummaryFooter";
import { ParsedEventDecoration } from "./ParsedDecorations";

// ─── Helpers ───────────────────────────────────────────────

const STATUS_ICON: Record<CommandStatus, { name: string; className: string }> = {
  running: { name: "loading~spin", className: "text-vsc-info animate-spin" },
  succeeded: { name: "check", className: "text-vsc-success" },
  failed: { name: "error", className: "text-vsc-error" },
  cancelled: { name: "circle-slash", className: "text-vsc-warning" },
  unknown: { name: "question", className: "text-vsc-text-tertiary" },
};

function provenanceSource(prov: CommandProvenance): ProvenanceSource {
  return prov.source === "rerun" ? "user" : prov.source;
}

// ─── CommandBlockHeader ────────────────────────────────────

interface CommandBlockHeaderProps {
  command: TerminalCommand;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRerun?: (command: TerminalCommand) => void;
}

const CommandBlockHeader = memo(function CommandBlockHeader({
  command,
  isCollapsed,
  onToggleCollapse,
  onRerun,
}: CommandBlockHeaderProps) {
  const status = STATUS_ICON[command.status];

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2.5 py-1.5",
        "bg-vsc-surface-1/90",
        "border-b border-vsc-border/30",
        "cursor-pointer select-none",
        "hover:bg-vsc-surface-1 active:bg-vsc-surface-2 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vsc-accent/70",
      )}
      onClick={onToggleCollapse}
      role="button"
      tabIndex={0}
      aria-expanded={!isCollapsed}
      aria-label={`${command.command} — ${command.status}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleCollapse();
        }
      }}
    >
      {/* Collapse chevron */}
      <Icon
        name={isCollapsed ? "chevron-right" : "chevron-down"}
        size={12}
        className="text-vsc-text-ghost shrink-0 transition-transform duration-fast"
      />

      {/* Status icon */}
      <Icon name={status.name} size={14} className={cn("shrink-0", status.className)} />

      {/* Command text */}
      <span className="flex-1 min-w-0 truncate font-mono text-2xs text-vsc-text-primary">
        <span className="text-vsc-accent/60 mr-1">$</span>
        {command.command}
      </span>

      {/* Right side: metadata */}
      <div className="flex items-center gap-2 shrink-0">
        <ProvenanceBadge source={provenanceSource(command.provenance)} />
        <ExitCodeBadge exitCode={command.exitCode} />
        <DurationLabel durationMs={command.duration} />

        {/* Rerun button */}
        {onRerun && command.status !== "running" && (
          <button
            type="button"
            className={cn(
              "p-0.5 rounded opacity-0 group-hover:opacity-100",
              "text-vsc-text-tertiary hover:text-vsc-accent",
              "transition-opacity duration-fast",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRerun(command);
            }}
            title="Rerun command"
            aria-label="Rerun command"
          >
            <Icon name="debug-restart" size={13} />
          </button>
        )}
      </div>
    </div>
  );
});

// ─── CommandBlock ──────────────────────────────────────────

export interface CommandBlockProps {
  command: TerminalCommand;
  /** Output lines for this command (derived from xterm buffer range) */
  outputLineCount?: number;
  /** Parsed events for this command's session */
  parsedEvents?: ParsedTerminalEvent[];
  /** All callbacks from OverlayRoot */
  onRerun?: (command: TerminalCommand) => void;
  onCopyCommand?: (command: TerminalCommand) => void;
  onCopyBlock?: (command: TerminalCommand) => void;
  onOpenProblems?: (command: TerminalCommand, diagnostics: DiagnosticEvent[]) => void;
  onExplain?: (command: TerminalCommand) => void;
  onAskAgent?: (command: TerminalCommand, intent: "explain" | "fix" | "debug") => void;
  /** Decoration click handlers (cross-surface intents) */
  onDiagnosticClick?: (d: DiagnosticEvent) => void;
  onFileLinkClick?: (l: FileLinkEvent) => void;
  onUrlClick?: (u: UrlEvent) => void;
  className?: string;
  defaultCollapsed?: boolean;
  /** Whether this block is keyboard-focused */
  isFocused?: boolean;
}

export const CommandBlock = memo(function CommandBlock({
  command,
  outputLineCount,
  parsedEvents = [],
  onRerun,
  onCopyCommand,
  onCopyBlock,
  onOpenProblems,
  onExplain,
  onAskAgent,
  onDiagnosticClick,
  onFileLinkClick,
  onUrlClick,
  className,
  defaultCollapsed = false,
  isFocused = false,
}: CommandBlockProps) {
  const [isCollapsed, setCollapsed] = useState(defaultCollapsed);
  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), []);

  // Extract events for this command
  const commandEvents = parsedEvents.filter((e) => e.commandId === command.commandId);
  const diagnostics = commandEvents
    .filter((e) => e.kind === "diagnostic")
    .map((e) => e.data as DiagnosticEvent);
  // Renderable inline decorations (diagnostics, file links, URLs, ports, tests)
  const inlineDecorations = commandEvents.filter(
    (e) =>
      e.kind === "diagnostic" ||
      e.kind === "file-link" ||
      e.kind === "url" ||
      e.kind === "port-binding" ||
      e.kind === "test-result",
  );

  const hasActions = command.status !== "running";
  const hasSummary = commandEvents.length > 0;

  let outputHeightClass: string;
  if (outputLineCount !== undefined && outputLineCount > 0) outputHeightClass = "min-h-6";
  else if (inlineDecorations.length > 0) outputHeightClass = "min-h-4";
  else outputHeightClass = "h-0";

  return (
    <div
      className={cn(
        "rounded-md overflow-hidden",
        "border border-vsc-border/20",
        "bg-vsc-code-bg/50",
        command.status === "failed" && "border-l-2 border-l-vsc-error/40",
        command.status === "running" && "border-l-2 border-l-vsc-info/40",
        isFocused && "ring-1 ring-vsc-accent/50",
        className,
      )}
      data-command-id={command.commandId}
      data-command-status={command.status}
    >
      <CommandBlockHeader
        command={command}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        onRerun={onRerun}
      />

      {/* Output region — pointer-events-none so clicks pass through to xterm */}
      {!isCollapsed && (
        <div
          className={cn("relative animate-in fade-in duration-normal", outputHeightClass)}
          data-output-range={
            command.outputLineRange
              ? `${command.outputLineRange.start}-${command.outputLineRange.end}`
              : undefined
          }
        >
          {/* Inline parsed decorations (file links, diagnostics, URLs, etc.) */}
          {inlineDecorations.length > 0 && (
            <div className="flex flex-wrap gap-1 px-2 py-1">
              {inlineDecorations.map((event) => (
                <ParsedEventDecoration
                  key={event.eventId}
                  event={event}
                  onDiagnosticClick={onDiagnosticClick}
                  onFileLinkClick={onFileLinkClick}
                  onUrlClick={onUrlClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary footer — auto-generated from parsed events */}
      {!isCollapsed && hasSummary && (
        <BlockSummaryFooter commandId={command.commandId} parsedEvents={parsedEvents} />
      )}

      {/* Action bar — contextual actions for this block */}
      {!isCollapsed && hasActions && (
        <BlockActions
          command={command}
          diagnostics={diagnostics}
          parsedEvents={parsedEvents}
          onRerun={onRerun}
          onCopyCommand={onCopyCommand}
          onCopyBlock={onCopyBlock}
          onOpenProblems={onOpenProblems}
          onExplain={onExplain}
          onAskAgent={onAskAgent}
        />
      )}
    </div>
  );
});
