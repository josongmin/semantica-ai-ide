import React, { useMemo } from "react";

import type { ImpactSeverity } from "~shared/protocol/types";
import { cn, Icon, Text } from "~shared/ui";

import type { ImpactNode } from "../model/types";
import { ImpactSeverityBadge } from "./ImpactSeverityBadge";

// ─── Constants ──────────────────────────────────────────

const STAGGER_INTERVAL_MS = 50;

// ─── Severity ordering ──────────────────────────────────

const SEVERITY_ORDER: readonly ImpactSeverity[] = ["breaking", "major", "minor", "cosmetic"];

// ─── Node Row ────────────────────────────────────────────

const ImpactNodeRow = React.memo(function ImpactNodeRow({
  node,
  onNodeClick,
  index = 0,
}: {
  node: ImpactNode;
  onNodeClick?: ((filePath: string, line: number) => void) | undefined;
  index?: number | undefined;
}) {
  const directionLabel = node.direction === "direct" ? "direct" : "transitive";

  return (
    <div
      role="option"
      aria-selected={false}
      className="si-stagger-item flex items-start gap-2 px-3 py-1.5 hover:bg-vsc-surface-1 transition-colors duration-fast"
      style={{ "--si-delay": `${index * STAGGER_INTERVAL_MS}ms` } as React.CSSProperties}
    >
      <ImpactSeverityBadge severity={node.severity} className="mt-0.5 shrink-0" />

      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Text size="xs" className="font-medium text-vsc-fg truncate">
            {node.name}
          </Text>
          <Text size="2xs" tone="ghost" className="shrink-0">
            {directionLabel}
          </Text>
          <Text size="2xs" tone="ghost" className="shrink-0 tabular-nums">
            {Math.round(node.confidence * 100)}%
          </Text>
        </div>

        {node.description && (
          <Text size="2xs" tone="ghost" className="truncate">
            {node.description}
          </Text>
        )}

        <button
          type="button"
          className="flex items-center gap-1 text-left group w-fit"
          onClick={() => onNodeClick?.(node.filePath, node.line)}
        >
          <Icon name="file" tokenSize="2xs" className="text-vsc-accent shrink-0" />
          <Text size="2xs" className="text-vsc-accent group-hover:underline truncate">
            {node.filePath}:{node.line}
          </Text>
        </button>
      </div>
    </div>
  );
});

// ─── Main Component ──────────────────────────────────────

export interface ImpactNodeListProps {
  nodes: readonly ImpactNode[];
  onNodeClick?: (filePath: string, line: number) => void;
  className?: string;
}

export const ImpactNodeList = React.memo(function ImpactNodeList({
  nodes,
  onNodeClick,
  className,
}: ImpactNodeListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, ImpactNode[]>();
    for (const node of nodes) {
      const list = map.get(node.severity);
      if (list !== undefined) {
        list.push(node);
      } else {
        map.set(node.severity, [node]);
      }
    }
    // Return entries in severity order
    const ordered = new Map<ImpactSeverity, ImpactNode[]>();
    for (const sev of SEVERITY_ORDER) {
      const list = map.get(sev);
      if (list !== undefined) {
        ordered.set(sev, list);
      }
    }
    return ordered;
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-vsc-text-ghost", className)}>
        <Icon name="pass" tokenSize="lg" className="opacity-30" />
        <Text size="xs" tone="ghost" className="mt-1">
          No impacted nodes detected
        </Text>
      </div>
    );
  }

  return (
    <div role="listbox" aria-label="Impacted nodes" className={cn("flex flex-col overflow-y-auto", className)}>
      {Array.from(grouped.entries()).map(([severity, items]) => (
        <div key={severity} role="group" aria-label={`${severity} severity`}>
          <div className="sticky top-0 z-(--z-sticky) flex items-center gap-1.5 px-3 py-1 bg-vsc-surface-0/90 backdrop-blur-sm border-b border-vsc-border/15">
            <Text size="2xs" tone="ghost" className="font-medium uppercase">
              {severity}
            </Text>
            <Text size="2xs" tone="ghost" className="tabular-nums">
              ({items.length})
            </Text>
          </div>
          {items.map((node, i) => (
            <ImpactNodeRow key={node.id} node={node} onNodeClick={onNodeClick} index={i} />
          ))}
        </div>
      ))}
    </div>
  );
});
