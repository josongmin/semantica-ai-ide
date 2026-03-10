import React, { type RefObject, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { useFloatingPosition, useOverlayBehavior } from "../../lib";
import { computePlacement } from "../../lib/hooks/floating/computePlacement";
import { shiftStrategy } from "../../lib/hooks/floating/shiftStrategy";
import { cn } from "../variants";

export type PopoverPlacement = "top" | "bottom" | "left" | "right";
export type PopoverAlign = "start" | "center" | "end";

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  placement?: PopoverPlacement;
  align?: PopoverAlign;
  className?: string;
  children: React.ReactNode;
}

/**
 * Portal-based floating panel anchored to a reference element.
 * Interactive content (unlike Tooltip). Uses overlay stack for proper stacking.
 */
export const Popover = React.memo(function Popover({
  open,
  onClose,
  anchorRef,
  placement = "bottom",
  align = "center",
  className,
  children,
}: PopoverProps) {
  const popoverId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);

  // --- Overlay hooks ---
  const { mounted, exiting } = useOverlayBehavior({
    id: `popover-${  popoverId}`,
    type: "popover",
    open,
    onClose,
    containerRef: popoverRef,
    clickOutside: true,
  });

  // --- Floating position ---
  const { position, positioned } = useFloatingPosition({
    open,
    mounted,
    anchorRef,
    floatingRef: popoverRef,
    placement,
    align,
  });

  if (!mounted) return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      data-testid="popover"
      style={{ position: "fixed", top: position.top, left: position.left }}
      className={cn(
        "z-[--z-overlay]",
        "bg-vsc-surface-2 border border-vsc-border rounded-lg shadow-lg p-3",
        // eslint-disable-next-line no-nested-ternary -- animation state is a 3-way condition
        !positioned && !exiting ? "opacity-0" : exiting ? "animate-[fade-out_150ms_ease]" : "animate-[fade-in_150ms_ease]",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
});

/**
 * Backward-compatible wrapper matching the old `_computePosition` signature
 * used by Popover tests. Delegates to the decomposed floating strategies.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- exported as _computePosition for backward compatibility
function _computePositionCompat(
  anchor: DOMRect,
  popover: DOMRect,
  placement: "top" | "bottom" | "left" | "right",
  align: "start" | "center" | "end",
) {
  const raw = computePlacement({ anchor, floating: popover, placement, align });
  return shiftStrategy({ position: raw, floating: popover });
}

// eslint-disable-next-line react-refresh/only-export-components -- backward-compat helper used by Popover tests
export { _computePositionCompat as _computePosition };
