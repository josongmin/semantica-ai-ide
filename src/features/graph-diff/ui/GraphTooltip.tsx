import { memo } from "react";

/**
 * GraphTooltip — displays detailed info for a hovered or selected graph node.
 */
import type { DiffGraphNode, DiffStatus } from "./GraphCanvas";

// ─── Types ─────────────────────────────────────────────────

interface GraphTooltipProps {
  readonly node: DiffGraphNode | null;
  readonly className?: string;
}

// ─── Helpers ───────────────────────────────────────────────

const STATUS_LABELS: Record<DiffStatus, string> = {
  added: "Added",
  removed: "Removed",
  modified: "Modified",
  unchanged: "Unchanged",
};

const STATUS_BADGE_COLORS: Record<DiffStatus, string> = {
  added: "bg-vsc-success/20 text-vsc-success",
  removed: "bg-vsc-error/20 text-vsc-error",
  modified: "bg-vsc-warning/20 text-vsc-warning",
  unchanged: "bg-zinc-500/20 text-zinc-400",
};

function formatKind(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

// ─── Component ─────────────────────────────────────────────

export const GraphTooltip = memo(function GraphTooltip({ node, className }: GraphTooltipProps) {
  if (!node) return null;

  const badgeClass = STATUS_BADGE_COLORS[node.diffStatus];

  return (
    <div
      className={`w-64 rounded-lg border border-vsc-border bg-vsc-surface-2 p-3 shadow-lg ${className ?? ""}`}
      role="tooltip"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="truncate text-sm font-medium text-vsc-fg">{node.name}</span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}>
          {STATUS_LABELS[node.diffStatus]}
        </span>
      </div>

      {/* Details */}
      <dl className="space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-vsc-text-tertiary">Kind</dt>
          <dd className="text-vsc-text-secondary">{formatKind(node.kind)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-vsc-text-tertiary">File</dt>
          <dd className="max-w-[160px] truncate text-vsc-text-secondary" title={node.filePath}>
            {node.filePath}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-vsc-text-tertiary">Line</dt>
          <dd className="text-vsc-text-secondary">{node.line}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-vsc-text-tertiary">Connections</dt>
          <dd className="text-vsc-text-secondary">{node.connections.length}</dd>
        </div>
        {node.metrics && (
          <>
            <div className="flex justify-between">
              <dt className="text-vsc-text-tertiary">Complexity</dt>
              <dd className="text-vsc-text-secondary">{node.metrics.complexity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-vsc-text-tertiary">Change freq</dt>
              <dd className="text-vsc-text-secondary">{node.metrics.changeFreq}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
});
