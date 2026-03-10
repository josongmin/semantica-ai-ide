import React, { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";

import { extractDirPath, extractFileName } from "../../shared/lib";
import { diffReviewAdapterAtom } from "../../shared/lib/atoms";
import type { FileChange } from "../../shared/protocol";
import { ActionBar, FILE_CHANGE_STATUS_COLOR, FILE_CHANGE_STATUS_ICON, Icon, Text } from "../../shared/ui";
import { ConflictBadge } from "../patch-simulation";

interface FileChangeRowProps {
  fileChange: FileChange;
}

export const FileChangeRow = React.memo(function FileChangeRow({ fileChange }: FileChangeRowProps) {
  const diffReview = useAtomValue(diffReviewAdapterAtom);

  const fileName = useMemo(() => extractFileName(fileChange.file_path), [fileChange.file_path]);
  const dirPath = useMemo(() => extractDirPath(fileChange.file_path), [fileChange.file_path]);

  const handleOpen = useCallback(() => {
    diffReview?.openInEditor(fileChange.file_path);
  }, [diffReview, fileChange.file_path]);

  const handleApprove = useCallback(() => {
    diffReview?.approve(fileChange.turn_id, fileChange.file_path);
  }, [diffReview, fileChange.turn_id, fileChange.file_path]);

  const handleReject = useCallback(() => {
    diffReview?.reject(fileChange.turn_id, fileChange.file_path);
  }, [diffReview, fileChange.turn_id, fileChange.file_path]);

  return (
    <div className="flex items-center gap-1.5 py-1 px-1 rounded-md text-xs hover:bg-vsc-list-hover transition-colors duration-fast group">
      <Icon
        name={FILE_CHANGE_STATUS_ICON[fileChange.status]}
        tokenSize="sm"
        className={FILE_CHANGE_STATUS_COLOR[fileChange.status]}
      />

      <button
        type="button"
        onClick={handleOpen}
        title={fileChange.file_path}
        aria-label={`Open ${fileChange.file_path}`}
        className="flex flex-col flex-1 min-w-0 text-left hover:underline cursor-pointer bg-transparent border-none p-0 text-vsc-fg focus-ring"
      >
        <span className="flex items-center gap-1 min-w-0">
          <Text size="xs" weight="medium" truncate className="min-w-0">
            {fileName}
          </Text>
          {dirPath && (
            <Text size="xs" tone="ghost" truncate className="min-w-0">
              {dirPath}
            </Text>
          )}
        </span>
        {fileChange.intent && (
          <Text size="2xs" tone="ghost" truncate className="mt-0.5">
            {fileChange.intent}
          </Text>
        )}
      </button>

      {fileChange.conflict_risk && <ConflictBadge risk={fileChange.conflict_risk} />}

      <Text size="xs" tone="success" mono>
        +{fileChange.insertions}
      </Text>
      <Text size="xs" tone="error" mono>
        -{fileChange.deletions}
      </Text>

      {fileChange.approval_status === "pending" && (
        <ActionBar
          actions={[
            { icon: "check", label: `Accept changes to ${fileName}`, onClick: handleApprove },
            { icon: "close", label: `Reject changes to ${fileName}`, onClick: handleReject },
          ]}
        />
      )}

      {fileChange.approval_status === "accepted" && (
        <Icon name="check" tokenSize="xs" className="text-vsc-success" title="Accepted" />
      )}
      {fileChange.approval_status === "rejected" && (
        <Icon name="close" tokenSize="xs" className="text-vsc-error" title="Rejected" />
      )}
    </div>
  );
});
