import { type CSSProperties,useEffect, useRef, useState } from "react";

/** Max turns to stagger on initial load */
const STAGGER_LIMIT = 5;
const STAGGER_DELAY_MS = 50;

/**
 * Builds a CSS animation map for turn entrance animations.
 *
 * - **Initial load**: staggers the first N turns with increasing delay.
 * - **Subsequent renders**: marks only newly-added turns for entrance animation.
 *
 * Returns a stable `Map<turnId, CSSProperties>` that the caller can pass to
 * each `TurnContainer` via its `animationStyle` prop.
 */
export function useTurnAnimation(turnIds: readonly string[]): Map<string, CSSProperties> {
  const knownTurnIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const [animationMap, setAnimationMap] = useState<Map<string, CSSProperties>>(() => new Map());

  useEffect(() => {
    const map = new Map<string, CSSProperties>();

    if (isInitialLoadRef.current && turnIds.length > 0) {
      // Initial load: stagger first N turns
      const limit = Math.min(turnIds.length, STAGGER_LIMIT);
      for (let i = 0; i < limit; i++) {
        const turnId = turnIds[i];
        if (turnId !== undefined) {
          map.set(turnId, { animationDelay: `${i * STAGGER_DELAY_MS}ms`, animationFillMode: "both" });
        }
      }
      // Mark all as known after initial load
      for (const id of turnIds) {
        knownTurnIdsRef.current.add(id);
      }
      isInitialLoadRef.current = false;
    } else {
      // Subsequent renders: animate only new turns
      for (const id of turnIds) {
        if (!knownTurnIdsRef.current.has(id)) {
          map.set(id, {});
          knownTurnIdsRef.current.add(id);
        }
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- building animation map from turn list changes requires synchronous state update
    setAnimationMap(map);
  }, [turnIds]);

  return animationMap;
}
