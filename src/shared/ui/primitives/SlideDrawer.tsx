import React, { useCallback, useId, useRef } from "react";

import { useMergeRefs, useOverlayBehavior } from "../../lib";
import { cn } from "../variants";
import { Icon } from "./Icon";
import { OverlayPortal } from "./OverlayPortal";

const WIDTH_CLASSES = {
  sm: "w-[320px] max-w-[calc(100vw-2rem)]",
  md: "w-[400px] max-w-[calc(100vw-2rem)]",
  lg: "w-[520px] max-w-[calc(100vw-2rem)]",
  xl: "w-[640px] max-w-[calc(100vw-2rem)]",
  full: "w-screen",
} as const;

export interface SlideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  /** Which edge the drawer slides from. Default: "right" */
  side?: "left" | "right";
  /** Drawer width preset. Default: "md" */
  width?: keyof typeof WIDTH_CLASSES;
  children: React.ReactNode;
  className?: string;
}

const ENTER_ANIM = {
  left: "animate-[slide-in-left_250ms_var(--ease-spring)]",
  right: "animate-[slide-in-from-right_250ms_var(--ease-spring)]",
} as const;

const EXIT_ANIM = {
  left: "animate-[slide-out-left_180ms_ease]",
  right: "animate-[slide-out-to-right_180ms_ease]",
} as const;

/**
 * Slide-in drawer panel from left or right edge.
 * Portal-rendered with backdrop, focus trap, ESC dismiss, and body scroll lock.
 * Uses overlay stack for proper z-ordering with other overlays.
 *
 * SOTA++ features:
 * - Spring easing on enter, smooth ease on exit
 * - Frosted backdrop with blur
 * - Proper focus trap + focus restore
 * - Reference-counted body scroll lock
 *
 * @example
 * ```tsx
 * <SlideDrawer open={open} onClose={() => setOpen(false)} title="Inspector" icon="search" side="right" width="lg">
 *   <InspectorContent data={inspectorData} />
 * </SlideDrawer>
 * ```
 */
export const SlideDrawer = React.memo(
  React.forwardRef<HTMLDivElement, SlideDrawerProps>(function SlideDrawer(
    { open, onClose, title, icon, side = "right", width = "md", children, className },
    ref,
  ) {
    const titleId = useId();
    const drawerRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(ref, drawerRef);

    const stableOnClose = useCallback(() => onClose(), [onClose]);

    const { mounted, exiting, handleTabKeyDown } = useOverlayBehavior({
      id: `drawer-${  titleId}`,
      type: "drawer",
      open,
      onClose: stableOnClose,
      containerRef: drawerRef,
      clickOutside: true,
      bodyLock: true,
      focusTrap: true,
      exitDurationMs: 180,
    });

    if (!mounted) return null;

    return (
      <OverlayPortal>
        <div
          className={cn(
            "fixed inset-0 z-[--z-modal] flex",
            side === "left" ? "justify-start" : "justify-end",
            exiting ? "animate-[fade-out_180ms_ease]" : "animate-[fade-in_150ms_ease]",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          data-testid="drawer-backdrop"
        >
          {/* Frosted backdrop */}
          <div className="absolute inset-0 bg-vsc-fg/40 backdrop-blur-[2px]" aria-hidden />

          {/* Drawer panel */}
          <div
            ref={mergedRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={handleTabKeyDown}
            tabIndex={-1}
            className={cn(
              "relative flex flex-col h-full max-w-[calc(100vw-3rem)]",
              "bg-vsc-bg border-vsc-border/60 shadow-panel outline-none",
              side === "left" ? "border-r rounded-r-lg" : "border-l rounded-l-lg",
              WIDTH_CLASSES[width],
              "will-change-transform",
              exiting ? `${EXIT_ANIM[side]} pointer-events-none` : ENTER_ANIM[side],
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-vsc-border/40 shrink-0">
              {icon && (
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-vsc-button/10">
                  <Icon name={icon} tokenSize="sm" className="text-vsc-button" />
                </div>
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
                onClick={onClose}
                aria-label="Close drawer"
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
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
