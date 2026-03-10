import React from "react";

import { Button, Icon, Text } from "../../shared/ui";

interface DiffViewerHeaderProps {
  readonly fileName: string;
  readonly filePath: string;
  readonly currentHunk: number;
  readonly totalHunks: number;
  readonly onPrevHunk: () => void;
  readonly onNextHunk: () => void;
  readonly onOpenInEditor?: () => void;
  readonly onAccept?: () => void;
  readonly onReject?: () => void;
}

/**
 * Header / toolbar bar for the DiffViewer.
 * Shows the file name, hunk navigation arrows, and accept/reject/open actions.
 */
export const DiffViewerHeader = React.memo(function DiffViewerHeader({
  fileName,
  filePath,
  currentHunk,
  totalHunks,
  onPrevHunk,
  onNextHunk,
  onOpenInEditor,
  onAccept,
  onReject,
}: DiffViewerHeaderProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-vsc-surface-1 text-xs border-b border-vsc-border">
      <Icon name="diff" tokenSize="sm" className="text-vsc-text-secondary" />
      <Text size="xs" weight="medium" truncate className="flex-1">
        {fileName}
      </Text>
      <Text size="xs" tone="ghost" truncate title={filePath}>
        {filePath}
      </Text>

      {/* Hunk navigation */}
      {totalHunks > 1 && (
        <div className="flex items-center gap-0.5 ml-1" data-testid="hunk-nav">
          <Button
            variant="ghost"
            size="sm"
            icon="arrow-up"
            onClick={onPrevHunk}
            disabled={currentHunk <= 0}
            aria-label="Previous hunk"
          />
          <Text size="2xs" tone="ghost" mono>
            {currentHunk + 1}/{totalHunks}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            icon="arrow-down"
            onClick={onNextHunk}
            disabled={currentHunk >= totalHunks - 1}
            aria-label="Next hunk"
          />
        </div>
      )}

      <div className="flex gap-0.5 ml-2">
        {onOpenInEditor && (
          <Button
            variant="ghost"
            size="sm"
            icon="go-to-file"
            onClick={onOpenInEditor}
            aria-label="Open in editor"
          />
        )}
        {onAccept && (
          <Button
            variant="ghost"
            size="sm"
            icon="check"
            onClick={onAccept}
            aria-label="Accept changes"
          />
        )}
        {onReject && (
          <Button
            variant="ghost"
            size="sm"
            icon="close"
            onClick={onReject}
            aria-label="Reject changes"
          />
        )}
      </div>
    </div>
  );
});
