import React, { useCallback, useState } from "react";

import { Button } from "../../shared/ui";

interface ToolActionButtonsProps {
  isAwaitingApproval: boolean;
  isRunning: boolean;
  isError: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

export const ToolActionButtons = React.memo(function ToolActionButtons({
  isAwaitingApproval,
  isRunning,
  isError,
  onApprove,
  onDeny,
  onCancel,
  onRetry,
}: ToolActionButtonsProps) {
  const [pending, setPending] = useState<"approve" | "deny" | null>(null);

  const handleApprove = useCallback(() => {
    if (pending !== null) return;
    setPending("approve");
    onApprove();
  }, [pending, onApprove]);

  const handleDeny = useCallback(() => {
    if (pending !== null) return;
    setPending("deny");
    onDeny();
  }, [pending, onDeny]);

  // Reset pending when approval state changes (buttons disappear anyway)
  const showApproval = isAwaitingApproval && pending === null;
  const showPending = isAwaitingApproval && pending !== null;

  return (
    <>
      {(showApproval || showPending) && (
        <div className="flex gap-0.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleApprove}
            disabled={pending !== null}
            aria-label="Approve tool"
          >
            {pending === "approve" ? "Approving\u2026" : "Approve"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeny}
            disabled={pending !== null}
            aria-label="Deny tool"
          >
            {pending === "deny" ? "Denying\u2026" : "Deny"}
          </Button>
        </div>
      )}
      {isRunning && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          aria-label="Cancel tool"
          className="shrink-0"
        >
          Cancel
        </Button>
      )}
      {isError && (
        <Button
          variant="ghost"
          size="sm"
          icon="refresh"
          onClick={onRetry}
          aria-label="Retry tool"
          className="shrink-0"
        >
          Retry
        </Button>
      )}
    </>
  );
});
