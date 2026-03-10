/**
 * useFloatingWindowDrag — Title-bar drag with snap-to-edge detection
 *
 * Returns a mouseDown handler meant for the title bar element.
 * During drag it moves the window via `moveFloatingWindowAtom`,
 * and on drop it commits a snap if the cursor was near a viewport edge.
 */

import { useCallback } from "react";
import { useSetAtom } from "jotai";

import {
  bringToFrontAtom,
  type FloatingWindowPosition,
  type FloatingWindowSize,
  moveFloatingWindowAtom,
  type SnapEdge,
  snapFloatingWindowAtom,
} from "../model/floatingAtoms";
import { detectSnapEdge } from "../model/floatingGeometry";

interface UseFloatingWindowDragOptions {
  viewId: string;
  position: FloatingWindowPosition;
  size: FloatingWindowSize;
}

export function useFloatingWindowDrag({ viewId, position, size }: UseFloatingWindowDragOptions) {
  const bringToFront = useSetAtom(bringToFrontAtom);
  const moveWindow = useSetAtom(moveFloatingWindowAtom);
  const snap = useSetAtom(snapFloatingWindowAtom);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      bringToFront(viewId);

      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = { ...position };
      let pendingSnap: SnapEdge = null;

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;

        // Clamp to viewport bounds (keep at least 48px visible)
        const minVisible = 48;
        const clampedX = Math.max(
          -size.width + minVisible,
          Math.min(window.innerWidth - minVisible, startPos.x + dx),
        );
        const clampedY = Math.max(
          0,
          Math.min(window.innerHeight - minVisible, startPos.y + dy),
        );

        moveWindow({ viewId, position: { x: clampedX, y: clampedY } });

        // Track snap edge for commit on mouseUp (don't apply yet)
        pendingSnap = detectSnapEdge(me.clientX, me.clientY);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Commit snap on drop (if near an edge)
        if (pendingSnap) {
          snap({ viewId, edge: pendingSnap });
        }
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    },
    [bringToFront, moveWindow, snap, viewId, position, size.width],
  );

  return handleDragStart;
}
