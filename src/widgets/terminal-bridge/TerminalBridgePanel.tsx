import React, { useCallback, useEffect,useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useTerminalCommand } from "~shared/bootstrap/terminal-bridge";

import {
  activeSessionOutputAtom,
  activeTerminalSessionIdAtom,
  pendingActionCountAtom,
  pendingTerminalActionsAtom,
  setActiveSessionAtom,
  terminalSessionsAtom,
} from "../../entities/terminal-bridge";
import type { TerminalAgentAction, TerminalSessionId } from "../../shared/protocol";
import { Badge, cn, Icon, Text } from "../../shared/ui";

// ─── Terminal Action Item ────────────────────────────────────

interface ActionItemProps {
  readonly action: TerminalAgentAction;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
}

const TerminalActionItem = React.memo(function TerminalActionItem({
  action,
  onApprove,
  onReject,
}: ActionItemProps) {
  return (
    <div
      className={cn(
        "rounded-md border-l-2 p-2.5 space-y-1.5",
        action.status === "pending" && "border-vsc-warning bg-vsc-warning/5",
        action.status === "approved" && "border-vsc-success bg-vsc-success/5",
        action.status === "rejected" && "border-vsc-error bg-vsc-error/5 opacity-50",
        action.status === "executed" && "border-vsc-info bg-vsc-info/5",
      )}
      role={action.status === "pending" ? "alert" : undefined}
      aria-label={`Agent command: ${action.command}`}
    >
      <div className="font-mono text-2xs text-vsc-text-primary">
        $ {action.command}
      </div>
      <Text size="2xs" tone="tertiary">{action.reason}</Text>

      {action.status === "pending" && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onApprove(action.id)}
            aria-label={`Approve: ${action.command}`}
            className="h-5 px-2 rounded text-2xs font-medium
                       bg-vsc-success/20 text-vsc-success
                       hover:bg-vsc-success/30 transition-colors duration-fast cursor-pointer focus-ring"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(action.id)}
            aria-label={`Reject: ${action.command}`}
            className="h-5 px-2 rounded text-2xs font-medium
                       bg-vsc-error/20 text-vsc-error
                       hover:bg-vsc-error/30 transition-colors duration-fast cursor-pointer focus-ring"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
});

// ─── Terminal Output View ────────────────────────────────────

const TerminalOutputView = React.memo(function TerminalOutputView() {
  const output = useAtomValue(activeSessionOutputAtom);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output.length]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto font-mono text-2xs leading-relaxed
                 bg-vsc-bg/80 rounded-md p-2 min-h-[120px] max-h-[--panel-max-h-sm]"
      role="log"
      aria-label="Terminal output"
    >
      {output.length === 0 ? (
        <span className="text-vsc-text-ghost">No output yet...</span>
      ) : (
        output.map((line, i) => (
          <div
            key={`${line.timestamp}-${i}`}
            className={cn(
              "whitespace-pre-wrap break-all",
              line.isError ? "text-vsc-error" : "text-vsc-text-secondary",
            )}
          >
            {line.text}
          </div>
        ))
      )}
    </div>
  );
});

// ─── Main Panel ──────────────────────────────────────────────

export const TerminalBridgePanel = React.memo(function TerminalBridgePanel() {
  const sessions = useAtomValue(terminalSessionsAtom);
  const actions = useAtomValue(pendingTerminalActionsAtom);
  const pendingCount = useAtomValue(pendingActionCountAtom);
  const activeSessionId = useAtomValue(activeTerminalSessionIdAtom);
  const switchSession = useSetAtom(setActiveSessionAtom);
  const { approveAction, rejectAction } = useTerminalCommand();

  const handleApprove = useCallback((id: string) => approveAction(id), [approveAction]);
  const handleReject = useCallback((id: string) => rejectAction(id), [rejectAction]);
  const handleSessionClick = useCallback(
    (id: TerminalSessionId) => switchSession(id),
    [switchSession],
  );

  const pendingActions = actions.filter((a) => a.status === "pending");

  if (sessions.length === 0 && pendingActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-vsc-text-ghost">
        <Icon name="terminal" tokenSize="lg" className="mb-2 opacity-40" />
        <Text size="sm" tone="ghost">No terminal sessions</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3" data-testid="terminal-bridge-panel">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon name="terminal" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="bold">Terminal Bridge</Text>
        {pendingCount > 0 && (
          <Badge text={`${pendingCount} pending`} variant="warning" className="ml-auto" />
        )}
      </div>

      {/* Session tabs */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Terminal sessions">
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId || s.isActive;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSessionClick(s.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-2xs shrink-0 cursor-pointer transition-colors duration-fast focus-ring",
                  isActive
                    ? "bg-vsc-info/20 text-vsc-info"
                    : "bg-vsc-surface-2 text-vsc-text-ghost hover:text-vsc-text-secondary transition-colors duration-fast",
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Pending actions (approval queue) */}
      {pendingActions.length > 0 && (
        <div className="space-y-2">
          <Text size="xs" weight="medium" tone="secondary">
            Awaiting Approval
          </Text>
          {pendingActions.map((action) => (
            <TerminalActionItem
              key={action.id}
              action={action}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Output */}
      <TerminalOutputView />
    </div>
  );
});
