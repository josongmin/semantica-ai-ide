import React, { useCallback, useEffect, useId, useRef } from "react";

import { useMergeRefs, useOverlayBehavior } from "../../lib";
import { cn } from "../variants";
import { Icon } from "./Icon";
import { OverlayPortal } from "./OverlayPortal";

export type BottomSheetSnapPoint = "half" | "full";

export interface BottomSheetProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  /** Enable swipe-down-to-dismiss on the handle bar. Default: true */
  swipeDismiss?: boolean;
  /** Snap point heights. Default: ["full"] (75vh). "half" = 40vh. */
  snapPoints?: BottomSheetSnapPoint[];
}

const SNAP_HEIGHT: Record<BottomSheetSnapPoint, string> = {
  half: "max-h-[40vh]",
  full: "max-h-[75vh]",
};

/** Minimum swipe distance (px) to trigger dismiss */
const SWIPE_THRESHOLD = 80;
/** Minimum velocity (px/ms) for a fast fling dismiss */
const VELOCITY_THRESHOLD = 0.4;

/**
 * Mobile-style bottom sheet overlay.
 * SOTA++ features:
 * - Swipe-to-dismiss: drag the handle bar down to close
 * - Velocity-aware: fast fling dismisses even with short distance
 * - Snap points: "half" (40vh) and "full" (75vh) presets
 * - Spring animation on enter, smooth slide on exit
 * - Backdrop opacity tracks drag progress for visual feedback
 *
 * @example
 * ```tsx
 * <BottomSheet open={open} onClose={() => setOpen(false)} title="Options" icon="settings">
 *   <OptionList items={options} onSelect={handleSelect} />
 * </BottomSheet>
 * ```
 */
export const BottomSheet = React.memo(
  React.forwardRef<HTMLDivElement, BottomSheetProps>(function BottomSheet(
    {
      open,
      onClose,
      onOpenChange,
      title,
      icon,
      children,
      className,
      swipeDismiss = true,
      snapPoints = ["full"],
    },
    ref,
  ) {
    const titleId = useId();
    const sheetRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(ref, sheetRef);
    const dragState = useRef<{
      startY: number;
      startTime: number;
      currentY: number;
      dragging: boolean;
    } | null>(null);
    // Track pending transitionend listeners for cleanup on unmount
    const pendingCleanups = useRef<(() => void)[]>([]);
    useEffect(() => {
      return () => {
        for (const fn of pendingCleanups.current) fn();
        pendingCleanups.current = [];
      };
    }, []);

    const handleClose = useCallback(() => {
      if (onOpenChange) onOpenChange(false);
      else onClose?.();
    }, [onOpenChange, onClose]);

    const stableOnClose = handleClose;

    const { mounted, exiting, handleTabKeyDown } = useOverlayBehavior({
      id: `bottom-sheet-${titleId}`,
      type: "dialog",
      open,
      onClose: stableOnClose,
      containerRef: sheetRef,
      clickOutside: true,
      focusTrap: true,
      exitDurationMs: 180,
    });

    // ── Swipe gesture handlers ──
    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        if (!swipeDismiss) return;
        // Only initiate on the handle area (has cursor-grab)
        const target = e.target as HTMLElement;
        if (!target.closest("[data-sheet-handle]")) return;

        dragState.current = {
          startY: e.clientY,
          startTime: Date.now(),
          currentY: e.clientY,
          dragging: true,
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      },
      [swipeDismiss],
    );

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      const state = dragState.current;
      if (!state?.dragging) return;

      const deltaY = e.clientY - state.startY;
      state.currentY = e.clientY;

      // Only allow dragging downward
      const translateY = Math.max(0, deltaY);

      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.transform = `translateY(${translateY}px)`;
        sheet.style.transition = "none";
      }

      // Dim backdrop proportionally
      const backdrop = sheet?.parentElement?.querySelector<HTMLElement>("[data-sheet-backdrop]");
      if (backdrop) {
        const progress = Math.min(translateY / 300, 1);
        backdrop.style.opacity = String(1 - progress * 0.6);
      }
    }, []);

    const handlePointerUp = useCallback(
      (e: React.PointerEvent) => {
        const state = dragState.current;
        if (!state?.dragging) return;

        // Release pointer capture acquired in handlePointerDown
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // Already released or target detached — safe to ignore
        }

        const deltaY = e.clientY - state.startY;
        const elapsed = Date.now() - state.startTime;
        const velocity = deltaY / Math.max(elapsed, 1);

        dragState.current = null;

        const sheet = sheetRef.current;
        const backdrop = sheet?.parentElement?.querySelector<HTMLElement>("[data-sheet-backdrop]");

        // Dismiss if dragged far enough or flung fast enough
        if (deltaY > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
          if (sheet) {
            sheet.style.transition = "transform 180ms ease";
            sheet.style.transform = "translateY(100%)";
          }
          if (backdrop) {
            backdrop.style.transition = "opacity 180ms ease";
            backdrop.style.opacity = "0";
          }
          // Wait for animation then close
          setTimeout(() => {
            handleClose();
            // Reset styles
            if (sheet) {
              sheet.style.transform = "";
              sheet.style.transition = "";
            }
            if (backdrop) {
              backdrop.style.opacity = "";
              backdrop.style.transition = "";
            }
          }, 180);
        } else {
          // Snap back
          if (sheet) {
            sheet.style.transition = "transform 250ms var(--ease-spring)";
            sheet.style.transform = "translateY(0)";
            const sheetCleanup = () => {
              sheet.style.transform = "";
              sheet.style.transition = "";
              sheet.removeEventListener("transitionend", sheetCleanup);
              pendingCleanups.current = pendingCleanups.current.filter((f) => f !== removeSheet);
            };
            const removeSheet = () => sheet.removeEventListener("transitionend", sheetCleanup);
            pendingCleanups.current.push(removeSheet);
            sheet.addEventListener("transitionend", sheetCleanup);
          }
          if (backdrop) {
            backdrop.style.transition = "opacity 250ms ease";
            backdrop.style.opacity = "";
            const backdropCleanup = () => {
              backdrop.style.transition = "";
              backdrop.removeEventListener("transitionend", backdropCleanup);
              pendingCleanups.current = pendingCleanups.current.filter((f) => f !== removeBackdrop);
            };
            const removeBackdrop = () =>
              backdrop.removeEventListener("transitionend", backdropCleanup);
            pendingCleanups.current.push(removeBackdrop);
            backdrop.addEventListener("transitionend", backdropCleanup);
          }
        }
      },
      [handleClose],
    );

    // Reset drag state if pointer is cancelled (browser steals gesture, page visibility change, etc.)
    const handlePointerCancel = useCallback(() => {
      if (!dragState.current?.dragging) return;
      dragState.current = null;
      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.transform = "";
        sheet.style.transition = "";
      }
    }, []);

    if (!mounted) return null;

    const activeSnap = snapPoints[snapPoints.length - 1] ?? "full";

    return (
      <OverlayPortal>
        <div
          className={cn(
            "fixed inset-0 z-[--z-modal] flex flex-col justify-end",
            exiting ? "animate-[fade-out_180ms_ease]" : "animate-[fade-in_150ms_ease]",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          data-testid="bottom-sheet-backdrop"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-vsc-fg/40 backdrop-blur-[--blur-overlay]"
            aria-hidden
            data-sheet-backdrop
          />

          {/* Sheet */}
          <div
            ref={mergedRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={handleTabKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            tabIndex={-1}
            className={cn(
              "relative flex flex-col rounded-t-2xl border-t border-x border-vsc-border/60",
              "bg-vsc-bg shadow-sheet",
              SNAP_HEIGHT[activeSnap],
              "outline-none will-change-transform",
              exiting
                ? "animate-[slide-down-sheet_180ms_ease] pointer-events-none"
                : "animate-[slide-up-sheet_250ms_ease-out]",
              className,
            )}
          >
            {/* Handle bar — swipe grab target */}
            <div
              className={cn(
                "flex justify-center pt-2.5 pb-1",
                swipeDismiss && "cursor-grab active:cursor-grabbing",
              )}
              data-sheet-handle
            >
              <span className="w-9 h-1 rounded-full bg-vsc-fg/20" aria-hidden />
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 px-4 pb-2.5 border-b border-vsc-border/40">
              {icon && (
                <Icon name={icon} tokenSize="sm" className="text-vsc-text-secondary shrink-0" />
              )}
              <span
                id={titleId}
                className="flex-1 min-w-0 truncate text-sm font-semibold text-vsc-fg"
                title={title}
              >
                {title}
              </span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full shrink-0",
                  "text-vsc-text-tertiary hover:text-vsc-fg",
                  "hover:bg-vsc-surface-2 transition-colors duration-fast",
                  "focus-ring",
                )}
              >
                <Icon name="close" tokenSize="sm" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
          </div>
        </div>
      </OverlayPortal>
    );
  }),
);
