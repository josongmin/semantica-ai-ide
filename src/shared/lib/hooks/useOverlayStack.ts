import { useEffect, useLayoutEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { type OverlayEntry, popOverlayAtom, pushOverlayAtom, topOverlayAtom } from "../atoms";

interface UseOverlayStackReturn {
  /** Whether this overlay is the topmost in the stack */
  isTop: boolean;
}

/**
 * Registers an overlay in the centralized LIFO stack.
 * Every overlay component calls this on mount/unmount for proper stacking.
 *
 * Uses a ref for `dismiss` to avoid pop/push churn when the caller
 * passes an unstable callback (new reference each render).
 */
export function useOverlayStack(
  id: string,
  type: OverlayEntry["type"],
  active: boolean,
  dismiss: (() => void) | null,
): UseOverlayStackReturn {
  const pushOverlay = useSetAtom(pushOverlayAtom);
  const popOverlay = useSetAtom(popOverlayAtom);
  const topOverlay = useAtomValue(topOverlayAtom);

  const dismissRef = useRef(dismiss);
  useLayoutEffect(() => {
    dismissRef.current = dismiss;
  });

  useEffect(() => {
    if (!active) return;
    pushOverlay({ id, type, dismiss: dismissRef.current });
    return () => {
      popOverlay(id);
    };
  }, [active, id, type, pushOverlay, popOverlay]);

  return {
    isTop: topOverlay?.id === id,
  };
}
