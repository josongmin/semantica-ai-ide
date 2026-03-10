import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import { activeSurfaceAtom } from "../../../shared/lib/atoms/surfaceAtoms";
import type { SurfaceId } from "../../../shared/protocol/types/ui";
import { getViewById } from "./viewRegistry";

// ─── Surface Routing (re-exported from shared) ─────────

export { activeSurfaceAtom };
export type { SurfaceId };

// ─── Sidebar State (dock-left) ──────────────────────────

export const sidebarVisibleAtom = atom(true);
export const sidebarWidthAtom = atom(240);
export const activeSidebarViewAtom = atom<string>("file-tree");

// ─── Agent Panel State (dock-right) ─────────────────────

export const agentPanelVisibleAtom = atom(true);
export const agentPanelWidthAtom = atom(420);

// ─── Tray State (bottom) ────────────────────────────────

export const trayVisibleAtom = atom(true);
export const trayHeightAtom = atom(200);
export const activeTrayViewAtom = atom<string>("problems");
export const trayMaximizedAtom = atom(false);

// ─── Layout Persistence (S1 layer — RFC-010) ───────────

export interface ShellLayoutState {
  readonly sidebarWidth: number;
  readonly sidebarVisible: boolean;
  readonly agentPanelWidth: number;
  readonly agentPanelVisible: boolean;
  readonly trayHeight: number;
  readonly trayVisible: boolean;
  readonly activeSurface: SurfaceId;
  readonly activeTrayView: string;
  readonly activeSidebarView: string;
}

export const shellLayoutAtom = atom<ShellLayoutState>((get) => ({
  sidebarWidth: get(sidebarWidthAtom),
  sidebarVisible: get(sidebarVisibleAtom),
  agentPanelWidth: get(agentPanelWidthAtom),
  agentPanelVisible: get(agentPanelVisibleAtom),
  trayHeight: get(trayHeightAtom),
  trayVisible: get(trayVisibleAtom),
  activeSurface: get(activeSurfaceAtom),
  activeTrayView: get(activeTrayViewAtom),
  activeSidebarView: get(activeSidebarViewAtom),
}));

// ─── Zone Toggle Actions ────────────────────────────────

export const toggleSidebarAtom = atom(null, (get, set) => {
  set(sidebarVisibleAtom, !get(sidebarVisibleAtom));
});

export const toggleAgentPanelAtom = atom(null, (get, set) => {
  set(agentPanelVisibleAtom, !get(agentPanelVisibleAtom));
});

export const toggleTrayAtom = atom(null, (get, set) => {
  set(trayVisibleAtom, !get(trayVisibleAtom));
});

// ─── Focus / Zen Mode ──────────────────────────────────
//
// Hides all panels (sidebar, agent, tray) and top bar chrome.
// Restores previous state on exit.

export const focusModeAtom = atom(false);
export const zenModeAtom = atom(false);

/** Saved panel state before entering focus/zen mode */
const focusRestoreAtom = atom<{
  sidebar: boolean;
  agent: boolean;
  tray: boolean;
} | null>(null);

export const toggleFocusModeAtom = atom(null, (get, set) => {
  const isFocused = get(focusModeAtom);

  if (!isFocused) {
    // Enter focus mode — save current state, hide everything
    set(focusRestoreAtom, {
      sidebar: get(sidebarVisibleAtom),
      agent: get(agentPanelVisibleAtom),
      tray: get(trayVisibleAtom),
    });
    set(sidebarVisibleAtom, false);
    set(agentPanelVisibleAtom, false);
    set(trayVisibleAtom, false);
    set(focusModeAtom, true);
    set(zenModeAtom, false);
  } else {
    // Exit focus mode — restore saved state
    const restore = get(focusRestoreAtom);
    if (restore) {
      set(sidebarVisibleAtom, restore.sidebar);
      set(agentPanelVisibleAtom, restore.agent);
      set(trayVisibleAtom, restore.tray);
    }
    set(focusModeAtom, false);
    set(zenModeAtom, false);
    set(focusRestoreAtom, null);
  }
});

/** Zen Mode — hides ALL chrome (including StatusBar) + centers canvas */
export const toggleZenModeAtom = atom(null, (get, set) => {
  const isZen = get(zenModeAtom);

  if (!isZen) {
    if (!get(focusModeAtom)) {
      set(focusRestoreAtom, {
        sidebar: get(sidebarVisibleAtom),
        agent: get(agentPanelVisibleAtom),
        tray: get(trayVisibleAtom),
      });
    }
    set(sidebarVisibleAtom, false);
    set(agentPanelVisibleAtom, false);
    set(trayVisibleAtom, false);
    set(focusModeAtom, true);
    set(zenModeAtom, true);
  } else {
    const restore = get(focusRestoreAtom);
    if (restore) {
      set(sidebarVisibleAtom, restore.sidebar);
      set(agentPanelVisibleAtom, restore.agent);
      set(trayVisibleAtom, restore.tray);
    }
    set(focusModeAtom, false);
    set(zenModeAtom, false);
    set(focusRestoreAtom, null);
  }
});

// ─── Layout Presets ────────────────────────────────────

export type LayoutPreset = "coding" | "review" | "debug" | "presentation" | "agent-only";

const LAYOUT_PRESETS: Record<
  LayoutPreset,
  {
    sidebar: boolean;
    agent: boolean;
    tray: boolean;
    trayView?: string;
    surface?: SurfaceId;
  }
> = {
  coding: { sidebar: true, agent: true, tray: true, trayView: "terminal", surface: "editor" },
  review: { sidebar: true, agent: true, tray: true, trayView: "problems", surface: "review" },
  debug: { sidebar: false, agent: true, tray: true, trayView: "terminal", surface: "editor" },
  presentation: { sidebar: false, agent: false, tray: false, surface: "editor" },
  "agent-only": {
    sidebar: false,
    agent: true,
    tray: true,
    trayView: "agent-log",
    surface: "chat",
  },
};

// ─── Dynamic Layout Preset Registration ────────────────

type LayoutPresetConfig = (typeof LAYOUT_PRESETS)[LayoutPreset];

const dynamicPresets = new Map<string, LayoutPresetConfig>();

export function registerLayoutPreset(name: string, config: LayoutPresetConfig): void {
  dynamicPresets.set(name, config);
}

export function getLayoutPreset(name: string): LayoutPresetConfig | undefined {
  return (LAYOUT_PRESETS as Record<string, LayoutPresetConfig>)[name] ?? dynamicPresets.get(name);
}

export const applyLayoutPresetAtom = atom(null, (_get, set, preset: LayoutPreset) => {
  const config = getLayoutPreset(preset);
  if (!config) return;

  set(sidebarVisibleAtom, config.sidebar);
  set(agentPanelVisibleAtom, config.agent);
  set(trayVisibleAtom, config.tray);

  // RFC-016 §7.4: Validate View IDs against viewRegistry before applying
  if (config.trayView) {
    if (getViewById(config.trayView)) {
      set(activeTrayViewAtom, config.trayView);
    }
  }
  if (config.surface) set(activeSurfaceAtom, config.surface);
  set(focusModeAtom, false);
});

// ─── Center Split View ─────────────────────────────────

export type SplitDirection = "none" | "horizontal" | "vertical";

export const splitDirectionAtom = atom<SplitDirection>("none");
export const secondarySurfaceAtom = atom<SurfaceId | null>(null);
export const splitRatioAtom = atom(0.5); // 0..1

export const toggleSplitAtom = atom(null, (get, set, direction?: SplitDirection) => {
  const current = get(splitDirectionAtom);
  if (direction && current !== direction) {
    set(splitDirectionAtom, direction);
    if (!get(secondarySurfaceAtom)) {
      set(secondarySurfaceAtom, "editor");
    }
  } else {
    set(splitDirectionAtom, "none");
    set(secondarySurfaceAtom, null);
  }
});

// ─── Zoom ───────────────────────────────────────────────

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;

export const zoomLevelAtom = atom(1.0);

export const zoomInAtom = atom(null, (get, set) => {
  set(zoomLevelAtom, Math.min(ZOOM_MAX, +(get(zoomLevelAtom) + ZOOM_STEP).toFixed(2)));
});

export const zoomOutAtom = atom(null, (get, set) => {
  set(zoomLevelAtom, Math.max(ZOOM_MIN, +(get(zoomLevelAtom) - ZOOM_STEP).toFixed(2)));
});

export const zoomResetAtom = atom(null, (_get, set) => {
  set(zoomLevelAtom, 1.0);
});

// ─── Reset ───────────────────────────────────────────────

/** Reset all shell layout state to defaults */
export const resetShellLayoutAtom = atom(null, (_get, set) => {
  set(sidebarVisibleAtom, true);
  set(sidebarWidthAtom, 240);
  set(activeSidebarViewAtom, "file-tree");
  set(agentPanelVisibleAtom, true);
  set(agentPanelWidthAtom, 420);
  set(trayVisibleAtom, false);
  set(trayHeightAtom, 200);
  set(activeTrayViewAtom, "problems");
  set(trayMaximizedAtom, false);
  set(focusModeAtom, false);
  set(zenModeAtom, false);
  set(splitDirectionAtom, "none");
  set(secondarySurfaceAtom, null);
  set(splitRatioAtom, 0.5);
});

registerResetAtom(resetShellLayoutAtom);
