import React, { useCallback, useMemo } from "react";

import type { CausalChainEdge, CausalChainNode, CausalRole } from "~shared/protocol/types";
import { cn } from "~shared/ui";

// ─── Constants ───────────────────────────────────────────

const NODE_WIDTH = 200;
const NODE_HEIGHT = 64;
const NODE_GAP_Y = 60;
const PADDING_X = 40;
const PADDING_Y = 32;

const ROLE_COLOR: Record<CausalRole, string> = {
  "root-cause": "var(--color-cause-root, #f7768e)",
  propagator: "var(--color-cause-propagator, #e0af68)",
  symptom: "var(--color-cause-symptom, #7dcfff)",
};

const ROLE_FILL: Record<CausalRole, string> = {
  "root-cause": "rgba(247,118,142,0.12)",
  propagator: "rgba(224,175,104,0.12)",
  symptom: "rgba(125,207,255,0.12)",
};

// ─── Props ───────────────────────────────────────────────

interface CausalChainGraphProps {
  nodes: readonly CausalChainNode[];
  edges: readonly CausalChainEdge[];
  onNodeClick?: (filePath: string, line: number) => void;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────

interface NodeLayout {
  node: CausalChainNode;
  x: number;
  y: number;
}

function computeLayout(nodes: readonly CausalChainNode[]): NodeLayout[] {
  return nodes.map((node, i) => ({
    node,
    x: PADDING_X,
    y: PADDING_Y + i * (NODE_HEIGHT + NODE_GAP_Y),
  }));
}

// ─── Edge Path ───────────────────────────────────────────

const EdgePath = React.memo(function EdgePath({
  fromLayout,
  toLayout,
  label,
}: {
  fromLayout: NodeLayout;
  toLayout: NodeLayout;
  label: string;
}) {
  const x1 = fromLayout.x + NODE_WIDTH / 2;
  const y1 = fromLayout.y + NODE_HEIGHT;
  const x2 = toLayout.x + NODE_WIDTH / 2;
  const y2 = toLayout.y;

  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="var(--vsc-border)"
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={midY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--vsc-text-ghost)"
          fontSize={10}
          className="pointer-events-none select-none"
        >
          {label}
        </text>
      )}
    </g>
  );
});

// ─── Node Rect ───────────────────────────────────────────

const NodeRect = React.memo(function NodeRect({
  layout,
  onClick,
}: {
  layout: NodeLayout;
  onClick?: () => void;
}) {
  const { node, x, y } = layout;
  const stroke = ROLE_COLOR[node.role];
  const fill = ROLE_FILL[node.role];

  return (
    <g
      className={cn("cursor-pointer", onClick && "hover:opacity-80")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={node.symbolName}
    >
      <rect
        x={x}
        y={y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        ry={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      {/* Symbol name */}
      <text
        x={x + NODE_WIDTH / 2}
        y={y + 22}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--vsc-fg)"
        fontSize={12}
        fontWeight={600}
        className="pointer-events-none select-none"
      >
        {node.symbolName.length > 24
          ? `${node.symbolName.slice(0, 22)  }...`
          : node.symbolName}
      </text>
      {/* Description */}
      <text
        x={x + NODE_WIDTH / 2}
        y={y + 44}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--vsc-text-secondary)"
        fontSize={10}
        className="pointer-events-none select-none"
      >
        {node.description.length > 30
          ? `${node.description.slice(0, 28)  }...`
          : node.description}
      </text>
    </g>
  );
});

// ─── Component ───────────────────────────────────────────

export const CausalChainGraph = React.memo(function CausalChainGraph({
  nodes,
  edges,
  onNodeClick,
  className,
}: CausalChainGraphProps) {
  const layouts = useMemo(() => computeLayout(nodes), [nodes]);

  const layoutMap = useMemo(() => {
    const map = new Map<string, NodeLayout>();
    for (const l of layouts) {
      map.set(l.node.id, l);
    }
    return map;
  }, [layouts]);

  const svgHeight =
    nodes.length > 0
      ? PADDING_Y * 2 + nodes.length * NODE_HEIGHT + (nodes.length - 1) * NODE_GAP_Y
      : 120;

  const svgWidth = PADDING_X * 2 + NODE_WIDTH;

  const handleNodeClick = useCallback(
    (node: CausalChainNode) => {
      onNodeClick?.(node.filePath, node.line);
    },
    [onNodeClick],
  );

  if (nodes.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "overflow-auto rounded-md border border-vsc-border/20 bg-vsc-surface-1/50",
        className,
      )}
      style={{ maxHeight: 400 }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="block"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth={8}
            markerHeight={6}
            refX={8}
            refY={3}
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              fill="var(--vsc-border)"
            />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge) => {
          const fromLayout = layoutMap.get(edge.from);
          const toLayout = layoutMap.get(edge.to);
          if (!fromLayout || !toLayout) return null;
          return (
            <EdgePath
              key={`${edge.from}-${edge.to}`}
              fromLayout={fromLayout}
              toLayout={toLayout}
              label={edge.label}
            />
          );
        })}

        {/* Nodes */}
        {layouts.map((layout) => (
          <NodeRect
            key={layout.node.id}
            layout={layout}
            onClick={
              onNodeClick
                ? () => handleNodeClick(layout.node)
                : undefined
            }
          />
        ))}
      </svg>
    </div>
  );
});
