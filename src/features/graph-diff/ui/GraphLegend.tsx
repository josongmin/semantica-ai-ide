import { memo } from "react";

/**
 * GraphLegend — displays the color-coded diff status legend.
 */
import type { DiffStatus } from "./GraphCanvas";

// ─── Types ─────────────────────────────────────────────────

interface LegendItem {
  readonly status: DiffStatus;
  readonly label: string;
  readonly color: string;
}

interface GraphLegendProps {
  readonly className?: string;
}

// ─── Data ──────────────────────────────────────────────────

const LEGEND_ITEMS: readonly LegendItem[] = [
  { status: "added", label: "Added", color: "var(--color-graph-added)" },
  { status: "removed", label: "Removed", color: "var(--color-graph-removed)" },
  { status: "modified", label: "Modified", color: "var(--color-graph-modified)" },
  { status: "unchanged", label: "Unchanged", color: "var(--color-graph-unchanged)" },
];

// ─── Component ─────────────────────────────────────────────

export const GraphLegend = memo(function GraphLegend({ className }: GraphLegendProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-md bg-vsc-surface-2 px-3 py-1.5 text-xs ${className ?? ""}`}
      role="list"
      aria-label="Graph diff legend"
    >
      {LEGEND_ITEMS.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5" role="listitem">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-vsc-text-secondary">{item.label}</span>
        </div>
      ))}
    </div>
  );
});
