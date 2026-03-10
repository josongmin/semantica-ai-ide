import { useEffect, useRef, useState } from "react";

/**
 * Format elapsed milliseconds into a human-readable string.
 * <1s: "0.Xs", <60s: "Xs", >=60s: "Xm Ys"
 */
function formatElapsed(ms: number): string {
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m ${remainSecs}s`;
}

/**
 * rAF-based elapsed time display for running tool calls.
 * Only ticks while `active` is true. Returns formatted string.
 */
export function useElapsedTime(active: boolean, startMs?: number): string {
  const [elapsed, setElapsed] = useState("");
  const rafRef = useRef<number>(0);
  // eslint-disable-next-line react-hooks/purity -- Date.now() fallback is intentional for initial mount timestamp
  const startRef = useRef(startMs ?? Date.now());

  useEffect(() => {
    if (startMs !== undefined) {
      startRef.current = startMs;
    }
  }, [startMs]);

  useEffect(() => {
    if (!active) {
       
      setElapsed("");
      return;
    }

    function tick() {
      const diff = Date.now() - startRef.current;
      setElapsed(formatElapsed(diff));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return elapsed;
}
