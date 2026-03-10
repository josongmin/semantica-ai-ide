/**
 * Floating Window Atoms — 2026 SOTA Floating Panel System
 *
 * State management for detachable, draggable, resizable floating windows.
 * Supports: detach/attach, minimize/restore, z-stacking, snap-to-edge,
 * position persistence, and multi-window orchestration.
 */

import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

// ─── Types ───────────────────────────────────────────────

export interface FloatingWindowPosition {
  readonly x: number;
  readonly y: number;
}

export interface FloatingWindowSize {
  readonly width: number;
  readonly height: number;
}

export type SnapEdge = "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | null;

export interface FloatingWindowState {
  /** View ID from viewRegistry (e.g. "terminal", "output") */
  readonly viewId: string;
  /** Window position relative to viewport */
  readonly position: FloatingWindowPosition;
  /** Window dimensions */
  readonly size: FloatingWindowSize;
  /** z-index order (higher = on top) */
  readonly zOrder: number;
  /** Whether window is minimized to dock */
  readonly minimized: boolean;
  /** Snap edge (for snap-to-edge feature) */
  readonly snappedTo: SnapEdge;
  /** Whether window is maximized (full center area) */
  readonly maximized: boolean;
  /** Timestamp of last focus (for stacking order) */
  readonly lastFocusedAt: number;
}

// ─── Constants ───────────────────────────────────────────

const DEFAULT_WINDOW_SIZE: FloatingWindowSize = { width: 640, height: 400 };
const MIN_WINDOW_SIZE: FloatingWindowSize = { width: 320, height: 200 };
const MAX_WINDOW_SIZE: FloatingWindowSize = { width: 1600, height: 1200 };
const CASCADE_OFFSET = 32;

export const FLOATING_CONSTRAINTS = {
  minSize: MIN_WINDOW_SIZE,
  maxSize: MAX_WINDOW_SIZE,
  defaultSize: DEFAULT_WINDOW_SIZE,
  cascadeOffset: CASCADE_OFFSET,
  snapThreshold: 20,
  dockHeight: 40,
} as const;

// ─── Core State ──────────────────────────────────────────

/** All floating windows: viewId → FloatingWindowState */
export const floatingWindowMapAtom = atom<Map<string, FloatingWindowState>>(new Map());

/** Global z-order counter (monotonically increasing) */
const zCounterAtom = atom(100);

// ─── Derived Atoms ───────────────────────────────────────

/** Ordered list of floating windows (by z-order, ascending) */
export const floatingWindowListAtom = atom((get) => {
  const map = get(floatingWindowMapAtom);
  return [...map.values()].sort((a, b) => a.zOrder - b.zOrder);
});

/** Visible (non-minimized) floating windows */
export const visibleFloatingWindowsAtom = atom((get) => {
  return get(floatingWindowListAtom).filter((w) => !w.minimized);
});

/** Minimized floating windows (for dock) */
export const minimizedFloatingWindowsAtom = atom((get) => {
  return get(floatingWindowListAtom).filter((w) => w.minimized);
});

/** Whether any floating windows exist */
export const hasFloatingWindowsAtom = atom((get) => {
  return get(floatingWindowMapAtom).size > 0;
});

/** Top-most window viewId */
export const topFloatingWindowIdAtom = atom((get) => {
  const list = get(floatingWindowListAtom);
  const visible = list.filter((w) => !w.minimized);
  if (visible.length === 0) return null;
  const topWindow = visible[visible.length - 1];
  return topWindow?.viewId ?? null;
});

// ─── Write Atoms ─────────────────────────────────────────

/** Detach a panel into a floating window */
export const detachToFloatingAtom = atom(
  null,
  (get, set, viewId: string, initialPos?: FloatingWindowPosition) => {
    const map = get(floatingWindowMapAtom);
    if (map.has(viewId)) {
      // Already floating — just bring to front
      set(bringToFrontAtom, viewId);
      return;
    }

    const zCounter = get(zCounterAtom) + 1;
    set(zCounterAtom, zCounter);

    // Cascade position based on existing windows
    const existingCount = map.size;
    const cascadeX = 120 + existingCount * CASCADE_OFFSET;
    const cascadeY = 80 + existingCount * CASCADE_OFFSET;

    const position = initialPos ?? { x: cascadeX, y: cascadeY };

    const next = new Map(map);
    next.set(viewId, {
      viewId,
      position,
      size: { ...DEFAULT_WINDOW_SIZE },
      zOrder: zCounter,
      minimized: false,
      snappedTo: null,
      maximized: false,
      lastFocusedAt: Date.now(),
    });
    set(floatingWindowMapAtom, next);
  },
);

/** Attach a floating window back to its panel zone */
export const attachFromFloatingAtom = atom(null, (get, set, viewId: string) => {
  const map = get(floatingWindowMapAtom);
  if (!map.has(viewId)) return;
  const next = new Map(map);
  next.delete(viewId);
  set(floatingWindowMapAtom, next);
});

/** Bring a window to front (update z-order) */
export const bringToFrontAtom = atom(null, (get, set, viewId: string) => {
  const map = get(floatingWindowMapAtom);
  const win = map.get(viewId);
  if (!win) return;

  const zCounter = get(zCounterAtom) + 1;
  set(zCounterAtom, zCounter);

  const next = new Map(map);
  next.set(viewId, {
    ...win,
    zOrder: zCounter,
    lastFocusedAt: Date.now(),
  });
  set(floatingWindowMapAtom, next);
});

/** Update window position (during drag) */
export const moveFloatingWindowAtom = atom(
  null,
  (get, set, payload: { viewId: string; position: FloatingWindowPosition }) => {
    const map = get(floatingWindowMapAtom);
    const win = map.get(payload.viewId);
    if (!win) return;
    const next = new Map(map);
    next.set(payload.viewId, {
      ...win,
      position: payload.position,
      snappedTo: null, // Clear snap on manual move
      maximized: false,
    });
    set(floatingWindowMapAtom, next);
  },
);

/** Update window size (during resize) */
export const resizeFloatingWindowAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      viewId: string;
      size: FloatingWindowSize;
      position?: FloatingWindowPosition;
    },
  ) => {
    const map = get(floatingWindowMapAtom);
    const win = map.get(payload.viewId);
    if (!win) return;

    const clamped: FloatingWindowSize = {
      width: Math.max(MIN_WINDOW_SIZE.width, Math.min(MAX_WINDOW_SIZE.width, payload.size.width)),
      height: Math.max(
        MIN_WINDOW_SIZE.height,
        Math.min(MAX_WINDOW_SIZE.height, payload.size.height),
      ),
    };

    const next = new Map(map);
    next.set(payload.viewId, {
      ...win,
      size: clamped,
      position: payload.position ?? win.position,
      snappedTo: null,
      maximized: false,
    });
    set(floatingWindowMapAtom, next);
  },
);

/** Minimize a floating window to dock */
export const minimizeFloatingWindowAtom = atom(null, (get, set, viewId: string) => {
  const map = get(floatingWindowMapAtom);
  const win = map.get(viewId);
  if (!win) return;
  const next = new Map(map);
  next.set(viewId, { ...win, minimized: true });
  set(floatingWindowMapAtom, next);
});

/** Restore a minimized window */
export const restoreFloatingWindowAtom = atom(null, (get, set, viewId: string) => {
  const map = get(floatingWindowMapAtom);
  const win = map.get(viewId);
  if (!win) return;

  const zCounter = get(zCounterAtom) + 1;
  set(zCounterAtom, zCounter);

  const next = new Map(map);
  next.set(viewId, {
    ...win,
    minimized: false,
    zOrder: zCounter,
    lastFocusedAt: Date.now(),
  });
  set(floatingWindowMapAtom, next);
});

/** Toggle maximize/restore for a window */
export const toggleMaximizeFloatingAtom = atom(null, (get, set, viewId: string) => {
  const map = get(floatingWindowMapAtom);
  const win = map.get(viewId);
  if (!win) return;
  const next = new Map(map);
  next.set(viewId, { ...win, maximized: !win.maximized });
  set(floatingWindowMapAtom, next);
});

/** Snap a window to an edge */
export const snapFloatingWindowAtom = atom(
  null,
  (get, set, payload: { viewId: string; edge: SnapEdge }) => {
    const map = get(floatingWindowMapAtom);
    const win = map.get(payload.viewId);
    if (!win) return;
    const next = new Map(map);
    next.set(payload.viewId, { ...win, snappedTo: payload.edge });
    set(floatingWindowMapAtom, next);
  },
);

/** Close all floating windows (attach them all back) */
export const closeAllFloatingAtom = atom(null, (_get, set) => {
  set(floatingWindowMapAtom, new Map());
});

// ─── Reset ───────────────────────────────────────────────

export const resetFloatingStoreAtom = atom(null, (_get, set) => {
  set(floatingWindowMapAtom, new Map());
  set(zCounterAtom, 100);
});
registerResetAtom(resetFloatingStoreAtom);
