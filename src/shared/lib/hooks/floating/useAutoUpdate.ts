import { useEffect } from "react";

export interface UseAutoUpdateOptions {
  /** Whether auto-updating is enabled. Typically `open && mounted`. */
  enabled: boolean;
  /** Callback to invoke when position should be recalculated. */
  onUpdate: () => void;
}

/**
 * React hook that listens for scroll (capturing) and resize events on the
 * window and calls `onUpdate` whenever the floating position needs
 * recalculating.
 *
 * Runs an initial requestAnimationFrame update when enabled, then attaches
 * scroll/resize listeners.
 */
export function useAutoUpdate({ enabled, onUpdate }: UseAutoUpdateOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const rafId = requestAnimationFrame(onUpdate);
    window.addEventListener("scroll", onUpdate, true);
    window.addEventListener("resize", onUpdate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onUpdate, true);
      window.removeEventListener("resize", onUpdate);
    };
  }, [enabled, onUpdate]);
}
