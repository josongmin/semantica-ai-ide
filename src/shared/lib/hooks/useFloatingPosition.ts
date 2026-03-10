import { type RefObject, useCallback, useState } from "react";

import {
  type Alignment,
  computePlacement,
  type Placement,
  type Position,
} from "./floating/computePlacement";
import { flipStrategy } from "./floating/flipStrategy";
import { shiftStrategy } from "./floating/shiftStrategy";
import { useAutoUpdate } from "./floating/useAutoUpdate";

export type { Alignment, Placement, Position } from "./floating/computePlacement";

export interface UseFloatingPositionOptions {
  /** Whether the floating element is currently open/visible. */
  open: boolean;
  /** Whether the floating element has been mounted in the DOM (e.g. via portal). */
  mounted: boolean;
  /** Ref to the anchor/trigger element. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Ref to the floating element. */
  floatingRef: RefObject<HTMLElement | null>;
  /** Desired placement relative to the anchor. Default: "bottom". */
  placement?: Placement;
  /** Cross-axis alignment. Default: "center". */
  align?: Alignment;
  /** Gap between anchor and floating element in pixels. Default: 8. */
  gap?: number;
  /** Viewport padding for clamping. Default: 8. */
  padding?: number;
  /** Whether to auto-flip when there is not enough space. Default: true. */
  flip?: boolean;
  /** Whether to shift (clamp) within viewport bounds. Default: true. */
  shift?: boolean;
  /** Offset from anchor in pixels. Alias for gap. */
  offset?: number;
  /** Whether floating positioning is enabled. Default: true. */
  enabled?: boolean;
}

/** @deprecated Use UseFloatingPositionOptions */
export type FloatingPositionConfig = UseFloatingPositionOptions;

/** Ref type for the anchor element */
export type AnchorRef = RefObject<HTMLElement | null>;

export interface UseFloatingPositionReturn {
  /** Computed position for the floating element. */
  position: Position;
  /** Whether the initial position has been computed (avoids flash at {0,0}). */
  positioned: boolean;
  /** Top offset in pixels (alias for position.top) */
  top: number;
  /** Left offset in pixels (alias for position.left) */
  left: number;
  /** Whether positioning is ready (alias for positioned) */
  ready: boolean;
  /** Resolved placement after flip */
  placement: Placement;
}

/** @deprecated Use the useFloatingPosition hook */
export type FloatingPosition = Position;

/** @deprecated Use the useFloatingPosition hook */
export function computeFloatingPosition(_anchor: DOMRect, _floating: DOMRect, _options?: Partial<UseFloatingPositionOptions>): Position {
  return computePlacement({
    anchor: _anchor,
    floating: _floating,
    placement: _options?.placement ?? "bottom",
    align: _options?.align ?? "center",
    gap: _options?.gap ?? 8,
  });
}

/**
 * Composition hook that combines placement computation, flip strategy,
 * shift strategy, and auto-update into a single floating positioning solution.
 *
 * Pure strategies are imported from `./floating/` -- this hook only wires
 * them together with React state and the auto-update effect.
 */
export function useFloatingPosition({
  open,
  mounted,
  anchorRef,
  floatingRef,
  placement = "bottom",
  align = "center",
  gap = 8,
  padding = 8,
  flip = true,
  shift = true,
}: UseFloatingPositionOptions): UseFloatingPositionReturn {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [positioned, setPositioned] = useState(false);

  const update = useCallback(() => {
    const anchorEl = anchorRef.current;
    const floatingEl = floatingRef.current;
    if (!anchorEl || !floatingEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const floatingRect = floatingEl.getBoundingClientRect();

    // 1. Optionally flip placement when there is not enough space
    const resolvedPlacement = flip
      ? flipStrategy({ anchor: anchorRect, floating: floatingRect, placement, gap, padding })
      : placement;

    // 2. Compute raw position from anchor + resolved placement
    const raw = computePlacement({
      anchor: anchorRect,
      floating: floatingRect,
      placement: resolvedPlacement,
      align,
      gap,
    });

    // 3. Optionally shift (clamp) within viewport bounds
    const final = shift
      ? shiftStrategy({ position: raw, floating: floatingRect, padding })
      : raw;

    setPosition(final);
    setPositioned(true);
  }, [anchorRef, floatingRef, placement, align, gap, padding, flip, shift]);

  // Auto-update on scroll/resize
  useAutoUpdate({ enabled: open && mounted, onUpdate: update });

  return {
    position,
    positioned,
    top: position.top,
    left: position.left,
    ready: positioned,
    placement,
  };
}
