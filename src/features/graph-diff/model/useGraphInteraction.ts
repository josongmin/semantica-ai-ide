/**
 * useGraphInteraction — zoom, pan, and node selection logic for the graph diff overlay.
 */
import { useCallback, useRef, useState } from "react";

import type { WorkspaceGraphNodeId } from "../../../shared/protocol/types/core";

// ─── Types ─────────────────────────────────────────────────

export interface ViewBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DragState {
  readonly isDragging: boolean;
  readonly startX: number;
  readonly startY: number;
}

const DEFAULT_VIEWBOX: ViewBox = { x: 0, y: 0, width: 1000, height: 700 };
const ZOOM_FACTOR = 0.1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

// ─── Hook ──────────────────────────────────────────────────

export function useGraphInteraction() {
  const [viewBox, setViewBox] = useState<ViewBox>(DEFAULT_VIEWBOX);
  const [selectedNodeId, setSelectedNodeId] = useState<WorkspaceGraphNodeId | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<WorkspaceGraphNodeId | null>(null);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<DragState>({ isDragging: false, startX: 0, startY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + direction * ZOOM_FACTOR));
      const ratio = nextZoom / zoom;

      setZoom(nextZoom);
      setViewBox((vb) => ({
        x: vb.x,
        y: vb.y,
        width: vb.width / ratio,
        height: vb.height / ratio,
      }));
    },
    [zoom],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY };
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.isDragging) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY };

      setViewBox((vb) => ({
        ...vb,
        x: vb.x - dx / zoom,
        y: vb.y - dy / zoom,
      }));
    },
    [zoom],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = { isDragging: false, startX: 0, startY: 0 };
  }, []);

  const selectNode = useCallback((nodeId: WorkspaceGraphNodeId | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const hoverNode = useCallback((nodeId: WorkspaceGraphNodeId | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  const resetView = useCallback(() => {
    setViewBox(DEFAULT_VIEWBOX);
    setZoom(1);
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  }, []);

  const zoomIn = useCallback(() => {
    const nextZoom = Math.min(MAX_ZOOM, zoom + ZOOM_FACTOR * 2);
    const ratio = nextZoom / zoom;
    setZoom(nextZoom);
    setViewBox((vb) => ({
      x: vb.x,
      y: vb.y,
      width: vb.width / ratio,
      height: vb.height / ratio,
    }));
  }, [zoom]);

  const zoomOut = useCallback(() => {
    const nextZoom = Math.max(MIN_ZOOM, zoom - ZOOM_FACTOR * 2);
    const ratio = nextZoom / zoom;
    setZoom(nextZoom);
    setViewBox((vb) => ({
      x: vb.x,
      y: vb.y,
      width: vb.width / ratio,
      height: vb.height / ratio,
    }));
  }, [zoom]);

  return {
    viewBox,
    zoom,
    selectedNodeId,
    hoveredNodeId,
    containerRef,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    selectNode,
    hoverNode,
    resetView,
    zoomIn,
    zoomOut,
  } as const;
}
