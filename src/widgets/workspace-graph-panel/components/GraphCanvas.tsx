import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  focusedSubgraphAtom,
  selectedNodeIdAtom,
  visibleGraphNodesAtom,
  workspaceGraphAtom,
} from "../../../entities/workspace-graph";
import { getVscodeColor } from "../../../shared/lib/vscodeTheme";
import type { WorkspaceGraphNodeId } from "../../../shared/protocol";
import { runForceLayout, type Vec2 } from "../hooks/useForceLayout";
import { getKindColor } from "./kindConfig";

// ─── Graph Canvas ─────────────────────────────────────────────

export const GraphCanvas = React.memo(function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graph = useAtomValue(workspaceGraphAtom);
  const subgraph = useAtomValue(focusedSubgraphAtom);
  const visible = useAtomValue(visibleGraphNodesAtom);
  const selectedId = useAtomValue(selectedNodeIdAtom);
  const setSelectedId = useSetAtom(selectedNodeIdAtom);

  const [size, setSize] = useState({ w: 280, h: 160 });
  const layoutRef = useRef<Map<string, Vec2>>(new Map());

  const nodes = subgraph ? subgraph.nodes : visible;
  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const edges = useMemo(() => {
    const raw = subgraph ? subgraph.edges : (graph?.edges ?? []);
    return raw.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [subgraph, graph?.edges, nodeIds]);

  useLayoutEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e?.contentRect ?? { width: 280, height: 160 };
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (nodes.length === 0) return;
    layoutRef.current = runForceLayout(nodes, edges, size.w, size.h, selectedId);
  }, [nodes, edges, size.w, size.h, selectedId]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || nodes.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      let best: { id: string; d: number } | null = null;
      for (const n of nodes) {
        const p = layoutRef.current.get(n.id);
        if (!p) continue;
        const r = Math.max(6, (n.metrics?.complexity ?? 1) * 2);
        const d = Math.hypot(mx - p.x, my - p.y);
        if (d <= r * 3 && (!best || d < best.d)) best = { id: n.id, d };
      }
      if (best) setSelectedId(best.id as WorkspaceGraphNodeId);
    },
    [nodes, setSelectedId],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio !== 0 ? window.devicePixelRatio : 1;
    const w = size.w * dpr;
    const h = size.h * dpr;
    canvas.width = w;
    canvas.height = h;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.w, size.h);

    const layout = layoutRef.current;
    if (layout.size === 0) return;

    // Edges
    const edgeColor = getVscodeColor("--vscode-charts-blue", "#8b5cf6");
    ctx.strokeStyle = `${edgeColor}33`; // ~0.2 alpha
    ctx.lineWidth = 1;
    for (const edge of edges) {
      const sp = layout.get(edge.source);
      const tp = layout.get(edge.target);
      if (!sp || !tp) continue;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(tp.x, tp.y);
      ctx.stroke();
    }

    // Nodes
    for (const n of nodes) {
      const p = layout.get(n.id);
      if (!p) continue;
      const color = getKindColor(n.kind);
      const radius = Math.max(3, Math.min(8, (n.metrics?.complexity ?? 1) * 1.2));
      const isSelected = n.id === selectedId;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = isSelected ? 1 : 0.75;
      ctx.fill();
      if (isSelected) {
        ctx.strokeStyle = `${getVscodeColor("--vscode-editor-foreground", "#1f2328")}e6`; // ~0.9 alpha
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }, [nodes, edges, size, selectedId]);

  return (
    <canvas
      ref={canvasRef}
      width={size.w}
      height={size.h}
      className="w-full h-40 rounded-lg bg-vsc-editor-bg/50 cursor-pointer
                 border border-vsc-border/30 hover:border-vsc-border/50
                 transition-colors duration-normal"
      role="img"
      aria-label="Symbol dependency graph"
      onClick={handleClick}
    />
  );
});
