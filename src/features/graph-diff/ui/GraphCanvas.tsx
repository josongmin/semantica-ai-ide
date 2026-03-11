/**
 * GraphCanvas — renders the SVG graph with nodes, edges, zoom, and pan.
 */
import React, { memo } from "react";

import type { WorkspaceGraphNodeId } from "../../../shared/protocol/types/core";
import type { GraphEdge, GraphNode } from "../../../shared/protocol/types/workspace-graph";
import type { ViewBox } from "../model/useGraphInteraction";

// ─── Types ─────────────────────────────────────────────────

export type DiffStatus = "added" | "removed" | "modified" | "unchanged";

export type DiffGraphNode = GraphNode & {
  readonly diffStatus: DiffStatus;
  readonly cx: number;
  readonly cy: number;
};

export type DiffGraphEdge = GraphEdge & {
  readonly diffStatus: DiffStatus;
};

interface GraphCanvasProps {
  readonly nodes: readonly DiffGraphNode[];
  readonly edges: readonly DiffGraphEdge[];
  readonly viewBox: ViewBox;
  readonly selectedNodeId: WorkspaceGraphNodeId | null;
  readonly hoveredNodeId: WorkspaceGraphNodeId | null;
  readonly onSelectNode: (id: WorkspaceGraphNodeId | null) => void;
  readonly onHoverNode: (id: WorkspaceGraphNodeId | null) => void;
  readonly onWheel: (e: React.WheelEvent) => void;
  readonly onPointerDown: (e: React.PointerEvent) => void;
  readonly onPointerMove: (e: React.PointerEvent) => void;
  readonly onPointerUp: () => void;
}

// ─── Constants ─────────────────────────────────────────────

const STATUS_COLORS: Record<DiffStatus, string> = {
  added: "var(--color-vsc-success, #1a7f37)",
  removed: "var(--color-vsc-error, #cf222e)",
  modified: "var(--color-vsc-warning, #9a6700)",
  unchanged: "var(--color-vsc-text-ghost)",
};

const NODE_RADIUS = 18;
const SELECTED_RING = 4;
const HOVERED_RING = 2;

// ─── Sub-components ────────────────────────────────────────

const EdgeLine = memo(function EdgeLine({
  edge,
  sourceNode,
  targetNode,
}: {
  edge: DiffGraphEdge;
  sourceNode: DiffGraphNode | undefined;
  targetNode: DiffGraphNode | undefined;
}) {
  if (!sourceNode || !targetNode) return null;
  const color = STATUS_COLORS[edge.diffStatus];
  const dashed = edge.diffStatus === "removed";

  return (
    <line
      x1={sourceNode.cx}
      y1={sourceNode.cy}
      x2={targetNode.cx}
      y2={targetNode.cy}
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray={dashed ? "6 3" : undefined}
      opacity={edge.diffStatus === "unchanged" ? 0.3 : 0.7}
    />
  );
});

const NodeCircle = memo(function NodeCircle({
  node,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: {
  node: DiffGraphNode;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: WorkspaceGraphNodeId | null) => void;
  onHover: (id: WorkspaceGraphNodeId | null) => void;
}) {
  const fill = STATUS_COLORS[node.diffStatus];
  let ringWidth = 0;
  if (isSelected) ringWidth = SELECTED_RING;
  else if (isHovered) ringWidth = HOVERED_RING;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : node.id);
      }}
      onPointerEnter={() => onHover(node.id)}
      onPointerLeave={() => onHover(null)}
      style={{ cursor: "pointer" }}
    >
      {ringWidth > 0 && (
        <circle
          cx={node.cx}
          cy={node.cy}
          r={NODE_RADIUS + ringWidth}
          fill="none"
          stroke="var(--color-vsc-accent, #8b5cf6)"
          strokeWidth={ringWidth}
        />
      )}
      <circle cx={node.cx} cy={node.cy} r={NODE_RADIUS} fill={fill} />
      <text
        x={node.cx}
        y={node.cy + NODE_RADIUS + 14}
        textAnchor="middle"
        fontSize={11}
        fill="var(--color-vsc-text-secondary)"
      >
        {node.name}
      </text>
    </g>
  );
});

// ─── Main Component ────────────────────────────────────────

export const GraphCanvas = memo(function GraphCanvas({
  nodes,
  edges,
  viewBox,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: GraphCanvasProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const vb = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;

  return (
    <svg
      viewBox={vb}
      className="h-full w-full"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={() => onSelectNode(null)}
    >
      <g className="edges">
        {edges.map((edge) => (
          <EdgeLine
            key={`${edge.source}-${edge.target}`}
            edge={edge}
            sourceNode={nodeMap.get(edge.source)}
            targetNode={nodeMap.get(edge.target)}
          />
        ))}
      </g>
      <g className="nodes">
        {nodes.map((node) => (
          <NodeCircle
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isHovered={node.id === hoveredNodeId}
            onSelect={onSelectNode}
            onHover={onHoverNode}
          />
        ))}
      </g>
    </svg>
  );
});
