import React, { useCallback, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";

import { fileChangeSummaryByTurnAtom } from "~entities/diff";

import { fileViewModeAtom } from "../../shared/lib";
import { diffReviewAdapterAtom } from "../../shared/lib/atoms";
import type { TurnId } from "../../shared/protocol";
import { BarChart, Button, Collapsible, ConfirmDialog } from "../../shared/ui";
import { FileChangeRow } from "./FileChangeRow";
import { FileChangeTreeView } from "./FileChangeTreeView";

interface FileChangeSummaryWidgetProps {
  turnId: TurnId;
}

export const FileChangeSummaryWidget = React.memo(function FileChangeSummaryWidget({
  turnId,
}: FileChangeSummaryWidgetProps) {
  const summary = useAtomValue(fileChangeSummaryByTurnAtom(turnId));
  const diffReview = useAtomValue(diffReviewAdapterAtom);
  const [viewMode, setViewMode] = useAtom(fileViewModeAtom);
  const [pendingBatchAction, setPendingBatchAction] = useState<"accept" | "reject" | null>(null);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "list" ? "tree" : "list"));
  }, [setViewMode]);

  const pendingFiles = useMemo(
    () => summary.files.filter((f) => f.approval_status === "pending"),
    [summary.files],
  );

  const handleBatchConfirm = useCallback(() => {
    if (!pendingBatchAction) return;
    const paths = pendingFiles.map((f) => f.file_path);
    if (pendingBatchAction === "accept") {
      diffReview?.approveAll(turnId, paths);
    } else {
      diffReview?.rejectAll(turnId, paths);
    }
    setPendingBatchAction(null);
  }, [pendingBatchAction, pendingFiles, diffReview, turnId]);

  if (summary.files.length === 0) return null;

  const totalFiles = summary.files.length;
  const totalLinesChanged = summary.total_insertions + summary.total_deletions;

  const statusParts: string[] = [];
  if (summary.added > 0) statusParts.push(`${summary.added} added`);
  if (summary.modified > 0) statusParts.push(`${summary.modified} modified`);
  if (summary.deleted > 0) statusParts.push(`${summary.deleted} deleted`);
  if (summary.renamed > 0) statusParts.push(`${summary.renamed} renamed`);

  return (
    <Collapsible
      title="File Changes"
      icon="files"
      badge={totalFiles}
      summary={statusParts.join(", ")}
      defaultCollapsed={false}
      headerRight={
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={viewMode === "list" ? "list-tree" : "list-flat"}
            aria-label={viewMode === "list" ? "Switch to tree view" : "Switch to list view"}
            onClick={(e) => {
              e.stopPropagation();
              toggleViewMode();
            }}
          />
          {pendingFiles.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon="check-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingBatchAction("accept");
                }}
              >
                Accept All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon="close-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingBatchAction("reject");
                }}
              >
                Reject All
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-0.5">
        {/* Bar chart */}
        <BarChart
          insertions={summary.total_insertions}
          deletions={summary.total_deletions}
          className="mb-1.5"
        />

        {/* File list / tree */}
        {viewMode === "tree" ? (
          <FileChangeTreeView files={summary.files} />
        ) : (
          summary.files.map((fc) => <FileChangeRow key={fc.file_path} fileChange={fc} />)
        )}
      </div>

      {/* Batch approval confirmation */}
      <ConfirmDialog
        open={pendingBatchAction !== null}
        onConfirm={handleBatchConfirm}
        onCancel={() => setPendingBatchAction(null)}
        title={pendingBatchAction === "accept" ? "Accept all changes?" : "Reject all changes?"}
        description={`This will ${pendingBatchAction === "accept" ? "accept" : "reject"} ${pendingFiles.length} file(s) with ${totalLinesChanged} line change(s).`}
        confirmLabel={pendingBatchAction === "accept" ? "Accept All" : "Reject All"}
        confirmVariant={pendingBatchAction === "reject" ? "danger" : undefined}
      />
    </Collapsible>
  );
});
