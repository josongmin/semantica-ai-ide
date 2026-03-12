/**
 * useSurfaceFocusEffect — RFC-021 §7.3
 *
 * Runs an effect when a surface activates, and cleans up when it
 * deactivates or is destroyed. Modeled after React Navigation's
 * `useFocusEffect` and Jetpack Compose's `DisposableEffect`.
 *
 * @example
 * ```tsx
 * useSurfaceFocusEffect("graph", () => {
 *   const interval = setInterval(pollData, 5000);
 *   return () => clearInterval(interval); // cleanup on deactivate/destroy
 * });
 * ```
 */
import { useEffect, useRef } from "react";

import { subscribeLifecycle } from "../../../app/shell/model/surfaceLifecycleAtoms";
import type { SurfaceId } from "../../protocol/types/ui";

export function useSurfaceFocusEffect(
  surfaceId: SurfaceId,
  effect: () => (() => void) | undefined,
): void {
  const effectRef = useRef(effect);
  const cleanupRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    effectRef.current = effect;
  });

  useEffect(() => {
    return subscribeLifecycle(surfaceId, (event) => {
      if (event.type === "activate") {
        cleanupRef.current = effectRef.current();
      } else {
        cleanupRef.current?.();
        cleanupRef.current = undefined;
      }
    });
  }, [surfaceId]);

  // Also cleanup on unmount (safety net)
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    };
  }, []);
}
