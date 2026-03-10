import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { useFloatingPosition } from "../../lib";
import { cn } from "../variants";
import { OverlayPortal } from "./OverlayPortal";

export type HoverCardPlacement = "top" | "bottom";

export interface HoverCardProps {
  /** Delay before showing (ms). Default: 300 */
  openDelay?: number;
  /** Delay before hiding after pointer leaves (ms). Default: 200 */
  closeDelay?: number;
  /** Preferred placement. Auto-flips if insufficient space. Default: "bottom" */
  placement?: HoverCardPlacement;
  /** Card content (interactive — can contain buttons, links, etc.) */
  content: React.ReactNode;
  /** Maximum width. Default: 320px */
  maxWidth?: number;
  children: React.ReactElement;
  className?: string;
}

const GAP = 8;

/**
 * Interactive hover card — richer than Tooltip, supports interactive content.
 * SOTA+++ features:
 * - Pointer bridge: safe area covers full gap between trigger and card (not just trigger width)
 * - Hover intent: configurable open/close delay prevents accidental triggers
 * - Auto-flip: 4-direction fallback via shared engine
 * - Auto-repositioning on scroll/resize
 * - Proper ARIA: aria-haspopup + aria-expanded on trigger
 *
 * @example
 * ```tsx
 * <HoverCard
 *   placement="bottom"
 *   content={<UserProfileCard userId={user.id} />}
 * >
 *   <span className="underline cursor-pointer">{user.name}</span>
 * </HoverCard>
 * ```
 */
export const HoverCard = React.memo(function HoverCard({
  openDelay = 300,
  closeDelay = 200,
  placement = "bottom",
  content,
  maxWidth = 320,
  children,
  className,
}: HoverCardProps) {
  const cardId = useId();
  const [visible, setVisible] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      clearTimeout(openTimerRef.current);
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  const scheduleOpen = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(() => setVisible(true), openDelay);
  }, [openDelay]);

  const scheduleClose = useCallback(() => {
    clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => setVisible(false), closeDelay);
  }, [closeDelay]);

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimerRef.current);
  }, []);

  // Escape dismiss — bubble phase, no stopPropagation.
  // HoverCards are non-modal and should not intercept Escape from stack-managed overlays.
  useEffect(() => {
    if (!visible) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVisible(false);
        clearTimeout(openTimerRef.current);
        clearTimeout(closeTimerRef.current);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [visible]);

  // Shared positioning engine
  const { position, positioned: ready } = useFloatingPosition({
    anchorRef: triggerRef,
    floatingRef: cardRef,
    placement,
    gap: GAP,
    open: visible,
    mounted: visible,
  });
  const { top, left } = position;

  // Pointer bridge: covers the full gap between trigger and card (wider than trigger)
  // Uses ref + direct DOM mutation to avoid setState-in-effect lint error
  const bridgeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return;

    if (!visible || !ready) {
      bridge.style.cssText = "";
      return;
    }
    const trigger = triggerRef.current;
    const card = cardRef.current;
    if (!trigger || !card) {
      bridge.style.cssText = "";
      return;
    }

    const tRect = trigger.getBoundingClientRect();
    const cRect = card.getBoundingClientRect();
    const bridgeLeft = Math.min(tRect.left, cRect.left);
    const bridgeRight = Math.max(tRect.right, cRect.right);
    const bridgeWidth = bridgeRight - bridgeLeft;
    // Determine actual placement by comparing card and trigger positions
    const isAbove = cRect.bottom <= tRect.top + 1;
    const bridgeTop = isAbove ? tRect.top - GAP : tRect.bottom;

    bridge.style.cssText = `position:fixed;left:${bridgeLeft}px;top:${bridgeTop}px;width:${bridgeWidth}px;height:${GAP}px`;
  }, [visible, ready]);

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-flex"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
        aria-haspopup="true"
        aria-expanded={visible}
        aria-controls={visible ? cardId : undefined}
      >
        {children}
      </span>
      {visible && (
        <OverlayPortal>
          <>
            {/* Pointer bridge — prevents flicker when moving between trigger and card */}
            <div ref={bridgeRef} onMouseEnter={cancelClose} aria-hidden />
            {/* Card */}
            <div
              ref={cardRef}
              id={cardId}
              role="dialog"
              aria-modal="false"
              style={{ position: "fixed", top, left, maxWidth }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className={cn(
                "z-[--z-overlay] rounded-lg",
                "bg-vsc-surface-2 border border-vsc-border/50 shadow-lg",
                ready ? "animate-[scale-in_150ms_var(--ease-spring)]" : "opacity-0",
                className,
              )}
            >
              {content}
            </div>
          </>
        </OverlayPortal>
      )}
    </>
  );
});
