import React, { useCallback, useId, useRef } from "react";

import { useMergeRefs, useOverlayBehavior } from "../../lib";
import { cn } from "../variants";
import { OverlayPortal } from "./OverlayPortal";

export interface AlertDialogProps {
  open: boolean;
  title: string;
  description?: string;
  className?: string;
  /** Must include action button(s) — AlertDialog cannot be dismissed by Escape or backdrop. */
  children: React.ReactNode;
}

/**
 * Non-dismissible modal dialog (WAI-ARIA alertdialog).
 * Cannot be closed by Escape or backdrop click — only explicit action buttons.
 * Uses role="alertdialog" + aria-modal="true".
 *
 * @example
 * ```tsx
 * <AlertDialog open={hasUnsavedChanges} title="Unsaved changes">
 *   <p>You have unsaved changes. Discard them?</p>
 *   <Button onClick={handleDiscard}>Discard</Button>
 *   <Button onClick={handleSave}>Save</Button>
 * </AlertDialog>
 * ```
 */
export const AlertDialog = React.memo(
  React.forwardRef<HTMLDivElement, AlertDialogProps>(function AlertDialog(
    { open, title, description, className, children },
    ref,
  ) {
    const titleId = useId();
    const descId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(ref, dialogRef);

    // --- Overlay hooks ---
    // dismiss: null → AlertDialog can't be dismissed from the stack
    const { mounted, exiting, handleTabKeyDown } = useOverlayBehavior({
      id: `alertdialog-${titleId}`,
      type: "alert-dialog",
      open,
      onClose: null,
      containerRef: dialogRef,
      escape: false,
      bodyLock: true,
      focusTrap: true,
    });

    // Consume Escape at capture phase to prevent any other overlay from handling it
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        handleTabKeyDown(e);
      },
      [handleTabKeyDown],
    );

    if (!mounted) return null;

    return (
      <OverlayPortal>
        <div
          className={cn(
            "fixed inset-0 z-[--z-modal] flex items-center justify-center bg-vsc-fg/50 backdrop-blur-[--blur-overlay]",
            exiting ? "animate-[fade-out_150ms_ease]" : "animate-[fade-in_150ms_ease]",
          )}
          data-testid="alertdialog-backdrop"
        >
          <div
            ref={mergedRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className={cn(
              "bg-vsc-surface-2 border border-vsc-border/50 rounded-lg shadow-lg",
              "max-w-md w-[calc(100%-2rem)] mx-4 p-4",
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
