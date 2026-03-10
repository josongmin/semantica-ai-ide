import React, { useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { pushSurfaceHistoryAtom } from "../shared/lib/atoms/navigationHistoryAtoms";
import { activeSurfaceAtom } from "../shared/lib/atoms/surfaceAtoms";
import type { SurfaceId } from "../shared/protocol/types/ui";
import { SurfaceSkeleton } from "../surfaces/SurfaceSkeleton";
import { getAllSurfaces } from "./surfaceRegistry";

/**
 * Keep-alive surface router — all visited surfaces stay mounted (display:none),
 * active surface gets a subtle entrance animation.
 *
 * RFC-016 §4.2: Reads from surfaceRegistry instead of a hardcoded SURFACE_MAP.
 */
export function SurfaceRouter() {
  const surface = useAtomValue(activeSurfaceAtom);
  const pushHistory = useSetAtom(pushSurfaceHistoryAtom);
  const [visited, setVisited] = useState<ReadonlySet<SurfaceId>>(() => new Set([surface]));

  const surfaceMap = useMemo(() => {
    const map = new Map<SurfaceId, React.LazyExoticComponent<React.ComponentType>>();
    for (const def of getAllSurfaces()) {
      map.set(def.id, def.component);
    }
    return map;
  }, []);

  // Add newly-activated surface to the visited set & track navigation history
  useEffect(() => {
    pushHistory(surface);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- visited set must be updated synchronously for keep-alive routing
    setVisited((prev) => {
      if (prev.has(surface)) return prev;
      const next = new Set(prev);
      next.add(surface);
      return next;
    });
  }, [surface, pushHistory]);

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
            className={isActive ? "absolute inset-0 surface-enter" : "absolute inset-0"}
            style={{ display: isActive ? undefined : "none" }}
          >
            <Comp />
          </div>
        );
      })}
    </React.Suspense>
  );
}
