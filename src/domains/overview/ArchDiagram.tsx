import React, { useEffect, useState } from "react";

import type { ArchEdge, ArchNode } from "~features/repo-explain";
import { cn } from "~shared/ui";

// ─── Layout constants ─────────────────────────────────────

const NODE_W = 160;
const NODE_H = 100;
const GAP = 60;
const SVG_W = NODE_W * 3 + GAP * 2 + 40; // 40 = padding
const SVG_H = NODE_H + 56; // 56 = top padding + label space

const NODE_POSITIONS = [
  { x: 20, y: 36 },
  { x: 20 + NODE_W + GAP, y: 36 },
  { x: 20 + (NODE_W + GAP) * 2, y: 36 },
];

// ─── Types ────────────────────────────────────────────────

interface ArchDiagramProps {
  nodes: ArchNode[];
  edges: ArchEdge[];
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────

function getNodeCenter(index: number) {
  const pos = NODE_POSITIONS[index] ?? { x: 0, y: 0 };
  return { cx: pos.x + NODE_W / 2, cy: pos.y + NODE_H / 2 };
}

// ─── Component ────────────────────────────────────────────

export const ArchDiagram = React.memo(function ArchDiagram({
  nodes,
  edges,
  className,
}: ArchDiagramProps) {
  const [visibleNodes, setVisibleNodes] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    nodes.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleNodes(i + 1), 80 * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, [nodes]);

  const nodeMap = new Map(nodes.map((n, i) => [n.id, i]));

  return (
    <div className={cn("overflow-x-auto", className)}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-2xl mx-auto"
        style={{ minWidth: 420 }}
        role="img"
        aria-label="Architecture diagram"
      >
        {/* Edges */}
        {edges.map((edge) => {
          const fromIdx = nodeMap.get(edge.from);
          const toIdx = nodeMap.get(edge.to);
          if (fromIdx === undefined || toIdx === undefined) return null;

          const from = getNodeCenter(fromIdx);
          const to = getNodeCenter(toIdx);
          const visible = visibleNodes > Math.max(fromIdx, toIdx);
          const fromPos = NODE_POSITIONS[fromIdx] ?? { x: 0, y: 0 };
          const toPos = NODE_POSITIONS[toIdx] ?? { x: 0, y: 0 };

          return (
            <g key={`${edge.from}-${edge.to}`}>
              {/* Arrow line */}
              <line
                x1={fromPos.x + NODE_W}
                y1={from.cy}
                x2={toPos.x}
                y2={to.cy}
                className="stroke-vsc-accent/50"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: "opacity 300ms ease-out",
                }}
              />
              {/* Arrowhead */}
              <polygon
                points={`${toPos.x},${to.cy} ${toPos.x - 8},${to.cy - 4} ${toPos.x - 8},${to.cy + 4}`}
                className="fill-vsc-accent/50"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: "opacity 300ms ease-out",
                }}
              />
              {/* Edge label */}
              <text
                x={(fromPos.x + NODE_W + toPos.x) / 2}
                y={from.cy - 8}
                textAnchor="middle"
                className="fill-vsc-text-ghost text-2xs"
                fontSize={9}
                style={{
                  opacity: visible ? 1 : 0,
                  transition: "opacity 300ms ease-out 100ms",
                }}
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = NODE_POSITIONS[i] ?? { x: 0, y: 0 };
          const visible = i < visibleNodes;

          return (
            <g
              key={node.id}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.7)",
                transformOrigin: `${pos.x + NODE_W / 2}px ${pos.y + NODE_H / 2}px`,
                transition: "opacity 300ms ease-out, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* Card background */}
              <rect
                x={pos.x}
                y={pos.y}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                className="fill-vsc-surface-2 stroke-vsc-border/20"
                strokeWidth={1}
              />

              {/* Node label */}
              <text
                x={pos.x + NODE_W / 2}
                y={pos.y + 26}
                textAnchor="middle"
                className="fill-vsc-fg font-semibold"
                fontSize={13}
              >
                {node.label}
              </text>

              {/* Tech stack */}
              {node.tech.map((t, ti) => (
                <text
                  key={t}
                  x={pos.x + NODE_W / 2}
                  y={pos.y + 48 + ti * 16}
                  textAnchor="middle"
                  className="fill-vsc-text-secondary"
                  fontSize={10}
                >
                  {t}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
});
