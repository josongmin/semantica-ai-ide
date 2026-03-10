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

export const GraphTooltip = memo(function GraphTooltip({
  node,
  className,
}: GraphTooltipProps) {
  if (!node) return null;

  const badgeClass = STATUS_BADGE_COLORS[node.diffStatus];

  return (
    <div
      className={`w-64 rounded-lg border border-[var(--color-zinc-700,#3f3f46)] bg-[var(--color-zinc-800,#27272a)] p-3 shadow-lg ${className ?? ""}`}
      role="tooltip"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="truncate text-sm font-medium text-[var(--color-zinc-100,#f4f4f5)]">
          {node.name}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}>
          {STATUS_LABELS[node.diffStatus]}
        </span>
      </div>

      {/* Details */}
      <dl className="space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-[var(--color-zinc-400,#a1a1aa)]">Kind</dt>
          <dd className="text-[var(--color-zinc-200,#e4e4e7)]">{formatKind(node.kind)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-zinc-400,#a1a1aa)]">File</dt>
          <dd className="max-w-[160px] truncate text-[var(--color-zinc-200,#e4e4e7)]" title={node.filePath}>
            {node.filePath}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-zinc-400,#a1a1aa)]">Line</dt>
          <dd className="text-[var(--color-zinc-200,#e4e4e7)]">{node.line}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-zinc-400,#a1a1aa)]">Connections</dt>
          <dd className="text-[var(--color-zinc-200,#e4e4e7)]">{node.connections.length}</dd>
        </div>
        {node.metrics && (
          <>
            <div className="flex justify-between">
              <dt className="text-[var(--color-zinc-400,#a1a1aa)]">Complexity</dt>
              <dd className="text-[var(--color-zinc-200,#e4e4e7)]">{node.metrics.complexity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-zinc-400,#a1a1aa)]">Change freq</dt>
              <dd className="text-[var(--color-zinc-200,#e4e4e7)]">{node.metrics.changeFreq}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
});
