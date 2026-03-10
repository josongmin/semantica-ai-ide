import React from "react";

import { cn } from "~shared/ui";

import type { DriftStatus } from "../model/docDriftAtoms";

export interface DocStatusBadgeProps {
  status: DriftStatus;
  driftCount?: number;
}

export const DocStatusBadge = React.memo(function DocStatusBadge({
  status,
  driftCount,
}: DocStatusBadgeProps) {
  if (status === "synced") {
    return (
      <span
        className="inline-flex items-center shrink-0"
        title="Synced"
        aria-label="Document synced"
      >
        <span className="size-2 rounded-full bg-vsc-success/70" />
      </span>
    );
  }

  if (status === "drifted") {
    return (
      <span
        className="inline-flex items-center gap-0.5 shrink-0"
        title={`${driftCount ?? 0} drift${(driftCount ?? 0) !== 1 ? "s" : ""} detected`}
        aria-label={`${driftCount ?? 0} drifts detected`}
      >
        <span className="text-vsc-warning text-2xs leading-none">!</span>
        {driftCount !== undefined && driftCount > 0 && (
          <span className="text-2xs leading-none tabular-nums text-vsc-warning font-medium">
            {driftCount}
          </span>
        )}
      </span>
    );
  }

  if (status === "new") {
    return (
      <span
        className="inline-flex items-center shrink-0"
        title="New document"
        aria-label="New document"
      >
        <span className={cn("size-2 rounded-full bg-vsc-info/70")} />
      </span>
    );
  }

  // unlinked
  return (
    <span
      className="inline-flex items-center shrink-0"
      title="Unlinked"
      aria-label="Unlinked document"
    >
      <span className="size-2 rounded-full border border-vsc-text-ghost/40" />
    </span>
  );
});
