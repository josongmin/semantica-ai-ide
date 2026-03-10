import React, { useCallback, useId, useRef } from "react";

import { useMergeRefs, useOverlayBehavior } from "../../lib";
import { cn } from "../variants";
import { OverlayPortal } from "./OverlayPortal";

export interface ModalOverlayProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  /** Links to a visible title element for screen readers. */
  "aria-labelledby"?: string;
  "aria-label"?: string;
  className?: string;
  "data-testid"?: string;
}

/**
 * Full-screen modal overlay with SOTA accessibility.
 * - Overlay-stack-aware ESC dismiss (only topmost responds)
 * - Focus trap with auto-focus + restore
 * - Reference-counted body scroll lock
 * - Exit animation support
 *
 * @example
 * ```tsx
 * <ModalOverlay open={open} onClose={() => setOpen(false)} aria-label="Confirm action">
 *   <ConfirmCard />
 * </ModalOverlay>
 * ```
 */
export const ModalOverlay = React.memo(
  React.forwardRef<HTMLDivElement, ModalOverlayProps>(function ModalOverlay(
    {
      children,
      open,
      onClose,
      "aria-labelledby": ariaLabelledBy,
      "aria-label": ariaLabel,
      className,
      ...props
    },
    ref,
  ) {
    const overlayId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(ref, containerRef);

    const stableOnClose = useCallback(() => onClose(), [onClose]);

    const { mounted, exiting, handleTabKeyDown } = useOverlayBehavior({
      id: `modal-overlay-${  overlayId}`,
      type: "dialog",
      open,
      onClose: stableOnClose,
      containerRef,
      clickOutside: true,
      bodyLock: true,
      focusTrap: true,
      exitDurationMs: 180,
    });

    if (!mounted) return null;

    return (
      <OverlayPortal>
        <div
          ref={mergedRef}
          role="dialog"
          aria-modal
          aria-labelledby={ariaLabelledBy}
          aria-label={!ariaLabelledBy ? ariaLabel : undefined}
          tabIndex={-1}
          onKeyDown={handleTabKeyDown}
          className={cn(
            "fixed inset-0 z-[--z-modal] flex flex-col items-center outline-none",
            exiting ? "animate-[fade-out_180ms_ease]" : "animate-[fade-in_150ms_ease]",
            className,
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          {...props}
        >
          {children}
        </div>
      </OverlayPortal>
    );
  }),
);
