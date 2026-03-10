import React, { useCallback, useState } from "react";

import type { CriticalFlow } from "~features/repo-explain";
import { cn, Icon } from "~shared/ui";

// ─── Types ────────────────────────────────────────────────

interface FlowCardProps {
  flows: CriticalFlow[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────

export const FlowCard = React.memo(function FlowCard({
  flows,
  className,
}: FlowCardProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggle = useCallback(
    (i: number) => setExpandedIdx((prev) => (prev === i ? null : i)),
    [],
  );

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {flows.map((flow, i) => {
        const isOpen = expandedIdx === i;

        return (
          <div key={flow.name}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left",
                "cursor-pointer border-none transition-colors duration-fast focus-ring",
                "hover:bg-vsc-surface-2/50",
                isOpen && "bg-vsc-surface-2/30",
              )}
            >
              <Icon
                name="chevron-right"
                tokenSize="2xs"
                className={cn(
                  "shrink-0 text-vsc-text-ghost transition-transform duration-fast",
                  isOpen && "rotate-90",
                )}
              />
              <span className="flex-1 text-sm text-vsc-fg font-medium">
                {flow.name}
              </span>
              <span
                className={cn(
                  "text-2xs px-1.5 py-0.5 rounded font-medium",
                  "bg-vsc-accent/10 text-vsc-accent",
                )}
              >
                trace
              </span>
            </button>

            {/* Expanded step timeline */}
            <div
              className={cn(
                "overflow-hidden transition-[max-height,opacity] duration-fast",
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="pl-8 pr-3 pb-3 flex flex-col gap-2">
                <p className="text-2xs text-vsc-text-secondary leading-relaxed">
                  {flow.description}
                </p>
                <div className="flex flex-col gap-0">
                  {flow.steps.map((step, si) => {
                    const isLast = si === flow.steps.length - 1;
                    return (
                      <div key={step.label} className="flex items-stretch gap-2">
                        {/* Vertical connector */}
                        <div className="flex flex-col items-center w-3 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-vsc-accent/60 shrink-0 mt-1.5" />
                          {!isLast && (
                            <span className="w-px flex-1 bg-vsc-accent/20" />
                          )}
                        </div>
                        {/* Step content */}
                        <div className="flex flex-col pb-2">
                          <span className="text-xs text-vsc-fg font-medium">
                            {step.label}
                          </span>
                          {step.filePath && (
                            <span className="text-2xs text-vsc-text-ghost font-mono">
                              {step.filePath}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
