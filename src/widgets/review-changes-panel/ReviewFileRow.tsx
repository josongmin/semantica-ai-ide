import React, { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";

import { extractDirPath, extractFileName } from "../../shared/lib";
import { diffReviewAdapterAtom } from "../../shared/lib/atoms";
import type { FileChange } from "../../shared/protocol";
import {
  Button,
  cn,
  FILE_CHANGE_STATUS_COLOR,
  FILE_CHANGE_STATUS_ICON,
  Icon,
  LazyPanel,
  Text,
} from "../../shared/ui";
import { FilePermalinkBadge } from "../file-permalink";
import { ConflictBadge } from "../patch-simulation";

const LazyDiffViewer = React.lazy(() =>
  import("../diff-viewer").then((m) => ({ default: m.DiffViewer })),
);

interface ReviewFileRowProps {
  fileChange: FileChange;
  expanded: boolean;
  onToggleExpand: (filePath: string) => void;
}

export const ReviewFileRow = React.memo(function ReviewFileRow({
  fileChange,
  expanded,
  onToggleExpand,
}: ReviewFileRowProps) {
  const diffReview = useAtomValue(diffReviewAdapterAtom);

  const fileName = useMemo(() => extractFileName(fileChange.file_path), [fileChange.file_path]);
  const dirPath = useMemo(() => extractDirPath(fileChange.file_path), [fileChange.file_path]);

  const handleApprove = useCallback(() => {
    diffReview?.approve(fileChange.turn_id, fileChange.file_path);
  }, [diffReview, fileChange.turn_id, fileChange.file_path]);

  const handleReject = useCallback(() => {
    diffReview?.reject(fileChange.turn_id, fileChange.file_path);
  }, [diffReview, fileChange.turn_id, fileChange.file_path]);

  const handleOpenInEditor = useCallback(
    (line?: number) => {
      diffReview?.openInEditor(fileChange.file_path, line);
    },
    [diffReview, fileChange.file_path],
  );

  const handleToggle = useCallback(() => {
    onToggleExpand(fileChange.file_path);
  }, [onToggleExpand, fileChange.file_path]);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-1 px-1 rounded-md text-xs hover:bg-vsc-list-hover transition-colors duration-fast group cursor-pointer focus-ring",
          expanded && "bg-vsc-list-hover/50",
        )}
        onClick={handleToggle}
        role="button"
        aria-expanded={expanded}
        aria-label={`Toggle ${fileName} changes`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <Icon
          name={expanded ? "chevron-down" : "chevron-right"}
          tokenSize="xs"
          className="text-vsc-text-ghost shrink-0"
        />
        <Icon
          name={FILE_CHANGE_STATUS_ICON[fileChange.status]}
          tokenSize="sm"
          className={FILE_CHANGE_STATUS_COLOR[fileChange.status]}
        />
        <span className="flex flex-col flex-1 min-w-0">
          <span className="flex items-center gap-1 min-w-0">
            <Text size="xs" weight="medium" truncate title={fileName}>
              {fileName}
            </Text>
            {dirPath && (
              <Text size="xs" tone="ghost" truncate title={dirPath}>
                {dirPath}
              </Text>
            )}
          </span>
          {fileChange.intent && (
            <Text size="2xs" tone="ghost" truncate className="mt-0.5">
              {fileChange.intent}
            </Text>
          )}
        </span>

        <FilePermalinkBadge filePath={fileChange.file_path} />
        {fileChange.conflict_risk && <ConflictBadge risk={fileChange.conflict_risk} />}

        <Text size="xs" tone="success" mono>
          +{fileChange.insertions}
        </Text>
        <Text size="xs" tone="error" mono>
          -{fileChange.deletions}
        </Text>

        {fileChange.approval_status === "pending" && (
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-fast"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              icon="check"
              aria-label={`Accept changes to ${fileName}`}
              onClick={handleApprove}
            />
            <Button
              variant="ghost"
              size="icon"
              icon="close"
              aria-label={`Reject changes to ${fileName}`}
              onClick={handleReject}
            />
          </div>
        )}

        {fileChange.approval_status === "accepted" && (
          <Icon name="check" tokenSize="xs" className="text-vsc-success" title="Accepted" />
        )}
        {fileChange.approval_status === "rejected" && (
          <Icon name="close" tokenSize="xs" className="text-vsc-error" title="Rejected" />
        )}
      </div>

      {expanded && fileChange.diff_text && (
        <div className="ml-5 mr-1 mb-2 mt-1">
          <LazyPanel minHeight="100px">
            <LazyDiffViewer
              filePath={fileChange.file_path}
              diffText={fileChange.diff_text}
              onAccept={fileChange.approval_status === "pending" ? handleApprove : undefined}
              onReject={fileChange.approval_status === "pending" ? handleReject : undefined}
              onOpenInEditor={handleOpenInEditor}
            />
          </LazyPanel>
        </div>
      )}

      {expanded && !fileChange.diff_text && (
        <div className="ml-5 mr-1 mb-2 mt-1 p-3 border border-vsc-border rounded-md text-center">
          <Text size="xs" tone="tertiary">
            No diff available for this file
          </Text>
        </div>
      )}
    </div>
  );
});
