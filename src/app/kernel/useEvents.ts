import { useEffect, useMemo } from "react";

import { useKernel } from "./useKernel";

/**
 * Subscribe to Event Bridge events for a specific domain.
 * The subscription is automatically cleaned up on unmount.
 */
export function useEvents(
  domain: string,
  handler: (event: unknown) => void,
): void {
  const kernel = useKernel();

  useEffect(() => {
    return kernel.events.subscribe(domain, handler);
  }, [kernel, domain, handler]);
}

/**
 * Get a snapshot of the current state for a given event domain.
 */
export function useEventSnapshot(domain: string): unknown {
  const kernel = useKernel();
  return useMemo(
    () => kernel.events.getSnapshot(domain),
    [kernel, domain],
  );
}
