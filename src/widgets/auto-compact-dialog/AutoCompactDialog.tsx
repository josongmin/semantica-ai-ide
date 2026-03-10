import React, { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { compactionEventsAtom } from "../../entities/compaction-history";
import {
  compactUsagePctAtom,
  pendingCompactAtom,
} from "../../features/auto-compact";
import { pushToastAtom } from "../../shared/lib/atoms/toastAtoms";
import { formatTokens } from "../../shared/lib/formatters";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import { ConfirmDialog, ProgressBar, Text } from "../../shared/ui";

export const AutoCompactDialog = React.memo(function AutoCompactDialog() {
  const pending = useAtomValue(pendingCompactAtom);
  const usagePct = useAtomValue(compactUsagePctAtom);
  const setPending = useSetAtom(pendingCompactAtom);
  const pushToast = useSetAtom(pushToastAtom);
  const compactionEvents = useAtomValue(compactionEventsAtom);

  const preview = useMemo(() => {
    if (compactionEvents.length === 0) return null;
    const last = compactionEvents[compactionEvents.length - 1];
    if (last === undefined) return null;
    const savedPct = Math.round(
      ((last.tokens_before - last.tokens_after) / last.tokens_before) * 100,
    );
    return { savedPct, before: last.tokens_before, after: last.tokens_after };
  }, [compactionEvents]);

  const handleConfirm = useCallback(() => {
    getVscodeApi().postMessage({ type: "COMPACT_CONTEXT" });
    setPending(false);
    pushToast({
      id: `compact-confirmed-${Date.now()}`,
      variant: "success",
      message: "Compacting context...",
    });
  }, [setPending, pushToast]);

  const handleCancel = useCallback(() => {
    setPending(false);
  }, [setPending]);

  return (
    <ConfirmDialog
      open={pending}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title="Compact Context"
      description={`Context usage is at ${usagePct}%. Compact now to free up space?`}
      confirmLabel="Compact"
      cancelLabel="Later"
    >
      <div className="flex flex-col gap-2" data-testid="auto-compact-dialog">
        <ProgressBar value={usagePct} max={100} label={`${usagePct}% used`} />
        {preview ? (
          <div className="rounded-md bg-vsc-surface-2 border border-vsc-border px-3 py-2 space-y-1">
            <Text size="xs" weight="medium" tone="secondary">
              Estimated savings (based on last compaction)
            </Text>
            <div className="flex items-center gap-3">
              <Text size="xs" tone="tertiary">
                {formatTokens(preview.before)} → {formatTokens(preview.after)} tokens
              </Text>
              <Text size="xs" tone="success" weight="medium">
                ~{preview.savedPct}% reduction
              </Text>
            </div>
          </div>
        ) : (
          <Text size="xs" tone="tertiary">
            Compaction summarizes earlier messages to free context window space.
          </Text>
        )}
      </div>
    </ConfirmDialog>
  );
});
