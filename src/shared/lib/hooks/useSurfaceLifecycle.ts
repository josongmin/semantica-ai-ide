/**
 * useSurfaceLifecycle — RFC-021 §7.2
 *
 * Subscribes to lifecycle events for a specific surface.
 * Events are delivered synchronously by the SurfaceLifecycleCoordinator,
 * NOT inferred from React render cycles (RFC-021 §4.1 invariant L1).
 *
 * @example
 * ```tsx
 * useSurfaceLifecycle("graph", {
 *   onActivate: () => renderer.resume(),
 *   onDeactivate: () => renderer.pause(),
 *   onDestroy: () => renderer.dispose(),
 * });
 * ```
 */
import { useEffect, useRef } from "react";

import {
  type LifecycleEvent,
  subscribeLifecycle,
} from "../../../app/shell/model/surfaceLifecycleAtoms";
import type { SurfaceId } from "../../protocol/types/ui";

export interface SurfaceLifecycleCallbacks {
  onActivate?: () => void;
  onDeactivate?: () => void;
  onDestroy?: () => void;
}

export function useSurfaceLifecycle(
  surfaceId: SurfaceId,
  callbacks: SurfaceLifecycleCallbacks,
): void {
  const cbRef = useRef(callbacks);

  useEffect(() => {
    cbRef.current = callbacks;
  });

  useEffect(() => {
    return subscribeLifecycle(surfaceId, (event: LifecycleEvent) => {
      const cbs = cbRef.current;
      if (event.type === "activate") cbs.onActivate?.();
      else if (event.type === "deactivate") cbs.onDeactivate?.();
      else cbs.onDestroy?.();
    });
  }, [surfaceId]);
}
