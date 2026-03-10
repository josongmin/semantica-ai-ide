import React from "react";

import { ToolApprovalDialog } from "./ToolApprovalDialog";
import { useDangerousApprovalGate } from "./useDangerousApprovalGate";

/**
 * Reads dangerousApprovalToolCallIdAtom, looks up the ToolCall,
 * and renders ToolApprovalDialog. Approve/deny resets the atom + sends postMessage.
 *
 * All business logic (auto-approval, toast notifications) is delegated to
 * useDangerousApprovalGate — this component only handles UI rendering.
 */
export const DangerousApprovalGate = React.memo(function DangerousApprovalGate() {
  const { toolCall, shouldShowDialog, handleApprove, handleDeny, handleAlwaysAllow } =
    useDangerousApprovalGate();

  if (!shouldShowDialog) return null;

  return (
    <ToolApprovalDialog
      toolCall={toolCall}
      onApprove={handleApprove}
      onDeny={handleDeny}
      onAlwaysAllow={handleAlwaysAllow}
    />
  );
});
