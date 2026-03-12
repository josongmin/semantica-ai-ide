/**
 * useSurfaceActive — RFC-021 §7.1
 *
 * Returns whether the given surface is currently active.
 * Reactive — re-renders when active surface changes.
 *
 * @example
 * ```tsx
 * const isActive = useSurfaceActive("graph");
 * // Pause WebGL rendering when not active
 * useEffect(() => { if (!isActive) renderer.pause(); }, [isActive]);
 * ```
 */
import { useAtomValue } from "jotai";

import type { SurfaceId } from "../../protocol/types/ui";
import { activeSurfaceAtom } from "../atoms/surfaceAtoms";

export function useSurfaceActive(surfaceId: SurfaceId): boolean {
  const activeSurface = useAtomValue(activeSurfaceAtom);
  return activeSurface === surfaceId;
}
