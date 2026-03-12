/**
 * Surface Lifecycle Coordinator — RFC-021 §4
 *
 * SOLE AUTHORITY for surface transitions. All navigation MUST go through
 * `navigateAtom`. Direct mutation of `activeSurfaceAtom` is prohibited
 * except by this module.
 *
 * Lifecycle events are delivered synchronously via callback registry,
 * NOT through React render/effect cycles. This prevents race conditions
 * on rapid navigation (RFC-021 §4.1 Authority Principle).
 *
 * Invariants (RFC-021 §13):
 * - N1: At most 1 active surface at any time
 * - N2: Active surface changes ONLY via navigateAtom
 * - L1: Lifecycle events emitted by coordinator, not inferred from React
 * - L2: activate/deactivate alternate strictly per surface
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import { activeSurfaceAtom } from "../../../shared/lib/atoms/surfaceAtoms";
import type { SurfaceId } from "../../../shared/protocol/types/ui";
import { restoreFrameStateAtom, saveFrameStateAtom } from "./shellAtoms";

// ─── Lifecycle Event Types ────────────────────────────────────

export type LifecycleEventType = "activate" | "deactivate" | "destroy";

export interface LifecycleEvent {
  readonly type: LifecycleEventType;
  readonly surfaceId: SurfaceId;
  readonly timestamp: number;
}

// ─── Callback Registry ────────────────────────────────────────
//
// Synchronous event delivery. No React dependency.
// Hooks subscribe via useEffect; coordinator invokes directly.

type LifecycleCallback = (event: LifecycleEvent) => void;

const lifecycleListeners = new Map<string, Set<LifecycleCallback>>();

function emitLifecycleEvent(type: LifecycleEventType, surfaceId: SurfaceId): void {
  const event: LifecycleEvent = { type, surfaceId, timestamp: Date.now() };

  // Deliver to surface-specific listeners
  const listeners = lifecycleListeners.get(surfaceId);
  if (listeners) {
    for (const cb of listeners) {
      try {
        cb(event);
      } catch (err) {
        console.error(`[SurfaceLifecycle] Error in ${type} callback for ${surfaceId}:`, err);
      }
    }
  }

  // Deliver to global listeners (observability)
  const globals = lifecycleListeners.get("*");
  if (globals) {
    for (const cb of globals) {
      try {
        cb(event);
      } catch {
        /* observability listeners must not break navigation */
      }
    }
  }
}

/**
 * Subscribe to lifecycle events for a specific surface.
 * Pass `"*"` as surfaceId to receive ALL events (observability).
 * Returns unsubscribe function.
 */
export function subscribeLifecycle(surfaceId: SurfaceId | "*", cb: LifecycleCallback): () => void {
  let set = lifecycleListeners.get(surfaceId);
  if (!set) {
    set = new Set();
    lifecycleListeners.set(surfaceId, set);
  }
  set.add(cb);
  return () => {
    set.delete(cb);
    if (set.size === 0) lifecycleListeners.delete(surfaceId);
  };
}

// ─── Last Event Atom (observability / DevTools) ───────────────

/** Most recent lifecycle event — for DevTools / observability only. */
export const lastLifecycleEventAtom = atom<LifecycleEvent | null>(null);

// ─── Navigation History (coordinator-owned) ───────────────────

const MAX_HISTORY = 50;

export const surfaceHistoryAtom = atom<readonly SurfaceId[]>(["chat"]);
export const surfaceHistoryIndexAtom = atom(0);

export const canGoBackAtom = atom((get) => get(surfaceHistoryIndexAtom) > 0);
export const canGoForwardAtom = atom(
  (get) => get(surfaceHistoryIndexAtom) < get(surfaceHistoryAtom).length - 1,
);

/** Push to history stack (truncates forward). Internal only. */
const pushHistoryAtom = atom(null, (get, set, surface: SurfaceId) => {
  const history = get(surfaceHistoryAtom);
  const index = get(surfaceHistoryIndexAtom);

  if (history[index] === surface) return;

  const truncated = history.slice(0, index + 1);
  const next = [...truncated, surface];

  if (next.length > MAX_HISTORY) {
    const overflow = next.length - MAX_HISTORY;
    set(surfaceHistoryAtom, next.slice(overflow));
    set(surfaceHistoryIndexAtom, next.length - overflow - 1);
  } else {
    set(surfaceHistoryAtom, next);
    set(surfaceHistoryIndexAtom, next.length - 1);
  }
});

// ─── Navigate Atom — SOLE AUTHORITY ───────────────────────────
//
// RFC-021 §4.3: ALL surface transitions go through this atom.
// Sequence: deactivate → save → switch → restore → activate → history

export interface NavigateTarget {
  readonly surfaceId: SurfaceId;
  readonly params?: Record<string, unknown>;
}

export const navigateAtom = atom(null, (get, set, target: NavigateTarget) => {
  const currentSurface = get(activeSurfaceAtom);
  if (currentSurface === target.surfaceId) return;

  // 1. (P2: guard check — placeholder)

  // 2. Deactivate old surface (synchronous callback delivery)
  emitLifecycleEvent("deactivate", currentSurface);

  // 3. Save frame state for old surface
  set(saveFrameStateAtom);

  // 4. Switch active surface
  set(activeSurfaceAtom, target.surfaceId);

  // 5. Restore frame state for new surface (layout-constrained)
  set(restoreFrameStateAtom, target.surfaceId);

  // 6. Activate new surface (synchronous callback delivery)
  emitLifecycleEvent("activate", target.surfaceId);

  // 7. Push to navigation history
  set(pushHistoryAtom, target.surfaceId);

  // 8. Update observability atom
  set(lastLifecycleEventAtom, {
    type: "activate",
    surfaceId: target.surfaceId,
    timestamp: Date.now(),
  });
});

// ─── Navigate Back / Forward ──────────────────────────────────

export const navigateBackAtom = atom(null, (get, set) => {
  const index = get(surfaceHistoryIndexAtom);
  if (index <= 0) return;

  const history = get(surfaceHistoryAtom);
  const targetSurface = history[index - 1];
  if (!targetSurface) return;

  const currentSurface = get(activeSurfaceAtom);
  if (currentSurface === targetSurface) {
    set(surfaceHistoryIndexAtom, index - 1);
    return;
  }

  // Full lifecycle transition (without pushing new history entry)
  emitLifecycleEvent("deactivate", currentSurface);
  set(saveFrameStateAtom);
  set(activeSurfaceAtom, targetSurface);
  set(restoreFrameStateAtom, targetSurface);
  emitLifecycleEvent("activate", targetSurface);
  set(surfaceHistoryIndexAtom, index - 1);
  set(lastLifecycleEventAtom, {
    type: "activate",
    surfaceId: targetSurface,
    timestamp: Date.now(),
  });
});

export const navigateForwardAtom = atom(null, (get, set) => {
  const history = get(surfaceHistoryAtom);
  const index = get(surfaceHistoryIndexAtom);
  if (index >= history.length - 1) return;

  const targetSurface = history[index + 1];
  if (!targetSurface) return;

  const currentSurface = get(activeSurfaceAtom);
  if (currentSurface === targetSurface) {
    set(surfaceHistoryIndexAtom, index + 1);
    return;
  }

  emitLifecycleEvent("deactivate", currentSurface);
  set(saveFrameStateAtom);
  set(activeSurfaceAtom, targetSurface);
  set(restoreFrameStateAtom, targetSurface);
  emitLifecycleEvent("activate", targetSurface);
  set(surfaceHistoryIndexAtom, index + 1);
  set(lastLifecycleEventAtom, {
    type: "activate",
    surfaceId: targetSurface,
    timestamp: Date.now(),
  });
});

// ─── Reset ────────────────────────────────────────────────────

export const resetSurfaceLifecycleAtom = atom(null, (_get, set) => {
  set(surfaceHistoryAtom, ["chat"]);
  set(surfaceHistoryIndexAtom, 0);
  set(lastLifecycleEventAtom, null);
});

registerResetAtom(resetSurfaceLifecycleAtom);
