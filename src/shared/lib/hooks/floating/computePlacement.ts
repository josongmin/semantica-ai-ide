/**
 * Pure function: given an anchor rect, floating element rect, and desired placement/alignment,
 * computes the absolute {top, left} position for the floating element.
 *
 * Does NOT handle flipping or shifting -- those are separate strategies.
 */

export type Placement = "top" | "bottom" | "left" | "right";
export type Alignment = "start" | "center" | "end";
export interface Position { top: number; left: number }

export interface ComputePlacementOptions {
  anchor: DOMRect;
  floating: DOMRect;
  placement: Placement;
  align?: Alignment;
  /** Gap between anchor and floating element in pixels. Default: 8. */
  gap?: number;
}

export function computePlacement({
  anchor,
  floating,
  placement,
  align = "center",
  gap = 8,
}: ComputePlacementOptions): Position {
  let top = 0;
  let left = 0;

  // Primary axis
  switch (placement) {
    case "bottom":
      top = anchor.bottom + gap;
      break;
    case "top":
      top = anchor.top - floating.height - gap;
      break;
    case "right":
      left = anchor.right + gap;
      break;
    case "left":
      left = anchor.left - floating.width - gap;
      break;
  }

  // Cross-axis alignment
  if (placement === "top" || placement === "bottom") {
    switch (align) {
      case "start":
        ({ left } = anchor);
        break;
      case "center":
        left = anchor.left + (anchor.width - floating.width) / 2;
        break;
      case "end":
        left = anchor.right - floating.width;
        break;
    }
  } else {
    switch (align) {
      case "start":
        ({ top } = anchor);
        break;
      case "center":
        top = anchor.top + (anchor.height - floating.height) / 2;
        break;
      case "end":
        top = anchor.bottom - floating.height;
        break;
    }
  }

  return { top, left };
}
