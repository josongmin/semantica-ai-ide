/**
 * useResizableSidebar — extracted from TerminalPanel
 *
 * Manages the resizable sidebar drag interaction:
 * - Pointer-based drag to resize
 * - Direct DOM mutation during drag for zero re-renders
 * - Commits final width to React state on pointer up
 * - Cleanup on unmount (safety net for mid-drag unmount)
 */

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ──────────────────────────────────────────────
const SIDEBAR_MIN = 100;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 160;

export function useResizableSidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const sidebarWidthRef = useRef(SIDEBAR_DEFAULT);
  const sidebarElRef = useRef<HTMLDivElement>(null);
  const rafId = useRef(0);

  // Cleanup on unmount (safety net for mid-drag unmount)
  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  const handleResizePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidthRef.current;

    const cleanup = () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // Commit final width to React state (single render)
      setSidebarWidth(sidebarWidthRef.current);
    };

    const onPointerMove = (ev: globalThis.PointerEvent) => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const delta = startX - ev.clientX;
        const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + delta));
        sidebarWidthRef.current = next;
        // Direct DOM mutation — zero React re-renders during drag
        if (sidebarElRef.current) sidebarElRef.current.style.width = `${next}px`;
      });
    };

    const onPointerUp = () => cleanup();

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  return {
    sidebarWidth,
    sidebarElRef,
    handleResizePointerDown,
  } as const;
}
