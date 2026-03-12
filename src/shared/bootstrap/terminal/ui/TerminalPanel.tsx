/**
 * TerminalPanel — IntelliJ-style terminal with tab groups
 *
 * Each tab is a group of 1–2 sessions. All sessions stay mounted
 * (preserving xterm state). Only the active tab's sessions are displayed.
 */

import { memo, useCallback, useMemo } from "react";
import { useSetAtom } from "jotai";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { useFEParserFallback } from "../lib/useFEParserFallback";
import { usePluginParserSync } from "../lib/usePluginParserSync";
import { useTerminalProblemsSync } from "../lib/useTerminalProblemsSync";
import { removeTerminalSessionAtom } from "../model/atoms";
import { activeTerminalSessionIdAtom } from "../model/sessionAtoms";
import { useTerminalSessions } from "./hooks/useTerminalSessions";
import { TerminalPane } from "./TerminalPane";
import { TerminalSessionTabs } from "./TerminalSessionTabs";

// ─── Component ─────────────────────────────────────────────

export interface TerminalViewProps {
  className?: string;
}

/** @deprecated Use TerminalViewProps instead */
export type TerminalPanelProps = TerminalViewProps;

export const TerminalView = memo(function TerminalView({ className }: TerminalViewProps) {
  const {
    sessions,
    activeSessionId,
    visiblePaneIds,
    createSession: handleCreateSession,
    splitSession: handleSplitSession,
  } = useTerminalSessions();
  const setActiveSessionId = useSetAtom(activeTerminalSessionIdAtom);
  const removeSession = useSetAtom(removeTerminalSessionAtom);

  useFEParserFallback();
  usePluginParserSync();
  useTerminalProblemsSync();

  const handlePaneFocus = useCallback(
    (sessionId: string) => {
      setActiveSessionId(sessionId as never);
    },
    [setActiveSessionId],
  );

  /** Close the current active tab — removes its sessions, tab cleanup is automatic */
  const handleCloseCurrentTab = useCallback(() => {
    for (const sid of visiblePaneIds) {
      removeSession(sid as never);
    }
  }, [visiblePaneIds, removeSession]);

  const visibleSet = useMemo(() => new Set(visiblePaneIds), [visiblePaneIds]);

  return (
    <div
      className={cn("flex flex-col h-full", "bg-vsc-bg", className)}
      tabIndex={-1}
      role="region"
      aria-label="Terminal panel"
      data-testid="terminal-panel"
    >
      <TerminalSessionTabs
        onCreateSession={handleCreateSession}
        onSplitSession={handleSplitSession}
      />

      <div className="relative flex-1 min-h-0">
        {sessions.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-vsc-text-ghost select-none">
            <Icon name="terminal" size={28} className="opacity-20" />
            <div className="text-xs">No active sessions</div>
            <div className="text-3xs text-vsc-text-ghost/50">
              Press{" "}
              <kbd className="px-1 py-0.5 rounded bg-vsc-surface-1 text-vsc-text-tertiary font-mono">
                Ctrl+`
              </kbd>{" "}
              or click <strong>+</strong>
            </div>
          </div>
        ) : (
          <>
            {/* Visible panes (active tab's sessions) */}
            <div className="absolute inset-0 flex">
              {visiblePaneIds.map((paneId, idx) => (
                <div key={paneId} className="flex-1 min-w-0 flex">
                  {idx > 0 && <div className="w-px shrink-0 bg-vsc-border/30" />}
                  <TerminalPane
                    sessionId={paneId}
                    isFocused={paneId === activeSessionId}
                    onFocus={handlePaneFocus}
                    onSplitSession={handleSplitSession}
                    onCreateSession={handleCreateSession}
                    onCloseSession={handleCloseCurrentTab}
                  />
                </div>
              ))}
            </div>

            {/* Hidden panes — kept mounted to preserve xterm state */}
            {sessions
              .filter((s) => !visibleSet.has(s.sessionId as never))
              .map((s) => (
                <div
                  key={s.sessionId}
                  className="absolute inset-0 invisible pointer-events-none"
                  aria-hidden="true"
                >
                  <TerminalPane
                    sessionId={s.sessionId}
                    isFocused={false}
                    onFocus={handlePaneFocus}
                  />
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
});

/** @deprecated Use TerminalView instead */
export { TerminalView as TerminalPanel };
