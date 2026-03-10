import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { useFloatingPosition } from "../../lib";
import type { Placement } from "../../lib/hooks/useFloatingPosition";
import { cn } from "../variants";
import { OverlayPortal } from "./OverlayPortal";

export interface TooltipProps {
  content: string;
  delay?: number;
  /** Preferred placement. Auto-flips when insufficient space. */
  position?: Placement;
  children: React.ReactElement;
}

/**
 * Lightweight tooltip with SOTA+++ positioning.
 * - Auto-flip: 4-direction fallback via shared engine
 * - Shift: cross-axis clamping prevents overflow
 * - Auto-repositioning on scroll/resize
 * - Supports all 4 placements (top/bottom/left/right)
 *
 * @example
 * ```tsx
 * <Tooltip content="Save changes" position="bottom">
 *   <button onClick={handleSave}>Save</button>
 * </Tooltip>
 * ```
 */
export const Tooltip = React.memo(function Tooltip({
  content,
  delay = 400,
  position = "top",
  children,
}: TooltipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(exitTimerRef.current);
    };
  }, []);

  const show = useCallback(() => {
    setClosing(false);
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const completeClose = useCallback(() => {
    setClosing(false);
    setVisible(false);
  }, []);

  const visibleRef = useRef(false);
  useLayoutEffect(() => {
    visibleRef.current = visible;
  });

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(exitTimerRef.current);
    if (visibleRef.current) {
      setClosing(true);
      // Safety fallback: JSDOM doesn't fire onAnimationEnd
      exitTimerRef.current = setTimeout(completeClose, 120);
    }
    setVisible(false);
  }, [completeClose]);

  const handleExitAnimationEnd = useCallback(() => {
    if (closing) completeClose();
  }, [closing, completeClose]);

  // Escape dismiss — bubble phase, no stopPropagation.
  // Tooltips are non-modal and should not intercept Escape from stack-managed overlays.
  useEffect(() => {
    if (!visible) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [visible, hide]);

  // Shared positioning engine
  const mounted = visible || closing;
  const { position: floatingPos, positioned: ready } = useFloatingPosition({
    anchorRef: wrapperRef,
    floatingRef: tooltipRef,
    placement: position,
    gap: 6,
    open: visible,
    mounted,
  });
  const { top, left } = floatingPos;

  return (
    <>
      <span
        ref={wrapperRef}
        className="relative inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={visible ? tooltipId : undefined}
      >
        {children}
      </span>
      {mounted && content && (
        <OverlayPortal>
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            style={{ position: "fixed", top, left }}
            onAnimationEnd={handleExitAnimationEnd}
            className={cn(
              "z-[--z-tooltip] px-2 py-1 rounded-md",
              "bg-vsc-surface-3 text-vsc-fg text-2xs leading-tight",
              "max-w-[min(280px,calc(100vw-16px))] whitespace-normal shadow-md pointer-events-none",
              "border border-vsc-border",
              // eslint-disable-next-line no-nested-ternary -- animation state is a 3-way condition
              closing
                ? "animate-[fade-out_100ms_ease]"
                : ready
                  ? "animate-[fade-in_150ms_ease]"
                  : "opacity-0",
            )}
          >
            {content}
          </div>
        </OverlayPortal>
      )}
    </>
  );
});
