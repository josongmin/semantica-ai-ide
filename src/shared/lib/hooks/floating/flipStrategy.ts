/**
 * Pure function: checks whether the floating element overflows the viewport on
 * its primary axis and, if so, returns the flipped placement. Otherwise returns
 * the original placement unchanged.
 *
 * Only flips along the primary axis (top<->bottom, left<->right).
 */

import type { Placement } from "./computePlacement";

export interface FlipStrategyOptions {
  anchor: DOMRect;
  floating: DOMRect;
  placement: Placement;
  /** Gap between anchor and floating element. Default: 8. */
  gap?: number;
  /** Viewport padding for overflow detection. Default: 8. */
  padding?: number;
  /** Viewport width. Defaults to window.innerWidth if not provided. */
  viewportWidth?: number;
  /** Viewport height. Defaults to window.innerHeight if not provided. */
  viewportHeight?: number;
}

const FLIP_MAP: Record<Placement, Placement> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

export function flipStrategy({
  anchor,
  floating,
  placement,
  gap = 8,
  padding = 8,
  viewportWidth,
  viewportHeight,
}: FlipStrategyOptions): Placement {
  const vw = viewportWidth ?? (typeof window !== "undefined" ? window.innerWidth : 1920);
  const vh = viewportHeight ?? (typeof window !== "undefined" ? window.innerHeight : 1080);

  const spaceTop = anchor.top - padding;
  const spaceBottom = vh - anchor.bottom - padding;
  const spaceLeft = anchor.left - padding;
  const spaceRight = vw - anchor.right - padding;

  const needed = {
    top: floating.height + gap,
    bottom: floating.height + gap,
    left: floating.width + gap,
    right: floating.width + gap,
  };

  switch (placement) {
    case "top":
      if (spaceTop < needed.top && spaceBottom >= spaceTop) return FLIP_MAP.top;
      break;
    case "bottom":
      if (spaceBottom < needed.bottom && spaceTop >= spaceBottom) return FLIP_MAP.bottom;
      break;
    case "left":
      if (spaceLeft < needed.left && spaceRight >= spaceLeft) return FLIP_MAP.left;
      break;
    case "right":
      if (spaceRight < needed.right && spaceLeft >= spaceRight) return FLIP_MAP.right;
      break;
  }

  return placement;
}
