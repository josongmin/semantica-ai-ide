import React, { useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";

import { activeSurfaceAtom } from "../shared/lib/atoms/surfaceAtoms";
import type { SurfaceId } from "../shared/protocol/types/ui";
import { SurfaceSkeleton } from "../surfaces/SurfaceSkeleton";
import { getAllSurfaces } from "./surfaceRegistry";

/**
 * Keep-alive surface router — all visited surfaces stay mounted (display:none).
 * No entrance animation — instant switching between surfaces.
 *
 * RFC-016 §4.2: Reads from surfaceRegistry instead of a hardcoded SURFACE_MAP.
 * RFC-021 §4: Navigation history is managed by the SurfaceLifecycleCoordinator.
 * This component only manages the React rendering concern (visited set + display:none).
 */
export function SurfaceRouter() {
  const surface = useAtomValue(activeSurfaceAtom);
  const [visited, setVisited] = useState<ReadonlySet<SurfaceId>>(() => new Set([surface]));

  const surfaceMap = useMemo(() => {
    const map = new Map<SurfaceId, React.LazyExoticComponent<React.ComponentType>>();
    for (const def of getAllSurfaces()) {
      map.set(def.id, def.component);
    }
    return map;
  }, []);

  // Add newly-activated surface to the visited set (rendering concern only)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- visited set must be updated synchronously for keep-alive routing
    setVisited((prev) => {
      if (prev.has(surface)) return prev;
      const next = new Set(prev);
      next.add(surface);
      return next;
    });
  }, [surface]);

  // Ensure the current surface is always rendered even on first mount
  // before the effect fires (visited is initialised with the first surface).
  const surfacesToRender = visited.has(surface) ? visited : new Set([...visited, surface]);

  return (
    <React.Suspense fallback={<SurfaceSkeleton label="Surface" />}>
      {Array.from(surfacesToRender).map((id) => {
        const Comp = surfaceMap.get(id);
        if (!Comp) return null;
        const isActive = surface === id;
        return (
          <div
            key={id}
            className="absolute inset-0"
            style={{ display: isActive ? undefined : "none" }}
          >
            <Comp />
          </div>
        );
      })}
    </React.Suspense>
  );
}
