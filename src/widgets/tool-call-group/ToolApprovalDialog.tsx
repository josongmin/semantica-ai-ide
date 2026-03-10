import React from "react";

import type { ToolCall } from "../../shared/protocol";
import { Button, Dialog, Icon, Text } from "../../shared/ui";

interface ToolApprovalDialogProps {
  toolCall: ToolCall | null;
  onApprove: () => void;
  onDeny: () => void;
  onAlwaysAllow?: () => void;
}

/**
 * Confirmation dialog for dangerous tool operations.
 * Only shown when risk_level === "dangerous".
 * Inline approve/deny handles safe/moderate levels in ToolCallRow.
 */
export const ToolApprovalDialog = React.memo(function ToolApprovalDialog({
  toolCall,
  onApprove,
  onDeny,
  onAlwaysAllow,
}: ToolApprovalDialogProps) {
  if (!toolCall) return null;

  return (
    <Dialog
      open
      onClose={onDeny}
      title="Dangerous Operation"
      description={`${toolCall.tool_name} requires explicit approval.`}
    >
      {/* Warning banner */}
      <div className="flex items-start gap-2 p-2.5 rounded-md bg-vsc-error/10 border border-vsc-error/20 mb-3">
        <Icon name="warning" tokenSize="sm" className="text-vsc-error shrink-0 mt-0.5" />
        <div>
          <Text size="sm" weight="medium" tone="error">
            This action may be destructive
          </Text>
          <Text size="xs" tone="secondary" className="mt-0.5 block">
            {toolCall.args_summary}
          </Text>
        </div>
      </div>

      {/* Reasoning */}
      {toolCall.reasoning && (
        <div className="mb-3 px-2 py-1.5 rounded bg-vsc-code-bg text-xs text-vsc-text-secondary">
          {toolCall.reasoning}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDeny}>
          Deny
        </Button>
        {onAlwaysAllow && (
          <Button variant="secondary" size="sm" onClick={onAlwaysAllow}>
            Always Allow
          </Button>
        )}
        <Button variant="danger" size="sm" onClick={onApprove}>
          Approve Anyway
        </Button>
      </div>
    </Dialog>
  );
});
