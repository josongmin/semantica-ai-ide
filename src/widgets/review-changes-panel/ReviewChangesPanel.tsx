import React, { useCallback, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { reviewExpandedFileAtom, useReviewChanges } from "../../features/review-changes";
import { fileViewModeAtom, reviewChangesPanelVisibleAtom,toggleFeatureSheetAtom } from "../../shared/lib";
import type { FileChange } from "../../shared/protocol";
import { cn, ConfirmDialog } from "../../shared/ui";
import { FileChangeTreeView } from "../file-change-summary";
import { ReviewChangesPanelHeader } from "./ReviewChangesPanelHeader";
import { ReviewFileRow } from "./ReviewFileRow";

export const ReviewChangesPanel = React.memo(function ReviewChangesPanel() {
  const visible = useAtomValue(reviewChangesPanelVisibleAtom);
  const toggleSheet = useSetAtom(toggleFeatureSheetAtom);
  const {
    filteredFiles,
    summary,
    pendingFiles,
    acceptedCount,
    rejectedCount,
    acceptAllPending,
    rejectAllPending,
  } = useReviewChanges();
  const [viewMode, setViewMode] = useAtom(fileViewModeAtom);
  const expandedFile = useAtomValue(reviewExpandedFileAtom);
  const setExpandedFile = useSetAtom(reviewExpandedFileAtom);
  const [pendingBatchAction, setPendingBatchAction] = useState<"accept" | "reject" | null>(null);

  const toggleViewMode = useCallback(() => {
    setViewMode((v) => (v === "list" ? "tree" : "list"));
  }, [setViewMode]);

  const handleClose = useCallback(() => {
    toggleSheet(null);
  }, [toggleSheet]);

  // Escape to close when panel is focused
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        e.stopPropagation();
        handleClose();
      }
    },
    [visible, handleClose],
  );

  // Stable toggle callback — avoids inline arrow per row
  const onToggleExpand = useCallback(
    (filePath: string) => {
      setExpandedFile((prev: string | null) => (prev === filePath ? null : filePath));
    },
    [setExpandedFile],
  );

  const handleAcceptAll = useCallback(() => {
    setPendingBatchAction("accept");
  }, []);

  const handleRejectAll = useCallback(() => {
    setPendingBatchAction("reject");
  }, []);

  const handleCancelBatch = useCallback(() => {
    setPendingBatchAction(null);
  }, []);

  // Batch confirm handler
  const handleBatchConfirm = useCallback(() => {
    if (pendingBatchAction === "accept") {
      acceptAllPending();
    } else if (pendingBatchAction === "reject") {
      rejectAllPending();
    }
    setPendingBatchAction(null);
  }, [pendingBatchAction, acceptAllPending, rejectAllPending]);

  const totalLinesChanged = summary.total_insertions + summary.total_deletions;

  // Don't render at all when no changes exist and panel is hidden
  if (filteredFiles.length === 0 && !visible) return null;

  return (
    <div
      className={cn(
        "border-t border-vsc-border bg-vsc-surface-1 overflow-hidden",
        "transition-[max-height,opacity] duration-normal ease-in-out",
        visible ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0 border-t-transparent",
      )}
      role="region"
      aria-label="Review changes"
      aria-hidden={!visible}
      onKeyDown={handleKeyDown}
    >
      <ReviewChangesPanelHeader
        summary={summary}
        pendingCount={pendingFiles.length}
        acceptedCount={acceptedCount}
        rejectedCount={rejectedCount}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        onAcceptAll={handleAcceptAll}
        onRejectAll={handleRejectAll}
        onClose={handleClose}
      />

      <div className="overflow-y-auto max-h-[calc(60vh-72px)] px-1 py-0.5 scroll-shadow" data-scroll-contain>
        {filteredFiles.length === 0 && (
          <div className="py-6 text-center text-xs text-vsc-text-ghost">No matching files</div>
        )}
        {filteredFiles.length > 0 && viewMode === "tree" && (
          <FileChangeTreeView files={filteredFiles} />
        )}
        {filteredFiles.length > 0 && viewMode !== "tree" && (
          filteredFiles.map((fc: FileChange) => (
            <ReviewFileRow
              key={fc.file_path}
              fileChange={fc}
              expanded={expandedFile === fc.file_path}
              onToggleExpand={onToggleExpand}
            />
          ))
        )}
      </div>

      {/* Batch approval confirmation */}
      <ConfirmDialog
        open={pendingBatchAction !== null}
        onConfirm={handleBatchConfirm}
        onCancel={handleCancelBatch}
        title={pendingBatchAction === "accept" ? "Accept all changes?" : "Reject all changes?"}
        description={`This will ${pendingBatchAction === "accept" ? "accept" : "reject"} ${pendingFiles.length} file(s) with ${totalLinesChanged} line change(s).`}
        confirmLabel={pendingBatchAction === "accept" ? "Accept All" : "Reject All"}
        confirmVariant={pendingBatchAction === "reject" ? "danger" : undefined}
      />
    </div>
  );
});
