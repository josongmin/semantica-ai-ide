import React, { useCallback, useRef, useState } from "react";

import { cn } from "~shared/ui";

// ─── Types ──────────────────────────────────────────────

interface ResizableProps {
  direction: "horizontal" | "vertical";
  onResize: (delta: number) => void;
  className?: string;
}

// ─── Component ──────────────────────────────────────────

/**
 * Drag handle for resizing panels.
 * SOTA++ features: wider hover zone, accent glow on drag, animated indicator dot.
 */
export const ResizeHandle = React.memo(function ResizeHandle({
  direction,
  onResize,
  className,
}: ResizableProps) {
  const startRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startRef.current = direction === "horizontal" ? e.clientX : e.clientY;
      setDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const current = direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const delta = current - startRef.current;
        startRef.current = current;
        onResize(delta);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setDragging(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [direction, onResize],
  );

  const handleDoubleClick = useCallback(() => {
    // Double-click collapses to minimum or restores — emit large negative delta
    onResize(-9999);
  }, [onResize]);

  const isHz = direction === "horizontal";

  return (
    <div
      role="separator"
      aria-orientation={direction}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "shrink-0 relative group",
        "transition-[background-color] duration-fast",
        isHz ? "w-px cursor-col-resize" : "h-px cursor-row-resize",
        // Base color
        dragging ? "bg-vsc-accent/60" : "bg-vsc-border/15 hover:bg-vsc-accent/30",
        className,
      )}
    >
      {/* Wider invisible hit area */}
      <div
        className={cn(
          "absolute z-10",
          isHz
            ? "inset-y-0 -left-1 -right-1 cursor-col-resize"
            : "inset-x-0 -top-1 -bottom-1 cursor-row-resize",
        )}
      />
      {/* Center indicator dot — appears on hover/drag */}
      <div
        className={cn(
          "absolute rounded-full transition-[opacity,background-color,transform] duration-normal",
          "bg-vsc-accent/50 opacity-0 group-hover:opacity-100",
          dragging && "opacity-100 bg-vsc-accent scale-125",
          isHz
            ? "w-1 h-6 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            : "h-1 w-6 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
      />
    </div>
  );
});

/** @deprecated Use ResizeHandle instead */
export const Resizable = ResizeHandle;
