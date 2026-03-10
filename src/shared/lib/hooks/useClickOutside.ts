import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { useAtomValue } from "jotai";

import { topOverlayAtom } from "../atoms";

/**
 * Dismiss on outside click (mousedown).
 *
 * SOTA+++ improvements:
 * - **Stack-aware**: only the topmost overlay responds to click-outside,
 *   preventing nested overlays from dismissing their parents simultaneously.
 * - Callback ref avoids event listener churn on unstable callbacks.
 *
 * @param overlayId — overlay stack ID. When provided, click-outside only fires
 *   if this overlay is the topmost in the stack. Pass undefined to opt out of
 *   stack awareness (backwards-compatible for non-stack overlays).
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  active: boolean,
  excludeRef?: RefObject<HTMLElement | null>,
  overlayId?: string,
): void {
  const callbackRef = useRef(onClickOutside);
  useLayoutEffect(() => {
    callbackRef.current = onClickOutside;
  });

  const topOverlay = useAtomValue(topOverlayAtom);
  const topOverlayRef = useRef(topOverlay);
  useLayoutEffect(() => {
    topOverlayRef.current = topOverlay;
  });

  const overlayIdRef = useRef(overlayId);
  useLayoutEffect(() => {
    overlayIdRef.current = overlayId;
  });

  useEffect(() => {
    if (!active) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      if (excludeRef?.current?.contains(e.target as Node)) return;

      // Stack-aware: only topmost overlay responds to click-outside
      const id = overlayIdRef.current;
      if (id !== undefined && topOverlayRef.current?.id !== id) return;

      callbackRef.current();
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [active, ref, excludeRef]);
}
