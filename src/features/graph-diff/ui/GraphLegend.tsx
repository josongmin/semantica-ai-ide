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
  { status: "added", label: "Added", color: "var(--color-green-500, #22c55e)" },
  { status: "removed", label: "Removed", color: "var(--color-red-500, #ef4444)" },
  { status: "modified", label: "Modified", color: "var(--color-amber-500, #f59e0b)" },
  { status: "unchanged", label: "Unchanged", color: "var(--color-zinc-400, #a1a1aa)" },
];

// ─── Component ─────────────────────────────────────────────

export const GraphLegend = memo(function GraphLegend({ className }: GraphLegendProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-md bg-[var(--color-zinc-900,#18181b)] px-3 py-1.5 text-xs ${className ?? ""}`}
      role="list"
      aria-label="Graph diff legend"
    >
      {LEGEND_ITEMS.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5" role="listitem">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[var(--color-zinc-300,#d4d4d8)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
});
