import React, { useCallback, useState } from "react";

import { useAnimatedPresence } from "../../shared/lib/hooks/useAnimatedPresence";
import { Button, cn, Icon, Text } from "../../shared/ui";
import { useBatchApproval } from "./useBatchApproval";

/**
 * Floating banner above the prompt box showing pending approval count.
 * Delegates all approval logic to useBatchApproval (SRP).
 */
export const ApprovalBanner = React.memo(function ApprovalBanner() {
  const {
    pendingCount,
    dangerousCount,
    categorySummary,
    categorySummaryLabel,
    approveAll,
    denyAll,
    approveButtonLabel,
  } = useBatchApproval();

  // Prevent double-click on batch actions
  const [batchPending, setBatchPending] = useState(false);
  const handleApproveAll = useCallback(() => {
    if (batchPending) return;
    setBatchPending(true);
    approveAll();
  }, [batchPending, approveAll]);
  const handleDenyAll = useCallback(() => {
    if (batchPending) return;
    setBatchPending(true);
    denyAll();
  }, [batchPending, denyAll]);

  const isVisible = pendingCount > 0;
  const { mounted, exiting, onAnimationEnd } = useAnimatedPresence(isVisible, 150);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 border-t border-vsc-warning/30 bg-vsc-warning/5",
        exiting ? "animate-[slide-down-out_150ms_ease]" : "animate-[slide-up-in_150ms_ease]",
      )}
      onAnimationEnd={onAnimationEnd}
      role="alert"
      aria-live="polite"
      data-testid="approval-banner"
    >
      <Icon name="shield" tokenSize="sm" className="text-vsc-warning shrink-0" />
      <Text size="xs" weight="medium" className="shrink-0">
        {pendingCount} pending approval{pendingCount !== 1 ? "s" : ""}
      </Text>

      {/* Category breakdown */}
      <div
        className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto"
        aria-label={`Categories: ${categorySummaryLabel}`}
      >
        {categorySummary.map(({ category, count, icon }) => (
          <span
            key={category}
            className="flex items-center gap-1 text-2xs text-vsc-text-tertiary whitespace-nowrap overflow-hidden text-ellipsis"
          >
            <Icon name={icon} tokenSize="2xs" />
            {count}
          </span>
        ))}
        {dangerousCount > 0 && (
          <span className="flex items-center gap-1 text-2xs text-vsc-error whitespace-nowrap overflow-hidden text-ellipsis">
            <Icon name="error" tokenSize="2xs" />
            {dangerousCount} dangerous
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={handleDenyAll} disabled={batchPending}>
          {batchPending ? "Processing\u2026" : "Deny All"}
        </Button>
        <Button variant="primary" size="sm" onClick={handleApproveAll} disabled={batchPending}>
          {batchPending ? "Processing\u2026" : approveButtonLabel}
        </Button>
      </div>
    </div>
  );
});
