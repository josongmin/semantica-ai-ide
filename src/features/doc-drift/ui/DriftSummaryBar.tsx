import React, { useMemo } from "react";

import { cn, Icon } from "~shared/ui";

import type { DocDriftSummary } from "../model/docDriftAtoms";

export interface DriftSummaryBarProps {
  summary: DocDriftSummary;
  scanning: boolean;
}

function formatTimeAgo(ts: number): string {
  if (ts === 0) return "never";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export const DriftSummaryBar = React.memo(function DriftSummaryBar({
  summary,
  scanning,
}: DriftSummaryBarProps) {
  const timeAgo = useMemo(() => formatTimeAgo(summary.lastScanTime), [summary.lastScanTime]);

  if (scanning) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-vsc-border/30 shrink-0">
        <Icon
          name="sync"
          tokenSize="2xs"
          className="text-vsc-info animate-spin shrink-0"
        />
        <span className="text-2xs text-vsc-info animate-pulse">Scanning documents...</span>
      </div>
    );
  }

  if (summary.totalDocs === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-vsc-border/30 shrink-0">
        <span className="text-2xs text-vsc-text-ghost">No docs scanned yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-vsc-border/30 shrink-0">
      <span className="text-2xs text-vsc-text-ghost">Last scan: {timeAgo}</span>

      <span className="text-vsc-text-ghost/30 text-2xs">|</span>

      <span className="text-2xs text-vsc-text-secondary tabular-nums">
        {summary.totalDocs} docs
      </span>

      {summary.driftedDocs > 0 && (
        <span className={cn("text-2xs tabular-nums text-vsc-warning")}>
          {summary.driftedDocs} drifted
        </span>
      )}

      {summary.newDocs > 0 && (
        <span className={cn("text-2xs tabular-nums text-vsc-info")}>
          {summary.newDocs} new
        </span>
      )}

      {summary.driftedDocs === 0 && summary.newDocs === 0 && (
        <span className="text-2xs text-vsc-success">all synced</span>
      )}
    </div>
  );
});
