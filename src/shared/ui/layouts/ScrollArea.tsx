import React, { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "../variants";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  /** Called when scroll position changes relative to bottom */
  onAtBottomChange?: (atBottom: boolean) => void;
  /** Threshold (px) for "at bottom" detection. Default: 50 */
  threshold?: number;
}

/**
 * Scroll container with bottom-detection.
 * Exposes onAtBottomChange callback for auto-scroll / "scroll to bottom" UX.
 */
export const ScrollArea = React.memo(
  React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
    { children, className, onAtBottomChange, threshold = 50 },
    forwardedRef,
  ) {
    const internalRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    // Ref for callback to avoid stale closure in scroll handler
    const onAtBottomChangeRef = useRef(onAtBottomChange);
    useEffect(() => {
      onAtBottomChangeRef.current = onAtBottomChange;
    }, [onAtBottomChange]);

    // Store forwardedRef in a ref so mergedRef identity is stable
    const forwardedRefRef = useRef(forwardedRef);
    useEffect(() => {
      forwardedRefRef.current = forwardedRef;
    }, [forwardedRef]);

    // Merge forwarded ref (object or callback) with internal ref
    const mergedRef = useCallback((node: HTMLDivElement | null) => {
      (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      const fRef = forwardedRefRef.current;
      if (typeof fRef === "function") {
        fRef(node);
      } else if (fRef) {
        (fRef).current = node;
      }
    }, []);

    const handleScroll = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = distance < threshold;
      setIsAtBottom((prev) => {
        if (prev !== atBottom) {
          onAtBottomChangeRef.current?.(atBottom);
        }
        return atBottom;
      });
    }, [threshold]);

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return (
      <div ref={mergedRef} className={cn("overflow-y-auto", className)} data-at-bottom={isAtBottom}>
        {children}
      </div>
    );
  }),
);
