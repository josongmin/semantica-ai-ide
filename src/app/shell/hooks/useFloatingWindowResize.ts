/**
 * useFloatingWindowResize — 8-direction edge/corner resize with constraints
 *
 * Returns a handler factory: `(direction, mouseEvent) => void`
 * meant to be passed to resize-edge/corner elements via onMouseDown.
 * Clamps width/height to FLOATING_CONSTRAINTS.min/maxSize and corrects
 * position drift when resizing from north or west edges.
 */

import { useCallback } from "react";
import { useSetAtom } from "jotai";

import {
  bringToFrontAtom,
  FLOATING_CONSTRAINTS,
  type FloatingWindowPosition,
  type FloatingWindowSize,
  resizeFloatingWindowAtom,
} from "../model/floatingAtoms";

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface UseFloatingWindowResizeOptions {
  viewId: string;
  position: FloatingWindowPosition;
  size: FloatingWindowSize;
}

export function useFloatingWindowResize({
  viewId,
  position,
  size,
}: UseFloatingWindowResizeOptions) {
  const bringToFront = useSetAtom(bringToFrontAtom);
  const resizeWindow = useSetAtom(resizeFloatingWindowAtom);

  const handleResizeStart = useCallback(
    (direction: ResizeDirection, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      bringToFront(viewId);

      const startX = e.clientX;
      const startY = e.clientY;
      const startSize = { ...size };
      const startPos = { ...position };

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;

        let newWidth = startSize.width;
        let newHeight = startSize.height;
        let newX = startPos.x;
        let newY = startPos.y;

        if (direction.includes("e")) newWidth = startSize.width + dx;
        if (direction.includes("w")) {
          newWidth = startSize.width - dx;
          newX = startPos.x + dx;
        }
        if (direction.includes("s")) newHeight = startSize.height + dy;
        if (direction.includes("n")) {
          newHeight = startSize.height - dy;
          newY = startPos.y + dy;
        }

        // Clamp
        const { minSize, maxSize } = FLOATING_CONSTRAINTS;
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, newWidth));
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, newHeight));

        // Prevent position drift when hitting min/max
        if (direction.includes("w")) {
          newX = startPos.x + (startSize.width - newWidth);
        }
        if (direction.includes("n")) {
          newY = startPos.y + (startSize.height - newHeight);
        }

        resizeWindow({
          viewId,
          size: { width: newWidth, height: newHeight },
          position: { x: newX, y: newY },
        });
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.userSelect = "none";
    },
    [bringToFront, resizeWindow, viewId, size, position],
  );

  return handleResizeStart;
}
