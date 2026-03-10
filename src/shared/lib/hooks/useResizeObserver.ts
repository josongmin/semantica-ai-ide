import { type RefObject, useEffect, useRef, useState } from "react";

export interface ResizeEntry {
  width: number;
  height: number;
}

/**
 * Observes an element's size via ResizeObserver.
 *
 * Returns the current `{ width, height }` of the target element,
 * updated whenever the element resizes.
 *
 * Uses `contentBoxSize` when available, falling back to
 * `contentRect` for broader browser support.
 */
export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T | null>,
): ResizeEntry | null {
  const [size, setSize] = useState<ResizeEntry | null>(null);
  const prevRef = useRef<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      let width: number;
      let height: number;

      if (entry.contentBoxSize.length > 0) {
        const box = entry.contentBoxSize[0] as ResizeObserverSize | undefined;
        if (box === undefined) return;
        ({ inlineSize: width, blockSize: height } = box);
      } else {
        ({ width, height } = entry.contentRect);
      }

      // Only update state if size actually changed (avoid unnecessary renders)
      const prev = prevRef.current;
      if (prev?.w === width && prev.h === height) return;

      prevRef.current = { w: width, h: height };
      setSize({ width, height });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
