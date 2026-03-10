import React from "react";

import { Button, cn, Icon } from "~shared/ui";

import type { DiffNode } from "../model/graphDiffAtoms";

interface DiffNodeCardProps {
  node: DiffNode;
  position: { x: number; y: number };
  onViewCode?: () => void;
  onViewDiff?: () => void;
}

const CHANGE_PREFIX_STYLE: Record<string, string> = {
  "+": "text-vsc-success",
  "~": "text-vsc-warning",
  "-": "text-vsc-error",
};

export const DiffNodeCard = React.memo(function DiffNodeCard({
  node,
  position,
  onViewCode,
  onViewDiff,
}: DiffNodeCardProps) {
  const changeTypeColor: Record<DiffNode["changeType"], string> = {
    changed: "text-vsc-error",
    affected: "text-vsc-warning",
    unchanged: "text-vsc-text-ghost",
  };

  const changeTypeLabel: Record<DiffNode["changeType"], string> = {
    changed: "Changed",
    affected: "Affected",
    unchanged: "Unchanged",
  };

  return (
    <div
      className={cn(
        "absolute z-(--z-overlay) pointer-events-auto",
        "w-full sm:w-[260px] rounded-lg shadow-lg",
        "bg-vsc-surface-1/95 backdrop-blur-sm",
        "border border-vsc-border",
        "animate-in fade-in zoom-in-95 duration-150",
        "overflow-hidden",
      )}
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-vsc-border bg-vsc-surface-2/50">
        <span className="text-xs font-semibold font-mono text-vsc-fg truncate">
          {node.label}
        </span>
        <span
          className={cn(
            "text-2xs font-medium px-1.5 py-0.5 rounded",
            changeTypeColor[node.changeType],
            node.changeType === "changed" && "bg-vsc-error/10",
            node.changeType === "affected" && "bg-vsc-warning/10",
          )}
        >
          {changeTypeLabel[node.changeType]}
        </span>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* File path */}
        <div className="flex items-center gap-1.5 text-2xs text-vsc-text-tertiary">
          <Icon name="file" tokenSize="2xs" className="shrink-0" />
          <span className="font-mono truncate">{node.filePath}</span>
          {node.line !== undefined && (
            <span className="text-vsc-text-ghost">:{node.line}</span>
          )}
        </div>

        {/* Changes list */}
        {node.changes && node.changes.length > 0 && (
          <div className="space-y-1">
            <span className="text-2xs text-vsc-text-tertiary font-medium uppercase tracking-wider">
              Changes
            </span>
            <ul className="space-y-0.5">
              {node.changes.map((change, i) => {
                const prefix = change.charAt(0);
                const colorClass = CHANGE_PREFIX_STYLE[prefix] ?? "text-vsc-text-secondary";
                return (
                  <li key={i} className="flex items-start gap-1 text-2xs font-mono">
                    <span className={cn("shrink-0 font-bold", colorClass)}>{prefix}</span>
                    <span className="text-vsc-text-secondary">{change.slice(2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Impact stats */}
        <div className="space-y-1">
          <span className="text-2xs text-vsc-text-tertiary font-medium uppercase tracking-wider">
            Impact
          </span>
          <div className="flex items-center gap-3 text-2xs">
            <div className="flex items-center gap-1 text-vsc-text-secondary">
              <Icon name="arrow-right" tokenSize="2xs" className="text-vsc-text-ghost" />
              <span className="tabular-nums font-medium">{node.directCallers}</span>
              <span className="text-vsc-text-tertiary">direct callers</span>
            </div>
            <div className="flex items-center gap-1 text-vsc-text-secondary">
              <Icon name="arrow-right" tokenSize="2xs" className="text-vsc-text-ghost" />
              <span className="tabular-nums font-medium">{node.transitiveDeps}</span>
              <span className="text-vsc-text-tertiary">transitive deps</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="text-2xs h-6 px-2 gap-1"
            onClick={onViewCode}
          >
            <Icon name="code" tokenSize="2xs" />
            View Code
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-2xs h-6 px-2 gap-1"
            onClick={onViewDiff}
          >
            <Icon name="diff" tokenSize="2xs" />
            View Full Diff
          </Button>
        </div>
      </div>
    </div>
  );
});
