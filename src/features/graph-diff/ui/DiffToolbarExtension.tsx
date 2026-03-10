import React from "react";

import { Button, cn, Icon } from "~shared/ui";

import type { GraphDiffMode } from "../model/graphDiffAtoms";

interface DiffToolbarExtensionProps {
  mode: GraphDiffMode;
  onToggle: () => void;
  summary?: { changed: number; affected: number; total: number };
}

const MODE_OPTIONS: { value: GraphDiffMode; label: string }[] = [
  { value: "diff", label: "Diff View" },
  { value: "off", label: "Full Graph" },
  { value: "flow-trace", label: "Flow Trace" },
];

export const DiffToolbarExtension = React.memo(function DiffToolbarExtension({
  mode,
  onToggle,
  summary,
}: DiffToolbarExtensionProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 h-8",
        "border-b border-vsc-border bg-vsc-surface-1/80 backdrop-blur-sm",
        "shrink-0",
      )}
    >
      {/* Mode selector radio group */}
      <div className="flex items-center gap-0.5 bg-vsc-surface-0 rounded-md p-0.5 border border-vsc-border/50">
        {MODE_OPTIONS.map((opt) => {
          const isActive = mode === opt.value;
          return (
            <Button
              key={opt.value}
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                "text-2xs h-5 px-2 rounded-[3px] transition-colors duration-150",
                isActive
                  ? "bg-vsc-surface-2 text-vsc-fg shadow-sm"
                  : "text-vsc-text-tertiary hover:text-vsc-text-secondary",
              )}
            >
              {isActive && (
                <span
                  className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full mr-1",
                    opt.value === "diff" && "bg-vsc-error",
                    opt.value === "flow-trace" && "bg-vsc-warning",
                    opt.value === "off" && "bg-vsc-text-ghost",
                  )}
                />
              )}
              {opt.label}
            </Button>
          );
        })}
      </div>

      {/* Summary stats */}
      {summary && mode !== "off" && (
        <div className="flex items-center gap-2 text-2xs text-vsc-text-tertiary ml-auto">
          <span className="text-vsc-text-ghost">Showing:</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-vsc-error" />
            <span className="tabular-nums font-medium text-vsc-text-secondary">
              {summary.changed}
            </span>
            <span>changed</span>
          </span>
          <span className="text-vsc-border">&middot;</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-vsc-warning" />
            <span className="tabular-nums font-medium text-vsc-text-secondary">
              {summary.affected}
            </span>
            <span>affected</span>
          </span>
          <span className="text-vsc-border">&middot;</span>
          <span className="flex items-center gap-1">
            <Icon name="git-compare" tokenSize="2xs" className="text-vsc-text-ghost" />
            <span className="tabular-nums font-medium text-vsc-text-secondary">
              {summary.total}
            </span>
            <span>total</span>
          </span>
        </div>
      )}
    </div>
  );
});
