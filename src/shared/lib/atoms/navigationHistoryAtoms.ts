/**
 * Surface navigation history — DEPRECATED.
 *
 * All navigation now goes through the SurfaceLifecycleCoordinator
 * (`navigateAtom` in surfaceLifecycleAtoms.ts). This file re-exports
 * from the coordinator for backward compatibility.
 *
 * @see RFC-021 §4 — Lifecycle Coordinator
 * @deprecated Import from `~app/shell/model/surfaceLifecycleAtoms` instead.
 */

export {
  canGoBackAtom,
  canGoForwardAtom,
  navigateBackAtom as goBackAtom,
  navigateForwardAtom as goForwardAtom,
  resetSurfaceLifecycleAtom as resetSurfaceHistoryAtom,
  surfaceHistoryAtom,
  surfaceHistoryIndexAtom,
} from "../../../app/shell/model/surfaceLifecycleAtoms";
