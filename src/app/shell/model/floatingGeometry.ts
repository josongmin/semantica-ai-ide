/**
 * Floating Window Geometry Utilities
 *
 * Pure functions for snap-edge detection and snap-position styling.
 * No side effects, no React dependencies — safe to use from hooks or tests.
 */

import { FLOATING_CONSTRAINTS, type SnapEdge } from "./floatingAtoms";

// ─── Snap Style ──────────────────────────────────────────

/**
 * Compute an absolute-position CSS style for a given snap edge.
 * Returns `null` when `edge` is `null` (no snap).
 */
export function computeSnapStyle(edge: SnapEdge): React.CSSProperties | null {
  if (!edge) return null;
  const inset = 8;
  const half = "calc(50% - 4px)";
  switch (edge) {
    case "left":
      return { left: inset, top: inset, width: half, height: `calc(100% - ${inset * 2}px)` };
    case "right":
      return { right: inset, top: inset, width: half, height: `calc(100% - ${inset * 2}px)` };
    case "top":
      return { left: inset, top: inset, width: `calc(100% - ${inset * 2}px)`, height: half };
    case "bottom":
      return { left: inset, bottom: inset, width: `calc(100% - ${inset * 2}px)`, height: half };
    case "top-left":
      return { left: inset, top: inset, width: half, height: half };
    case "top-right":
      return { right: inset, top: inset, width: half, height: half };
    case "bottom-left":
      return { left: inset, bottom: inset, width: half, height: half };
    case "bottom-right":
      return { right: inset, bottom: inset, width: half, height: half };
    default:
      return null;
  }
}

// ─── Snap Detection ──────────────────────────────────────

/**
 * Detect which snap edge (if any) the cursor is close to.
 * Returns `null` when the cursor is not near any viewport edge.
 */
export function detectSnapEdge(x: number, y: number): SnapEdge {
  const threshold = FLOATING_CONSTRAINTS.snapThreshold;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const nearLeft = x < threshold;
  const nearRight = x > vw - threshold;
  const nearTop = y < threshold;
  const nearBottom = y > vh - threshold;

  if (nearTop && nearLeft) return "top-left";
  if (nearTop && nearRight) return "top-right";
  if (nearBottom && nearLeft) return "bottom-left";
  if (nearBottom && nearRight) return "bottom-right";
  if (nearLeft) return "left";
  if (nearRight) return "right";
  if (nearTop) return "top";
  if (nearBottom) return "bottom";
  return null;
}
