import React, { useCallback } from "react";
import { useAtom } from "jotai";

import { reviewSearchQueryAtom } from "../../features/review-changes";
import type { FileViewMode } from "../../shared/lib";
import type { FileChangeSummary } from "../../shared/protocol";
import { Badge, BarChart, Button, Icon, Input, Text } from "../../shared/ui";

interface ReviewChangesPanelHeaderProps {
  summary: FileChangeSummary;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  viewMode: FileViewMode;
  onToggleViewMode: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
}

export const ReviewChangesPanelHeader = React.memo(function ReviewChangesPanelHeader({
  summary,
  pendingCount,
  acceptedCount,
  rejectedCount,
  viewMode,
  onToggleViewMode,
  onAcceptAll,
  onRejectAll,
  onClose,
}: ReviewChangesPanelHeaderProps) {
  const [searchQuery, setSearchQuery] = useAtom(reviewSearchQueryAtom);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, [setSearchQuery]);

  const totalFiles = summary.files.length;

  return (
    <div className="px-3 py-1.5 border-b border-vsc-border sticky top-0 bg-vsc-surface-1 z-[--z-sticky] space-y-1.5">
      {/* Top row: title + controls */}
      <div className="flex items-center gap-2">
        <Icon name="git-pull-request" tokenSize="sm" className="text-vsc-info shrink-0" />
        <Text size="xs" weight="medium">
          Review Changes
        </Text>

        <Badge text={`${totalFiles} files`} />
        {summary.added > 0 && <Badge text={`${summary.added} added`} variant="success" />}
        {summary.modified > 0 && <Badge text={`${summary.modified} modified`} variant="warning" />}
        {summary.deleted > 0 && <Badge text={`${summary.deleted} deleted`} variant="error" />}
        {summary.renamed > 0 && <Badge text={`${summary.renamed} renamed`} variant="info" />}

        <div className="flex-1" />

        {/* Search with clear button */}
        <div className="relative">
          <Input
            type="text"
            size="sm"
            placeholder="Filter files..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-36 pl-2 pr-6 py-0.5 rounded-sm"
            aria-label="Filter files by name"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-vsc-text-ghost hover:text-vsc-fg
                         transition-colors duration-fast cursor-pointer bg-transparent border-none p-0 focus-ring"
              aria-label="Clear search"
            >
              <Icon name="close" tokenSize="xs" />
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <Button
          variant="ghost"
          size="sm"
          icon={viewMode === "list" ? "list-tree" : "list-flat"}
          onClick={onToggleViewMode}
          aria-label={viewMode === "list" ? "Switch to tree view" : "Switch to list view"}
          title={viewMode === "list" ? "Tree view" : "List view"}
        />

        {/* Batch actions */}
        {pendingCount > 0 && (
          <>
            <Button variant="ghost" size="sm" icon="check-all" onClick={onAcceptAll}>
              Accept All
            </Button>
            <Button variant="ghost" size="sm" icon="close-all" onClick={onRejectAll}>
              Reject All
            </Button>
          </>
        )}

        {/* Close */}
        <Button
          variant="ghost"
          size="sm"
          icon="close"
          onClick={onClose}
          aria-label="Close review panel (Cmd+Shift+R)"
        />
      </div>

      {/* Bottom row: bar chart + approval progress */}
      <div className="flex items-center gap-3">
        <BarChart
          insertions={summary.total_insertions}
          deletions={summary.total_deletions}
          maxWidth={100}
        />

        {totalFiles > 0 && (
          <div className="flex items-center gap-1.5 text-2xs">
            {acceptedCount > 0 && (
              <span className="flex items-center gap-1 text-vsc-success">
                <Icon name="check" tokenSize="2xs" />
                {acceptedCount}
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="flex items-center gap-1 text-vsc-error">
                <Icon name="close" tokenSize="2xs" />
                {rejectedCount}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-vsc-text-ghost">
                <Icon name="circle-outline" tokenSize="2xs" />
                {pendingCount} pending
              </span>
            )}

            {/* Mini progress bar */}
            <div className="flex h-1 w-16 rounded-full overflow-hidden bg-vsc-surface-2 ml-1">
              {acceptedCount > 0 && (
                <div
                  className="bg-vsc-success"
                  style={{ width: `${(acceptedCount / totalFiles) * 100}%` }}
                />
              )}
              {rejectedCount > 0 && (
                <div
                  className="bg-vsc-error"
                  style={{ width: `${(rejectedCount / totalFiles) * 100}%` }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
