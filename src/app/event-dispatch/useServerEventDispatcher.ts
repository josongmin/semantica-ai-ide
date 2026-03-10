import { useCallback } from "react";
import { useStore } from "jotai";

import type { ServerEvent } from "../../shared/protocol";
import { dispatchServerEvent } from "./dispatchServerEvent";

/**
 * Hook that returns a dispatch function capable of handling any ServerEvent type.
 *
 * Uses Jotai store directly (stable reference) instead of individual useSetAtom
 * calls to eliminate the 13-item dependency array and prevent unnecessary re-renders.
 *
 * Delegates to the pure `dispatchServerEvent` function for the actual switch logic,
 * keeping a single source of truth for all ServerEvent → atom mappings.
 */
export function useServerEventDispatcher(): { dispatch: (serverEvent: ServerEvent) => void } {
  const store = useStore();

  const dispatch = useCallback(
    (serverEvent: ServerEvent) => {
      dispatchServerEvent(store, serverEvent);
    },
    [store],
  );

  return { dispatch };
}
