/**
 * LensMiniGraph — small SVG neighborhood graph
 *
 * Displays center symbol with callers (left) and callees (right)
 * as an interactive mini call-graph.
 */

import { memo, useCallback, useMemo } from "react";

import type { AnalysisSymbolKind, SymbolRef } from "~shared/protocol/types";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { LensDetailData } from "../model/types";

// ─── Constants ───────────────────────────────────────────

const GRAPH_HEIGHT = 200;
const NODE_W = 100;
const NODE_H = 28;
const CENTER_X = 200;
const LEFT_X = 30;
const RIGHT_X = 370;
const MAX_SIDE = 4;

const KIND_FILL: Record<string, string> = {
  function: "var(--color-lens-function)",
  class: "var(--color-lens-class)",
  hook: "var(--color-lens-hook)",
  method: "var(--color-lens-method)",
  interface: "var(--color-lens-interface)",
  variable: "var(--color-lens-variable)",
  module: "var(--color-lens-module)",
  type: "var(--color-lens-type)",
  enum: "var(--color-lens-enum)",
  namespace: "var(--color-lens-namespace)",
};

// ─── Props ───────────────────────────────────────────────

interface LensMiniGraphProps {
  detail: LensDetailData;
  onNodeClick: (filePath: string, line: number) => void;
  onClose: () => void;
  className?: string;
}

// ─── Node layout helpers ─────────────────────────────────

interface NodeLayout {
  id: string;
  name: string;
  kind: AnalysisSymbolKind;
  filePath: string;
  line: number;
  x: number;
  y: number;
}

function distributeY(count: number): number[] {
  if (count === 0) return [];
  const spacing = GRAPH_HEIGHT / (count + 1);
  return Array.from({ length: count }, (_, i) => spacing * (i + 1) - NODE_H / 2);
}

function buildLayout(detail: LensDetailData) {
  const callers = detail.callers.slice(0, MAX_SIDE);
  const callees = detail.callees.slice(0, MAX_SIDE);

  const callerYs = distributeY(callers.length);
  const calleeYs = distributeY(callees.length);
  const centerY = GRAPH_HEIGHT / 2 - NODE_H / 2;

  const center: NodeLayout = {
    id: detail.symbolId,
    name: detail.symbolName,
    kind: detail.symbolKind,
    filePath: detail.filePath,
    line: detail.line,
    x: CENTER_X - NODE_W / 2,
    y: centerY,
  };

  const callerNodes: NodeLayout[] = callers.map((ref: SymbolRef, i: number) => ({
    id: ref.id,
    name: ref.name,
    kind: ref.kind,
    filePath: ref.filePath,
    line: ref.line,
    x: LEFT_X,
    y: callerYs[i] ?? 0,
  }));

  const calleeNodes: NodeLayout[] = callees.map((ref: SymbolRef, i: number) => ({
    id: ref.id,
    name: ref.name,
    kind: ref.kind,
    filePath: ref.filePath,
    line: ref.line,
    x: RIGHT_X,
    y: calleeYs[i] ?? 0,
  }));

  return { center, callerNodes, calleeNodes };
}

// ─── SVG Node ────────────────────────────────────────────

const GraphNode = memo(function GraphNode({
  node,
  isCenter,
  onClick,
}: {
  node: NodeLayout;
  isCenter: boolean;
  onClick: (filePath: string, line: number) => void;
}) {
  const fill = KIND_FILL[node.kind] ?? "var(--color-lens-function)";

  const handleClick = useCallback(() => {
    onClick(node.filePath, node.line);
  }, [onClick, node.filePath, node.line]);

  return (
    <g
      className="cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={node.name}
    >
      <rect
        x={node.x}
        y={node.y}
        width={NODE_W}
        height={NODE_H}
        rx={6}
        fill={fill}
        fillOpacity={0.15}
        stroke={isCenter ? "var(--color-vsc-accent, #8b5cf6)" : fill}
        strokeWidth={isCenter ? 2 : 1}
        strokeOpacity={0.6}
      />
      <text
        x={node.x + NODE_W / 2}
        y={node.y + NODE_H / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={fill}
        fontSize={10}
        fontFamily="monospace"
      >
        {node.name.length > 12 ? `${node.name.slice(0, 11)}\u2026` : node.name}
      </text>
    </g>
  );
});

// ─── Main Component ──────────────────────────────────────

export const LensMiniGraph = memo(function LensMiniGraph({
  detail,
  onNodeClick,
  onClose,
  className,
}: LensMiniGraphProps) {
  const layout = useMemo(() => buildLayout(detail), [detail]);

  const { center, callerNodes, calleeNodes } = layout;

  return (
    <div
      className={cn(
        "relative w-full",
        "backdrop-blur-md bg-vsc-surface-0/80 border border-vsc-border/30",
        "rounded-lg overflow-hidden",
        className,
      )}
      style={{ height: GRAPH_HEIGHT }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "absolute top-1.5 right-1.5 z-10",
          "p-0.5 rounded",
          "text-vsc-text-ghost hover:text-vsc-text-secondary",
          "hover:bg-vsc-surface-2 transition-colors duration-fast cursor-pointer",
        )}
        aria-label="Close mini graph"
      >
        <Icon name="close" tokenSize="xs" />
      </button>

      <svg
        width="100%"
        height={GRAPH_HEIGHT}
        viewBox={`0 0 500 ${GRAPH_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Edges from callers to center */}
        {callerNodes.map((caller) => (
          <line
            key={`edge-caller-${caller.id}`}
            x1={caller.x + NODE_W}
            y1={caller.y + NODE_H / 2}
            x2={center.x}
            y2={center.y + NODE_H / 2}
            stroke="var(--color-vsc-border, #d0d7de)"
            strokeWidth={1}
            strokeOpacity={0.5}
          />
        ))}

        {/* Edges from center to callees */}
        {calleeNodes.map((callee) => (
          <line
            key={`edge-callee-${callee.id}`}
            x1={center.x + NODE_W}
            y1={center.y + NODE_H / 2}
            x2={callee.x}
            y2={callee.y + NODE_H / 2}
            stroke="var(--color-vsc-border, #d0d7de)"
            strokeWidth={1}
            strokeOpacity={0.5}
          />
        ))}

        {/* Caller nodes */}
        {callerNodes.map((node) => (
          <GraphNode key={node.id} node={node} isCenter={false} onClick={onNodeClick} />
        ))}

        {/* Center node */}
        <GraphNode node={center} isCenter onClick={onNodeClick} />

        {/* Callee nodes */}
        {calleeNodes.map((node) => (
          <GraphNode key={node.id} node={node} isCenter={false} onClick={onNodeClick} />
        ))}
      </svg>
    </div>
  );
});
