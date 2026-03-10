/**
 * Surface navigation history — proper browser-style back/forward stack.
 *
 * push() appends to history and clears forward stack.
 * back() moves pointer backward without mutating the stack.
 * forward() moves pointer forward.
 */
import { atom } from "jotai";

import type { SurfaceId } from "../../protocol/types/ui";
import { registerResetAtom } from "./resetRegistry";
import { activeSurfaceAtom } from "./surfaceAtoms";

/** Max history depth to prevent unbounded memory growth */
const MAX_HISTORY = 50;

/** Ordered list of visited surfaces */
export const surfaceHistoryAtom = atom<readonly SurfaceId[]>(["chat"]);

/** Current position in history (0-based index) */
export const surfaceHistoryIndexAtom = atom(0);

/** Derived: can navigate back? */
export const canGoBackAtom = atom((get) => get(surfaceHistoryIndexAtom) > 0);

/** Derived: can navigate forward? */
export const canGoForwardAtom = atom(
  (get) => get(surfaceHistoryIndexAtom) < get(surfaceHistoryAtom).length - 1,
);

/**
 * Push a surface onto the navigation stack.
 * Truncates any forward history (like browser behavior).
 */
export const pushSurfaceHistoryAtom = atom(null, (get, set, surface: SurfaceId) => {
  const history = get(surfaceHistoryAtom);
  const index = get(surfaceHistoryIndexAtom);
  const current = history[index];

  // Don't push duplicate consecutive entries
  if (current === surface) return;

  // Truncate forward history and append
  const truncated = history.slice(0, index + 1);
  const next = [...truncated, surface];

  // Enforce max depth — drop oldest entries
  if (next.length > MAX_HISTORY) {
    const overflow = next.length - MAX_HISTORY;
    set(surfaceHistoryAtom, next.slice(overflow));
    set(surfaceHistoryIndexAtom, next.length - overflow - 1);
  } else {
    set(surfaceHistoryAtom, next);
    set(surfaceHistoryIndexAtom, next.length - 1);
  }

  set(activeSurfaceAtom, surface);
});

/** Navigate back in surface history */
export const goBackAtom = atom(null, (get, set) => {
  const index = get(surfaceHistoryIndexAtom);
  if (index <= 0) return;

  const newIndex = index - 1;
  const history = get(surfaceHistoryAtom);
  const surface = history[newIndex];
  if (surface) {
    set(surfaceHistoryIndexAtom, newIndex);
    set(activeSurfaceAtom, surface);
  }
});

/** Navigate forward in surface history */
export const goForwardAtom = atom(null, (get, set) => {
  const history = get(surfaceHistoryAtom);
  const index = get(surfaceHistoryIndexAtom);
  if (index >= history.length - 1) return;

  const newIndex = index + 1;
  const surface = history[newIndex];
  if (surface) {
    set(surfaceHistoryIndexAtom, newIndex);
    set(activeSurfaceAtom, surface);
  }
});

/** Reset navigation history to initial state */
export const resetSurfaceHistoryAtom = atom(null, (_get, set) => {
  set(surfaceHistoryAtom, ["chat"]);
  set(surfaceHistoryIndexAtom, 0);
  set(activeSurfaceAtom, "chat");
});

registerResetAtom(resetSurfaceHistoryAtom);
