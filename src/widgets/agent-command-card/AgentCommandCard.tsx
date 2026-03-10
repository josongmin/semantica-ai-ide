/**
 * AgentCommandCard — RFC-TERMINAL-003 §4, RFC-004 §5
 *
 * A rich card displayed in the chat/agent conversation when an agent
 * executes a terminal command. Shows command, status, output preview,
 * approval flow, and links to the terminal session.
 *
 * Used within MessageList for agent tool call results.
 */

import { memo, useCallback, useState } from "react";

import type {
  AgentTerminalExecRequest,
  AgentTerminalExecutionResult,
  ExecutionStatus,
} from "~shared/bootstrap/terminal/model/types";

import { DurationLabel } from "../../shared/ui/primitives/DurationLabel";
import { ExitCodeBadge } from "../../shared/ui/primitives/ExitCodeBadge";
import { Icon } from "../../shared/ui/primitives/Icon";
import { ProvenanceBadge } from "../../shared/ui/primitives/ProvenanceBadge";
import { cn } from "../../shared/ui/variants";

// ─── Helpers ───────────────────────────────────────────────

function getStatusConfig(status: ExecutionStatus) {
  switch (status) {
    case "succeeded":
      return { icon: "check", color: "text-vsc-success", bg: "bg-vsc-success/8", border: "border-l-vsc-success" };
    case "failed":
      return { icon: "error", color: "text-vsc-error", bg: "bg-vsc-error/8", border: "border-l-vsc-error" };
    case "cancelled":
      return { icon: "circle-slash", color: "text-vsc-warning", bg: "bg-vsc-warning/8", border: "border-l-vsc-warning" };
    case "timeout":
      return { icon: "watch", color: "text-vsc-warning", bg: "bg-vsc-warning/8", border: "border-l-vsc-warning" };
  }
}

// ─── Card Header ───────────────────────────────────────────

interface CardHeaderProps {
  request: AgentTerminalExecRequest;
  result?: AgentTerminalExecutionResult;
}

const CardHeader = memo(function CardHeader({ request, result }: CardHeaderProps) {
  const isRunning = !result;
  const statusConfig = result ? getStatusConfig(result.status) : null;

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* Icon */}
      <Icon
        name={isRunning ? "terminal" : (statusConfig?.icon ?? "terminal")}
        tokenSize="sm"
        className={cn(
          isRunning ? "text-vsc-info animate-pulse" : statusConfig?.color,
        )}
      />

      {/* Command text */}
      <span className="flex-1 min-w-0 truncate font-mono text-xs text-vsc-text-primary">
        <span className="text-vsc-accent/60 mr-1">$</span>
        {request.command}
      </span>

      {/* Metadata */}
      <div className="flex items-center gap-2 shrink-0">
        {request.purpose && (
          <span className="text-3xs text-vsc-text-ghost bg-vsc-surface-1 px-1.5 py-0.5 rounded-sm">
            {request.purpose}
          </span>
        )}
        <ProvenanceBadge source="agent" />
        {result && <ExitCodeBadge exitCode={result.exitCode} />}
        {result && <DurationLabel durationMs={result.duration} />}
      </div>
    </div>
  );
});

// ─── Output Preview ────────────────────────────────────────

interface OutputPreviewProps {
  outputPreview?: string;
  lineCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

const OutputPreview = memo(function OutputPreview({
  outputPreview,
  lineCount,
  isCollapsed,
  onToggle,
}: OutputPreviewProps) {
  if (!outputPreview && lineCount === 0) return null;

  return (
    <div className="border-t border-vsc-border/20">
      {/* Toggle header */}
      <button
        type="button"
        className={cn(
          "flex items-center gap-1.5 w-full px-3 py-1",
          "text-2xs text-vsc-text-tertiary",
          "hover:bg-vsc-surface-1/50 transition-colors duration-fast",
        )}
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-label={`Toggle output preview (${lineCount} line${lineCount !== 1 ? "s" : ""})`}
      >
        <Icon
          name={isCollapsed ? "chevron-right" : "chevron-down"}
          tokenSize="2xs"
        />
        <span>Output ({lineCount} line{lineCount !== 1 ? "s" : ""})</span>
      </button>

      {/* Preview content */}
      {!isCollapsed && outputPreview && (
        <pre
          className={cn(
            "px-3 py-2 overflow-x-auto",
            "font-mono text-2xs text-vsc-text-secondary",
            "bg-vsc-code-bg/60",
            "max-h-[200px] overflow-y-auto scrollbar-none",
            "whitespace-pre-wrap break-all",
          )}
        >
          {outputPreview}
        </pre>
      )}
    </div>
  );
});

// ─── Approval Section ──────────────────────────────────────

interface ApprovalSectionProps {
  request: AgentTerminalExecRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const ApprovalSection = memo(function ApprovalSection({
  request,
  onApprove,
  onReject,
}: ApprovalSectionProps) {
  if (!request.approvalRequired) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        "bg-vsc-warning/5 border-t border-vsc-warning/20",
      )}
    >
      <Icon name="shield" tokenSize="xs" className="text-vsc-warning shrink-0" />
      <span className="flex-1 text-2xs text-vsc-warning">
        This command requires approval before execution
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={cn(
            "px-2.5 py-1 rounded text-2xs font-medium",
            "bg-vsc-success/15 text-vsc-success",
            "hover:bg-vsc-success/25 transition-colors duration-fast",
          )}
          onClick={() => onApprove(request.requestId)}
          aria-label="Approve command execution"
        >
          Approve
        </button>
        <button
          type="button"
          className={cn(
            "px-2.5 py-1 rounded text-2xs font-medium",
            "bg-vsc-error/15 text-vsc-error",
            "hover:bg-vsc-error/25 transition-colors duration-fast",
          )}
          onClick={() => onReject(request.requestId)}
          aria-label="Reject command execution"
        >
          Reject
        </button>
      </div>
    </div>
  );
});

// ─── AgentCommandCard ──────────────────────────────────────

export interface AgentCommandCardProps {
  request: AgentTerminalExecRequest;
  result?: AgentTerminalExecutionResult;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onOpenInTerminal?: (sessionId: string) => void;
  className?: string;
}

export const AgentCommandCard = memo(function AgentCommandCard({
  request,
  result,
  onApprove,
  onReject,
  onOpenInTerminal,
  className,
}: AgentCommandCardProps) {
  const [outputCollapsed, setOutputCollapsed] = useState(true);
  const toggleOutput = useCallback(() => setOutputCollapsed((c) => !c), []);

  const statusConfig = result ? getStatusConfig(result.status) : null;
  const isRunning = !result;

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        "border border-vsc-border/30",
        "border-l-2",
        isRunning
          ? "border-l-vsc-info bg-vsc-info/3"
          : cn(statusConfig?.border, statusConfig?.bg),
        className,
      )}
      data-testid="agent-command-card"
      data-request-id={request.requestId}
    >
      {/* Header */}
      <CardHeader request={request} result={result} />

      {/* Approval (if needed) */}
      {isRunning && onApprove && onReject && (
        <ApprovalSection
          request={request}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}

      {/* Output preview */}
      {result && (
        <OutputPreview
          outputPreview={result.outputPreview}
          lineCount={result.outputLineCount}
          isCollapsed={outputCollapsed}
          onToggle={toggleOutput}
        />
      )}

      {/* Footer: link to terminal */}
      {result && onOpenInTerminal && (
        <div className="border-t border-vsc-border/15">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 w-full px-3 py-1",
              "text-2xs text-vsc-text-ghost",
              "hover:text-vsc-accent hover:bg-vsc-surface-1/30",
              "transition-colors duration-fast",
            )}
            onClick={() => onOpenInTerminal(result.sessionId)}
            aria-label="Open in Terminal"
          >
            <Icon name="terminal" tokenSize="2xs" />
            <span>Open in Terminal</span>
          </button>
        </div>
      )}
    </div>
  );
});
