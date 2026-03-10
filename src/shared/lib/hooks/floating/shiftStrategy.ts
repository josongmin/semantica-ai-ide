/**
 * Pure function: clamps a {top, left} position so the floating element stays
 * within viewport bounds, respecting the given padding.
 */

import type { Position } from "./computePlacement";

export interface ShiftStrategyOptions {
  position: Position;
  floating: DOMRect;
  /** Minimum distance from viewport edges in pixels. Default: 8. */
  padding?: number;
  /** Viewport width. Defaults to window.innerWidth if not provided. */
  viewportWidth?: number;
  /** Viewport height. Defaults to window.innerHeight if not provided. */
  viewportHeight?: number;
}

export function shiftStrategy({
  position,
  floating,
  padding = 8,
  viewportWidth,
  viewportHeight,
}: ShiftStrategyOptions): Position {
  const vw = viewportWidth ?? (typeof window !== "undefined" ? window.innerWidth : 1920);
  const vh = viewportHeight ?? (typeof window !== "undefined" ? window.innerHeight : 1080);

  const maxLeft = vw - floating.width - padding;
  const maxTop = vh - floating.height - padding;

  return {
    left: Math.max(padding, Math.min(position.left, maxLeft)),
    top: Math.max(padding, Math.min(position.top, maxTop)),
  };
}
