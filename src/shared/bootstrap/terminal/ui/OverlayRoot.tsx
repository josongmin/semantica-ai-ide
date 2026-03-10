/**
 * OverlayRoot — RFC-TERMINAL-005 §11.3, RFC-TERMINAL-017 §6
 *
 * The transparent React overlay that sits on top of the xterm.js viewport.
 * Contains command blocks, command rail, parsed decorations, and sticky header.
 *
 * Phase B: Fully wired with intent dispatch for file links, diagnostics,
 * block actions (rerun, copy, problems, explain, ask agent), and summary footer.
 *
 * CRITICAL: pointer-events-none on root, pointer-events-auto on interactive elements.
 * This allows clicks to pass through to the xterm.js canvas below.
 *
 * Layer stack:
 *   z-0: xterm.js viewport (TerminalViewportRaw)
 *   z-10: OverlayRoot (this component)
 *   z-20: StickyCommandHeader (within overlay)
 */

import { memo, useMemo } from "react";
import { useAtomValue } from "jotai";

import { cn } from "~shared/ui/variants";

import {
  activeSessionCommandsAtom,
  activeSessionOverlayEnabledAtom,
  activeTerminalSessionIdAtom,
  terminalParsedEventMapAtom,
} from "../model/atoms";
import type { DiagnosticEvent, FileLinkEvent, TerminalCommand, UrlEvent } from "../model/types";
import { CommandBlock } from "./CommandBlock";
import { CommandRail } from "./CommandRail";
import { StickyCommandHeader } from "./StickyCommandHeader";

// ─── OverlayRoot ───────────────────────────────────────────

export interface OverlayRootProps {
  /** Rerun a command by writing it to PTY */
  onRerun?: (command: TerminalCommand) => void;
  /** Click a rail dot to scroll to that command */
  onCommandRailClick?: (command: TerminalCommand) => void;
  /** Open Problems panel filtered to this command's diagnostics */
  onOpenProblems?: (command: TerminalCommand, diagnostics: DiagnosticEvent[]) => void;
  /** Ask agent to explain/fix/debug this command's output */
  onAskAgent?: (command: TerminalCommand, intent: "explain" | "fix" | "debug") => void;
  /** Explain command output (AI popover) */
  onExplain?: (command: TerminalCommand) => void;
  /** Copy command text to clipboard */
  onCopyCommand?: (command: TerminalCommand) => void;
  /** Copy block as markdown */
  onCopyBlock?: (command: TerminalCommand) => void;
  /** Decoration click handlers (cross-surface intents) */
  onDiagnosticClick?: (d: DiagnosticEvent) => void;
  onFileLinkClick?: (l: FileLinkEvent) => void;
  onUrlClick?: (u: UrlEvent) => void;
  /** Keyboard-focused command ID (from block navigation) */
  focusedCommandId?: string | null;
  className?: string;
}

export const OverlayRoot = memo(function OverlayRoot({
  onRerun,
  onCommandRailClick,
  onOpenProblems,
  onAskAgent,
  onExplain,
  onCopyCommand,
  onCopyBlock,
  onDiagnosticClick,
  onFileLinkClick,
  onUrlClick,
  focusedCommandId,
  className,
}: OverlayRootProps) {
  const overlayEnabled = useAtomValue(activeSessionOverlayEnabledAtom);
  const commands = useAtomValue(activeSessionCommandsAtom);
  const sessionId = useAtomValue(activeTerminalSessionIdAtom);
  const parsedEventMap = useAtomValue(terminalParsedEventMapAtom);

  // Get parsed events for the active session
  const parsedEvents = sessionId ? (parsedEventMap.get(sessionId) ?? []) : [];

  // Find running command for sticky header (memoized to avoid O(n) on every render)
  const { runningCommand, lastCommand } = useMemo(() => ({
    runningCommand: commands.find((c) => c.status === "running"),
    lastCommand: commands[commands.length - 1],
  }), [commands]);

  // Overlay disabled (alt-screen, TUI, etc.) — render nothing
  if (!overlayEnabled) return null;

  // No commands yet — render nothing
  if (commands.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-(--z-sticky)",
        "pointer-events-none",
        "overflow-hidden",
        className,
      )}
      data-testid="terminal-overlay-root"
    >
      {/* Sticky header for current/last command */}
      <StickyCommandHeader command={runningCommand ?? lastCommand} />

      {/* Main overlay content: rail + blocks */}
      <div className="flex h-full">
        {/* Command Rail (left gutter) */}
        <div className="pointer-events-auto">
          <CommandRail commands={commands} onCommandClick={onCommandRailClick} />
        </div>

        {/* Command Blocks (overlay region) */}
        <div className="flex-1 flex flex-col gap-1 p-1 overflow-y-auto scrollbar-none">
          {commands.map((cmd) => (
            <div key={cmd.commandId} className="pointer-events-auto">
              <CommandBlock
                command={cmd}
                parsedEvents={parsedEvents}
                onRerun={onRerun}
                onCopyCommand={onCopyCommand}
                onCopyBlock={onCopyBlock}
                onOpenProblems={onOpenProblems}
                onExplain={onExplain}
                onAskAgent={onAskAgent}
                onDiagnosticClick={onDiagnosticClick}
                onFileLinkClick={onFileLinkClick}
                onUrlClick={onUrlClick}
                defaultCollapsed={cmd.status === "succeeded"}
                isFocused={cmd.commandId === focusedCommandId}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
