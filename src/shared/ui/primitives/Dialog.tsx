import React, { useCallback, useId, useRef } from "react";

import { useMergeRefs, useOverlayBehavior } from "../../lib";
import { cn } from "../variants";
import { OverlayPortal } from "./OverlayPortal";

const MAX_WIDTH_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  maxWidth?: keyof typeof MAX_WIDTH_CLASSES;
  className?: string;
  children: React.ReactNode;
}

/**
 * Accessible modal dialog with portal, backdrop, focus trap, and Escape dismiss.
 * Uses aria-modal + role="dialog" for screen reader compatibility.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Dialog open={open} onClose={() => setOpen(false)} title="Confirm action">
 *   <p>Are you sure you want to proceed?</p>
 *   <Button onClick={() => setOpen(false)}>OK</Button>
 * </Dialog>
 * ```
 */
export const Dialog = React.memo(
  React.forwardRef<HTMLDivElement, DialogProps>(function Dialog(
    { open, onClose, onOpenChange, title, description, maxWidth = "md", className, children },
    ref,
  ) {
    const titleId = useId();
    const descId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(ref, dialogRef);

    // --- Overlay hooks ---
    const handleClose = useCallback(() => {
      if (onOpenChange) onOpenChange(false);
      else onClose?.();
    }, [onOpenChange, onClose]);

    const stableOnClose = handleClose;

    const { mounted, exiting, handleTabKeyDown } = useOverlayBehavior({
      id: `dialog-${  titleId}`,
      type: "dialog",
      open,
      onClose: stableOnClose,
      containerRef: dialogRef,
      bodyLock: true,
      focusTrap: true,
    });

    if (!mounted) return null;

    return (
      <OverlayPortal>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-[--z-modal] flex items-center justify-center bg-vsc-fg/50 backdrop-blur-[2px]",
            exiting ? "animate-[fade-out_150ms_ease]" : "animate-[fade-in_150ms_ease]",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          data-testid="dialog-backdrop"
        >
          {/* Dialog panel */}
          <div
            ref={mergedRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            onKeyDown={handleTabKeyDown}
            tabIndex={-1}
            className={cn(
              "bg-vsc-surface-2 border border-vsc-border/50 rounded-lg shadow-lg",
              MAX_WIDTH_CLASSES[maxWidth],
              "w-[calc(100%-2rem)] mx-4 p-4",
              "will-change-transform",
              exiting
                ? "animate-[scale-out_150ms_ease] pointer-events-none"
                : "animate-[scale-in_150ms_ease]",
              "outline-none",
              className,
            )}
          >
            <h2 id={titleId} className="text-base font-semibold text-vsc-fg mb-1">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-vsc-text-secondary mb-3">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
      </OverlayPortal>
    );
  }),
);
