import React, { useCallback, useId, useRef } from "react";

import { useMergeRefs, useOverlayBehavior } from "../../lib";
import { cn } from "../variants";
import { Icon } from "./Icon";
import { OverlayPortal } from "./OverlayPortal";

export interface FeaturePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Centered modal panel for feature overlays.
 * Mobile-app-like experience: centered card with scale animation,
 * frosted backdrop, and smooth transitions.
 *
 * @example
 * ```tsx
 * <FeaturePanel open={open} onClose={() => setOpen(false)} title="Usage Dashboard" icon="chart">
 *   <UsageDashboard />
 * </FeaturePanel>
 * ```
 */
export const FeaturePanel = React.memo(
  React.forwardRef<HTMLDivElement, FeaturePanelProps>(function FeaturePanel(
    { open, onClose, title, icon, children, className },
    ref,
  ) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(ref, panelRef);

    const stableOnClose = useCallback(() => onClose(), [onClose]);

    const { mounted, exiting, handleTabKeyDown } = useOverlayBehavior({
      id: `feature-panel-${titleId}`,
      type: "dialog",
      open,
      onClose: stableOnClose,
      containerRef: panelRef,
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
            "fixed inset-0 z-[--z-modal] flex items-center justify-center p-4",
            exiting ? "animate-[fade-out_180ms_ease]" : "animate-[fade-in_150ms_ease]",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          data-testid="feature-panel-backdrop"
        >
          {/* Frosted backdrop */}
          <div
            className="absolute inset-0 bg-vsc-fg/50 backdrop-blur-[--blur-overlay]"
            aria-hidden
          />

          {/* Panel */}
          <div
            ref={mergedRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={handleTabKeyDown}
            tabIndex={-1}
            className={cn(
              "relative flex flex-col rounded-lg border border-vsc-border/60 overflow-hidden",
              "bg-vsc-bg shadow-panel",
              "w-full max-w-lg min-h-[40vh] max-h-[calc(100vh-2rem)] outline-none",
              exiting
                ? "animate-[scale-out_180ms_ease]"
                : "animate-[scale-in_200ms_var(--ease-spring)]",
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-vsc-border/40">
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
                aria-label="Close"
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

            {/* Content — flex fill, children manage own scroll */}
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">{children}</div>
          </div>
        </div>
      </OverlayPortal>
    );
  }),
);
