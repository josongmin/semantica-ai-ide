import React, { useMemo } from "react";

import { useSemanticSearch } from "../../features/semantic-search";
import type { IndexStatus } from "../../shared/protocol";
import { cn, Spinner, Text } from "../../shared/ui";

function formatStatusLabel(status: IndexStatus, progress: number, fileCount: number): string {
  switch (status) {
    case "idle":
      return "Idle";
    case "indexing":
      return `Indexing… ${progress}%`;
    case "ready":
      return `Ready (${fileCount.toLocaleString()} files)`;
    case "error":
      return "Error";
  }
}

/**
 * SOTA UX: Ready 시 그린 pill, Indexing 시 진행률, Error 시 에러 스타일.
 */
export const IndexStatusBadge = React.memo(function IndexStatusBadge() {
  const { indexStatus, indexProgress, indexFileCount } = useSemanticSearch();

  const label = useMemo(
    () => formatStatusLabel(indexStatus, indexProgress, indexFileCount),
    [indexStatus, indexProgress, indexFileCount],
  );

  const statusStyles = useMemo(() => {
    switch (indexStatus) {
      case "ready":
        return "bg-vsc-success/15 text-vsc-success border-vsc-success/30";
      case "indexing":
        return "bg-vsc-info/15 text-vsc-info border-vsc-info/30";
      case "error":
        return "bg-vsc-error/15 text-vsc-error border-vsc-error/30";
      case "idle":
        return "bg-vsc-surface-2 text-vsc-text-secondary border-vsc-border";
    }
  }, [indexStatus]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-medium",
        "border",
        statusStyles,
      )}
      data-testid="index-status-badge"
      aria-label={`Index status: ${label}`}
    >
      {indexStatus === "indexing" && (
        <Spinner size="sm" className="shrink-0" />
      )}
      {indexStatus === "ready" && (
        <span className="size-1.5 rounded-full bg-vsc-success shrink-0" aria-hidden />
      )}
      <Text size="2xs" as="span" weight="medium">
        {label}
      </Text>
    </span>
  );
});
