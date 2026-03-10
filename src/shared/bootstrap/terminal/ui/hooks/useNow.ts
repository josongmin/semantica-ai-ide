import { useEffect, useState } from "react";

/**
 * Returns a timestamp that updates every second, for live elapsed time display.
 * Only ticks when `active` is true.
 */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}
