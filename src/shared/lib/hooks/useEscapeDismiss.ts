import { useEffect, useLayoutEffect, useRef } from "react";
import { useAtomValue } from "jotai";

import { topOverlayAtom } from "../atoms";

/**
 * Escape key dismissal — only fires for the topmost overlay (LIFO).
 * Replaces the duplicated document.addEventListener("keydown") pattern.
 *
 * Uses refs for both callback and topOverlay so the event listener is
 * subscribed once per active/id change — not re-subscribed O(n) times
 * whenever any overlay in the stack changes.
 */
export function useEscapeDismiss(id: string, active: boolean, onDismiss: () => void): void {
  const topOverlay = useAtomValue(topOverlayAtom);
  const onDismissRef = useRef(onDismiss);
  useLayoutEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const topOverlayRef = useRef(topOverlay);
  useLayoutEffect(() => {
    topOverlayRef.current = topOverlay;
  });

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (topOverlayRef.current?.id !== id) return;
      e.stopPropagation();
      onDismissRef.current();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, id]);
}
