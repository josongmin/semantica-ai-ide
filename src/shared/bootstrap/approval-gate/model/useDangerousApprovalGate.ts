import { useCallback, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useToolApprovalMemory } from "~features/tool-approval-memory";
import { toolCallAtomFamily } from "~entities/tool-call";
import { dangerousApprovalToolCallIdAtom, pushToastAtom } from "~shared/lib";
import type { ToolCall } from "~shared/protocol";

import { useApprovalGate } from "./useApprovalGate";

interface UseDangerousApprovalGateResult {
  /** The tool call currently awaiting approval, or null if none */
  toolCall: ToolCall | null;
  /** Whether the approval dialog should be shown */
  shouldShowDialog: boolean;
  /** Approve the current tool call */
  handleApprove: () => void;
  /** Approve the current tool call in sandbox */
  handleApproveInSandbox: () => void;
  /** Deny the current tool call */
  handleDeny: () => void;
  /** Always allow this tool and approve the current call */
  handleAlwaysAllow: () => void;
}

/**
 * Encapsulates auto-approval logic and toast notifications for the
 * dangerous-approval flow.
 *
 * - If the tool is in the always-allowed list, it auto-approves and
 *   clears the pending approval atom (no dialog shown).
 * - Otherwise, it exposes approve/deny/alwaysAllow handlers that
 *   send the approval message, push a toast, and reset the atom.
 */
export function useDangerousApprovalGate(): UseDangerousApprovalGateResult {
  const [toolCallId, setToolCallId] = useAtom(dangerousApprovalToolCallIdAtom);
  const toolCall = useAtomValue(toolCallAtomFamily(toolCallId ?? ""));
  const pushToast = useSetAtom(pushToastAtom);
  const { isAllowed, allowAlways } = useToolApprovalMemory();
  const { grantApproval, grantApprovalInSandbox, denyApproval } = useApprovalGate();

  // Auto-approve if tool is in the always-allowed list
  useEffect(() => {
    if (!toolCallId || !toolCall?.approval_action_id) return;
    if (isAllowed(toolCall.tool_name)) {
      grantApproval(toolCall.approval_action_id);
      setToolCallId(null);
    }
  }, [toolCallId, toolCall, isAllowed, setToolCallId, grantApproval]);

  const handleApprove = useCallback(() => {
    if (!toolCall?.approval_action_id) return;
    grantApproval(toolCall.approval_action_id);
    pushToast({
      id: `approved-${toolCall.id}`,
      message: `Approved: ${toolCall.tool_name}`,
      variant: "success",
    });
    setToolCallId(null);
  }, [toolCall, setToolCallId, pushToast, grantApproval]);

  const handleApproveInSandbox = useCallback(() => {
    if (!toolCall?.approval_action_id) return;
    grantApprovalInSandbox(toolCall.approval_action_id);
    pushToast({
      id: `sandbox-${toolCall.id}`,
      message: `Sandbox: ${toolCall.tool_name}`,
      variant: "info",
    });
    setToolCallId(null);
  }, [toolCall, setToolCallId, pushToast, grantApprovalInSandbox]);

  const handleDeny = useCallback(() => {
    if (!toolCall?.approval_action_id) return;
    denyApproval(toolCall.approval_action_id);
    pushToast({
      id: `denied-${toolCall.id}`,
      message: `Denied: ${toolCall.tool_name}`,
      variant: "info",
    });
    setToolCallId(null);
  }, [toolCall, setToolCallId, pushToast, denyApproval]);

  const handleAlwaysAllow = useCallback(() => {
    if (!toolCall?.approval_action_id) return;
    allowAlways(toolCall.tool_name, toolCall.approval_action_id);
    pushToast({
      id: `always-allowed-${toolCall.id}`,
      message: `Always Allow: ${toolCall.tool_name}`,
      variant: "success",
    });
    setToolCallId(null);
  }, [toolCall, setToolCallId, pushToast, allowAlways]);

  const shouldShowDialog = Boolean(toolCallId && toolCall);

  return {
    toolCall: toolCall ?? null,
    shouldShowDialog,
    handleApprove,
    handleApproveInSandbox,
    handleDeny,
    handleAlwaysAllow,
  };
}
