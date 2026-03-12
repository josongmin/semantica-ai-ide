import React from "react";

import { cn, Text } from "~shared/ui";

/**
 * Small floating legend overlay for the graph diff visualization.
 * Positioned in the bottom-right corner of the overlay.
 */
export const DiffLegend = React.memo(function DiffLegend() {
  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 z-(--z-overlay)",
        "bg-vsc-surface-1/90 backdrop-blur-sm",
        "border border-vsc-border rounded-lg",
        "px-3 py-2.5 shadow-sm",
        "animate-in fade-in slide-in-from-bottom-1 duration-300",
      )}
    >
      <Text
        size="2xs"
        tone="tertiary"
        weight="medium"
        className="uppercase tracking-wider block mb-1.5"
      >
        Legend
      </Text>

      <div className="grid grid-cols-2 gap-x-5 gap-y-1">
        {/* Nodes column */}
        <div className="space-y-1">
          <LegendItem>
            <svg width="18" height="12" className="shrink-0">
              <rect
                x="1"
                y="1"
                width="16"
                height="10"
                rx="2"
                fill="var(--color-vsc-surface-2)"
                stroke="var(--color-vsc-error)"
                strokeWidth="1.5"
              />
            </svg>
            <Text tone="secondary">changed</Text>
          </LegendItem>

          <LegendItem>
            <svg width="18" height="12" className="shrink-0">
              <rect
                x="1"
                y="1"
                width="16"
                height="10"
                rx="2"
                fill="var(--color-vsc-surface-2)"
                stroke="var(--color-vsc-warning)"
                strokeWidth="1"
              />
            </svg>
            <Text tone="secondary">affected</Text>
          </LegendItem>

          <LegendItem>
            <svg width="18" height="12" className="shrink-0">
              <rect
                x="1"
                y="1"
                width="16"
                height="10"
                rx="2"
                fill="var(--color-vsc-surface-1)"
                stroke="var(--color-vsc-border)"
                strokeWidth="1"
                strokeDasharray="2 1.5"
                opacity="0.5"
              />
            </svg>
            <Text tone="ghost">unchanged</Text>
          </LegendItem>
        </div>

        {/* Edges column */}
        <div className="space-y-1">
          <LegendItem>
            <svg width="22" height="12" className="shrink-0">
              <line
                x1="2"
                y1="6"
                x2="18"
                y2="6"
                stroke="var(--color-vsc-text-ghost)"
                strokeWidth="1"
              />
              <polygon points="18,3 22,6 18,9" fill="var(--color-vsc-text-ghost)" />
            </svg>
            <Text tone="secondary">normal</Text>
          </LegendItem>

          <LegendItem>
            <svg width="22" height="12" className="shrink-0">
              <line
                x1="2"
                y1="6"
                x2="18"
                y2="6"
                stroke="var(--color-vsc-warning)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <polygon points="18,3 22,6 18,9" fill="var(--color-vsc-warning)" />
            </svg>
            <Text tone="secondary">impacted</Text>
          </LegendItem>

          <LegendItem>
            <svg width="22" height="12" className="shrink-0">
              <line
                x1="2"
                y1="6"
                x2="18"
                y2="6"
                stroke="var(--color-vsc-success)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <polygon points="18,3 22,6 18,9" fill="var(--color-vsc-success)" />
            </svg>
            <Text tone="secondary">new</Text>
          </LegendItem>

          <LegendItem>
            <svg width="22" height="12" className="shrink-0">
              <line
                x1="2"
                y1="6"
                x2="18"
                y2="6"
                stroke="var(--color-vsc-error)"
                strokeWidth="1"
                opacity="0.4"
                strokeDasharray="2 3"
              />
              <polygon points="18,3 22,6 18,9" fill="var(--color-vsc-error)" opacity="0.4" />
            </svg>
            <Text tone="ghost">removed</Text>
          </LegendItem>
        </div>
      </div>
    </div>
  );
});

function LegendItem({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5 text-2xs">{children}</div>;
}
