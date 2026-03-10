import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";

import { checkpointsAtom } from "~entities/session/state";

import { useCheckpointComparison } from "../../features/checkpoint-comparison";
import { useCheckpointRestore } from "../../features/checkpoint-restore";
import type { RestoreMode } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";
import { RestoreModeDialog } from "../restore-mode";

/**
 * Horizontal checkpoint timeline showing turn-based restore points.
 * Compact design — only shows when checkpoints exist.
 * Supports left/right arrow keyboard navigation.
 * Confirmation required before restoring to prevent accidental data loss.
 * Opens a RestoreModeDialog to choose chat/code/both before restoring.
 */
export const CheckpointTimeline = React.memo(function CheckpointTimeline() {
  const checkpoints = useAtomValue(checkpointsAtom);
  const { restoreCheckpoint } = useCheckpointRestore();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [modeDialogId, setModeDialogId] = useState<string | null>(null);
  const { pair: comparisonPair, compare, clear: clearComparison } = useCheckpointComparison();
  const [compareFromId, setCompareFromId] = useState<string | null>(null);

  const handleRestore = useCallback((checkpointId: string) => {
    setConfirmId(checkpointId);
  }, []);

  const confirmRestore = useCallback(() => {
    if (!confirmId) return;
    // Open mode dialog instead of directly restoring
    setModeDialogId(confirmId);
    setConfirmId(null);
  }, [confirmId]);

  const cancelRestore = useCallback(() => {
    setConfirmId(null);
  }, []);

  const handleModeConfirm = useCallback(
    (mode: RestoreMode) => {
      if (!modeDialogId) return;
      restoreCheckpoint(modeDialogId, mode);
      setModeDialogId(null);
    },
    [modeDialogId, restoreCheckpoint],
  );

  const handleModeClose = useCallback(() => {
    setModeDialogId(null);
  }, []);

  // Find the label of the checkpoint being restored (for the dialog)
  const modeDialogLabel = useMemo(
    () => checkpoints.find((cp) => cp.id === modeDialogId)?.label ?? "Checkpoint",
    [checkpoints, modeDialogId],
  );

  // Auto-focus confirm button when confirmation UI appears
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmId) confirmBtnRef.current?.focus();
  }, [confirmId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const toolbar = e.currentTarget.closest('[role="toolbar"]');
      if (e.key === "ArrowRight" && idx < checkpoints.length - 1) {
        e.preventDefault();
        const next = toolbar?.querySelector(
          `[data-cp-index="${idx + 1}"]`,
        ) as HTMLButtonElement | null;
        next?.focus();
      }
      if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        const prev = toolbar?.querySelector(
          `[data-cp-index="${idx - 1}"]`,
        ) as HTMLButtonElement | null;
        prev?.focus();
      }
    },
    [checkpoints.length],
  );

  const handleCompareClick = useCallback(
    (cpId: string) => {
      if (!compareFromId) {
        // First click — mark as "from"
        setCompareFromId(cpId);
      } else if (compareFromId === cpId) {
        // Clicked same — cancel
        setCompareFromId(null);
      } else {
        // Second click — start comparison
        compare(compareFromId, cpId);
        setCompareFromId(null);
      }
    },
    [compareFromId, compare],
  );

  if (checkpoints.length === 0) return null;

  return (
    <>
      <div
        className="group/timeline flex items-center gap-1 px-3 py-1 border-b border-vsc-border overflow-x-auto flex-nowrap text-2xs"
        role="toolbar"
        aria-label="Checkpoint timeline"
      >
        <Icon name="history" tokenSize="xs" className="text-vsc-text-ghost shrink-0" />

        {checkpoints.map((cp, i) => (
          <React.Fragment key={cp.id}>
            {i > 0 && <div role="separator" className="w-4 h-px bg-vsc-border shrink-0" />}
            {confirmId === cp.id ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-vsc-warning/10 ring-1 ring-vsc-warning/30 whitespace-nowrap shrink-0 animate-[fade-in_var(--duration-fast)_var(--ease-default)]">
                <Text size="2xs" tone="warning" weight="medium">
                  Restore?
                </Text>
                <Button
                  ref={confirmBtnRef}
                  variant="ghost"
                  size="icon"
                  icon="check"
                  aria-label="Confirm restore"
                  onClick={confirmRestore}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  icon="close"
                  aria-label="Cancel restore"
                  onClick={cancelRestore}
                />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  data-cp-index={i}
                  onClick={() => handleRestore(cp.id)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  aria-label={`Restore to checkpoint: ${cp.label}`}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5",
                    "whitespace-nowrap overflow-hidden text-ellipsis",
                    compareFromId === cp.id && "ring-1 ring-vsc-focus bg-vsc-focus/10",
                  )}
                  title={`Restore: ${cp.label}\n${new Date(cp.timestamp_ms).toLocaleString()}`}
                >
                  <Icon name="bookmark" tokenSize="2xs" className="text-vsc-info" />
                  <Text size="2xs" tone="secondary">
                    {cp.label}
                  </Text>
                </Button>
                {checkpoints.length >= 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCompareClick(cp.id)}
                    aria-label={
                      compareFromId ? `Compare with ${cp.label}` : `Compare from ${cp.label}`
                    }
                    className="p-0.5 opacity-0 group-hover/timeline:opacity-100 focus:opacity-100"
                    title={
                      compareFromId ? "Select as comparison target" : "Start comparison from here"
                    }
                    icon="diff"
                  />
                )}
              </span>
            )}
          </React.Fragment>
        ))}

        {/* Comparison status indicators */}
        {compareFromId && !comparisonPair && (
          <span className="ml-auto flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded bg-vsc-focus/10 text-2xs animate-[fade-in_var(--duration-normal)_var(--ease-default)]">
            <Icon name="diff" tokenSize="2xs" className="text-vsc-focus" />
            <Text size="2xs" tone="info">
              Select target...
            </Text>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCompareFromId(null)}
              aria-label="Cancel comparison"
              className="p-0.5"
              icon="close"
            />
          </span>
        )}

        {comparisonPair && (
          <span
            className="ml-auto flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded bg-vsc-info/10 text-2xs animate-[fade-in_var(--duration-normal)_var(--ease-default)]"
            data-testid="comparison-banner"
          >
            <Icon name="diff" tokenSize="2xs" className="text-vsc-info" />
            <Text size="2xs" tone="info">
              {comparisonPair.from.label} → {comparisonPair.to.label}
            </Text>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearComparison}
              aria-label="Close comparison"
              className="p-0.5"
              icon="close"
            />
          </span>
        )}
      </div>

      {/* Restore mode selection dialog */}
      <RestoreModeDialog
        open={modeDialogId !== null}
        onClose={handleModeClose}
        onConfirm={handleModeConfirm}
        checkpointLabel={modeDialogLabel}
      />
    </>
  );
});
