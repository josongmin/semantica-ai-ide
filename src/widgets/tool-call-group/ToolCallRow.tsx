import React, { useCallback, useId, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { categoryIcons, riskLevelIcons, toolCallAtomFamily } from "~entities/tool-call";

import { approvalGateAdapterAtom, dangerousApprovalToolCallIdAtom } from "../../shared/lib";
import { Button, cn, Icon, RISK_TEXT_COLOR, Text } from "../../shared/ui";
import { TerminalOutputViewer } from "../terminal-output-viewer";
import { ToolOutputViewer } from "../tool-output-viewer";
import { useToolCallStatus } from "./hooks/useToolCallStatus";
import { InlineDiffSummary, looksLikeDiff } from "./InlineDiffSummary";
import { ToolActionButtons } from "./ToolActionButtons";

interface ToolCallRowProps {
  id: string;
}

export const ToolCallRow = React.memo(function ToolCallRow({ id }: ToolCallRowProps) {
  const tc = useAtomValue(toolCallAtomFamily(id));
  const setDangerousId = useSetAtom(dangerousApprovalToolCallIdAtom);
  const approvalGate = useAtomValue(approvalGateAdapterAtom);
  const grantApproval = approvalGate?.grantApproval;
  const denyApproval = approvalGate?.denyApproval;
  const stopTool = approvalGate?.stopTool;
  const retryTool = approvalGate?.retryTool;
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  const status = useToolCallStatus(tc);

  const toggleExpand = useCallback(() => setExpanded((v) => !v), []);

  const handleApprove = useCallback(() => {
    if (!tc?.approval_action_id) return;
    if (tc.risk_level === "dangerous") {
      setDangerousId(tc.id);
      return;
    }
    grantApproval?.(tc.approval_action_id);
  }, [tc, setDangerousId, grantApproval]);

  const handleDeny = useCallback(() => {
    if (!tc?.approval_action_id) return;
    denyApproval?.(tc.approval_action_id);
  }, [tc, denyApproval]);

  const handleCancel = useCallback(() => {
    if (!tc) return;
    stopTool?.(tc.id);
  }, [tc, stopTool]);

  const handleRetry = useCallback(() => {
    if (!tc) return;
    retryTool?.(tc.id);
  }, [tc, retryTool]);

  if (!tc) return null;

  const iconName = categoryIcons[tc.category];

  return (
    <div
      className={
        status.showFlash ? "animate-[tool-success-flash_600ms_ease-out_forwards]" : undefined
      }
      onAnimationEnd={status.showFlash ? status.onFlashEnd : undefined}
    >
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpand}
          aria-expanded={expanded}
          aria-controls={expanded ? contentId : undefined}
          className="flex-1 min-w-0 text-left gap-1.5 py-0.5 px-1 rounded-md text-xs bg-transparent text-vsc-fg hover:bg-vsc-list-hover"
        >
          {status.isAwaitingApproval && tc.risk_level && (
            <Icon
              name={riskLevelIcons[tc.risk_level]}
              tokenSize="xs"
              className={cn("shrink-0", RISK_TEXT_COLOR[tc.risk_level])}
            />
          )}
          <Icon
            name={status.isSuccess ? "check" : iconName}
            tokenSize="xs"
            className={cn(
              "shrink-0 transition-colors duration-normal",
              status.isSuccess ? "text-vsc-success" : "text-vsc-text-secondary",
            )}
          />
          <Text
            size="xs"
            tone={status.isRunning || status.isAwaitingApproval ? "primary" : "secondary"}
            truncate
            className="shrink-0"
          >
            {tc.tool_name}
          </Text>
          {status.contextText && (
            <Text
              size="xs"
              tone="tertiary"
              truncate
              className="flex-1 min-w-0"
              title={status.contextText}
            >
              {status.contextText}
            </Text>
          )}
          {tc.duration_ms != null && status.isDone && (
            <Text size="xs" tone="ghost" mono className="shrink-0">
              {tc.duration_ms}ms
            </Text>
          )}
          {status.isRunning && status.elapsedTime && (
            <Text size="xs" tone="ghost" mono className="shrink-0">
              {status.elapsedTime}
            </Text>
          )}
          <Icon
            name="chevron-right"
            className={cn(
              "text-vsc-text-ghost shrink-0 transition-transform duration-normal",
              expanded && "rotate-90",
            )}
            tokenSize="2xs"
          />
        </Button>

        {/* Inline action buttons */}
        <ToolActionButtons
          isAwaitingApproval={status.isAwaitingApproval}
          isRunning={status.isRunning}
          isError={status.isError}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      </div>

      {/* Inline diff preview — always visible when diff_text is present */}
      {!expanded && tc.diff_text && (
        <div
          className="ml-6 mr-6 mb-0.5 rounded-lg overflow-hidden border border-vsc-border/30 animate-[fade-in_var(--duration-normal)_var(--ease-default)]"
          role="region"
          aria-label="Diff preview"
        >
          <InlineDiffSummary text={tc.diff_text} />
        </div>
      )}

      {expanded && (
        <div
          id={contentId}
          role="region"
          className="ml-6 mr-6 mb-1 px-2 py-1.5 rounded-lg bg-vsc-code-bg text-2xs leading-relaxed animate-[fade-in_var(--duration-normal)_var(--ease-default)]"
        >
          {tc.args_summary && (
            <div className="mb-1">
              <Text size="2xs" tone="ghost" weight="medium">
                Args:{" "}
              </Text>
              <Text size="2xs" tone="secondary">
                {tc.args_summary}
              </Text>
            </div>
          )}
          {tc.reasoning && (
            <div className="mb-1">
              <Text size="2xs" tone="ghost" weight="medium">
                Reasoning:{" "}
              </Text>
              <Text size="2xs" tone="secondary">
                {tc.reasoning}
              </Text>
            </div>
          )}
          {tc.result_summary && (
            <div className="mb-1">
              <Text size="2xs" tone="ghost" weight="medium">
                Result:{" "}
              </Text>
              {looksLikeDiff(tc.result_summary) ? (
                <InlineDiffSummary text={tc.result_summary} />
              ) : (
                <Text size="2xs" tone="secondary">
                  {tc.result_summary}
                </Text>
              )}
            </div>
          )}
          {tc.diff_text && (
            <div className="mb-1 rounded-md overflow-hidden border border-vsc-border/30">
              <InlineDiffSummary text={tc.diff_text} />
            </div>
          )}
          {status.isError && !tc.result_summary && (
            <Text size="2xs" tone="error">
              Error — no result available
            </Text>
          )}
          {tc.output && (
            <div className="mt-1.5">
              {status.isTerminal ? (
                <TerminalOutputViewer output={tc.output} />
              ) : (
                <ToolOutputViewer output={tc.output} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
