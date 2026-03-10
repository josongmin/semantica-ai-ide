/**
 * GraphDiffOverlay — thin orchestrator that composes graph canvas,
 * legend, tooltip, and interaction logic.
 */
import { memo, useMemo } from "react";

import type { GraphEdge, GraphNode } from "../../../shared/protocol/types/workspace-graph";
import { useGraphInteraction } from "../model/useGraphInteraction";
import { type DiffGraphEdge, type DiffGraphNode, type DiffStatus,GraphCanvas } from "./GraphCanvas";
import { GraphLegend } from "./GraphLegend";
import { GraphTooltip } from "./GraphTooltip";

// ─── Types ─────────────────────────────────────────────────

export interface GraphDiffOverlayProps {
  readonly baseNodes: readonly GraphNode[];
  readonly baseEdges: readonly GraphEdge[];
  readonly headNodes: readonly GraphNode[];
  readonly headEdges: readonly GraphEdge[];
  readonly className?: string;
}

// ─── Diff Computation ──────────────────────────────────────

function computeNodeDiffStatus(
  node: GraphNode,
  baseIds: ReadonlySet<string>,
  headIds: ReadonlySet<string>,
): DiffStatus {
  const inBase = baseIds.has(node.id);
  const inHead = headIds.has(node.id);
  if (inHead && !inBase) return "added";
  if (inBase && !inHead) return "removed";
  return "modified";
}

function computeEdgeDiffStatus(
  edge: GraphEdge,
  baseEdgeKeys: ReadonlySet<string>,
  headEdgeKeys: ReadonlySet<string>,
): DiffStatus {
  const key = `${edge.source}::${edge.target}`;
  const inBase = baseEdgeKeys.has(key);
  const inHead = headEdgeKeys.has(key);
  if (inHead && !inBase) return "added";
  if (inBase && !inHead) return "removed";
  return "unchanged";
}

/** Simple force-free circular layout for diffed nodes */
function layoutNodes(nodes: readonly GraphNode[], cx: number, cy: number, radius: number): Map<string, { cx: number; cy: number }> {
  const positions = new Map<string, { cx: number; cy: number }>();
  const count = nodes.length;
  if (count === 0) return positions;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const node = nodes[i];
    if (!node) continue;
    positions.set(node.id, {
      cx: cx + radius * Math.cos(angle),
      cy: cy + radius * Math.sin(angle),
    });
  }
  return positions;
}

// ─── Component ─────────────────────────────────────────────

export const GraphDiffOverlay = memo(function GraphDiffOverlay({
  baseNodes,
  baseEdges,
  headNodes,
  headEdges,
  className,
}: GraphDiffOverlayProps) {
  const interaction = useGraphInteraction();

  // Compute diff data
  const { diffNodes, diffEdges } = useMemo(() => {
    const baseIdSet = new Set(baseNodes.map((n) => n.id));
    const headIdSet = new Set(headNodes.map((n) => n.id));
    const baseEdgeKeys = new Set(baseEdges.map((e) => `${e.source}::${e.target}`));
    const headEdgeKeys = new Set(headEdges.map((e) => `${e.source}::${e.target}`));

    // Merge all unique nodes
    const allNodesMap = new Map<string, GraphNode>();
    for (const n of baseNodes) allNodesMap.set(n.id, n);
    for (const n of headNodes) allNodesMap.set(n.id, n);
    const allNodes = Array.from(allNodesMap.values());

    // Layout
    const positions = layoutNodes(allNodes, 500, 350, Math.min(280, allNodes.length * 20));

    const nodes: DiffGraphNode[] = allNodes.map((n) => {
      const pos = positions.get(n.id) ?? { cx: 500, cy: 350 };
      return {
        ...n,
        diffStatus: computeNodeDiffStatus(n, baseIdSet, headIdSet),
        cx: pos.cx,
        cy: pos.cy,
      };
    });

    // Merge all unique edges
    const allEdgesMap = new Map<string, GraphEdge>();
    for (const e of baseEdges) allEdgesMap.set(`${e.source}::${e.target}`, e);
    for (const e of headEdges) allEdgesMap.set(`${e.source}::${e.target}`, e);

    const edges: DiffGraphEdge[] = Array.from(allEdgesMap.values()).map((e) => ({
      ...e,
      diffStatus: computeEdgeDiffStatus(e, baseEdgeKeys, headEdgeKeys),
    }));

    return { diffNodes: nodes, diffEdges: edges };
  }, [baseNodes, baseEdges, headNodes, headEdges]);

  // Resolve selected/hovered node objects for tooltip
  const selectedNode = useMemo(
    () => diffNodes.find((n) => n.id === interaction.selectedNodeId) ?? null,
    [diffNodes, interaction.selectedNodeId],
  );

  const hoveredNode = useMemo(
    () => diffNodes.find((n) => n.id === interaction.hoveredNodeId) ?? null,
    [diffNodes, interaction.hoveredNodeId],
  );

  const tooltipNode = selectedNode ?? hoveredNode;

  return (
    <div className={`relative flex h-full w-full flex-col ${className ?? ""}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--color-zinc-700,#3f3f46)] px-3 py-1.5">
        <GraphLegend />
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded px-2 py-0.5 text-xs text-[var(--color-zinc-300,#d4d4d8)] hover:bg-[var(--color-zinc-700,#3f3f46)]"
            onClick={interaction.zoomIn}
            aria-label="Zoom in"
          >
            +
          </button>
          <span className="min-w-[3ch] text-center text-xs text-[var(--color-zinc-400,#a1a1aa)]">
            {Math.round(interaction.zoom * 100)}%
          </span>
          <button
            type="button"
            className="rounded px-2 py-0.5 text-xs text-[var(--color-zinc-300,#d4d4d8)] hover:bg-[var(--color-zinc-700,#3f3f46)]"
            onClick={interaction.zoomOut}
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            className="ml-2 rounded px-2 py-0.5 text-xs text-[var(--color-zinc-300,#d4d4d8)] hover:bg-[var(--color-zinc-700,#3f3f46)]"
            onClick={interaction.resetView}
            aria-label="Reset view"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={interaction.containerRef} className="relative flex-1 overflow-hidden">
        <GraphCanvas
          nodes={diffNodes}
          edges={diffEdges}
          viewBox={interaction.viewBox}
          selectedNodeId={interaction.selectedNodeId}
          hoveredNodeId={interaction.hoveredNodeId}
          onSelectNode={interaction.selectNode}
          onHoverNode={interaction.hoverNode}
          onWheel={interaction.handleWheel}
          onPointerDown={interaction.handlePointerDown}
          onPointerMove={interaction.handlePointerMove}
          onPointerUp={interaction.handlePointerUp}
        />

        {/* Tooltip */}
        {tooltipNode && (
          <div className="pointer-events-none absolute right-3 top-3">
            <GraphTooltip node={tooltipNode} />
          </div>
        )}
      </div>
    </div>
  );
});
