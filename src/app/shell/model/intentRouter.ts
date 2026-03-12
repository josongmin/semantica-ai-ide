import { atom } from "jotai";

import type { SurfaceId } from "../../../shared/protocol/types/ui";
import { getSurfaceLayout } from "../../surfaceRegistry";
import { detachToFloatingAtom } from "./floatingAtoms";
import {
  activeSidebarViewAtom,
  activeSurfaceAtom,
  activeTrayViewAtom,
  agentPanelVisibleAtom,
  applyLayoutPresetAtom,
  type LayoutPreset,
  restoreFrameStateAtom,
  saveFrameStateAtom,
  sidebarVisibleAtom,
  trayVisibleAtom,
} from "./shellAtoms";
import { type FrameSlot, getViewById } from "./viewRegistry";

// ─── Intent Router (RFC-016 §7.5) ─────────────────────────────
//
// dispatchIntentAtom is the ONLY public API for Feature/View → Shell
// communication. Features must NEVER import shellAtoms directly.

export type IntentAction =
  | { action: "show-view"; viewId: string; params?: Record<string, unknown> }
  | {
      action: "show-surface";
      surfaceId: SurfaceId;
      params?: Record<string, unknown>;
    }
  | { action: "toggle-frame"; frame: FrameSlot }
  | { action: "show-frame"; frame: FrameSlot }
  | { action: "apply-preset"; preset: LayoutPreset }
  | { action: "editor-command"; command: string; filePath: string; line: number };

export const dispatchIntentAtom = atom(null, (get, set, intent: IntentAction) => {
  switch (intent.action) {
    case "show-view": {
      const view = getViewById(intent.viewId);
      if (!view) return;
      const frame = view.defaultFrame;
      if (frame === "floating") {
        set(detachToFloatingAtom, intent.viewId);
      } else if (frame === "tray") {
        set(trayVisibleAtom, true);
        set(activeTrayViewAtom, intent.viewId);
      } else if (frame === "dock-left") {
        set(sidebarVisibleAtom, true);
        set(activeSidebarViewAtom, intent.viewId);
      } else {
        set(agentPanelVisibleAtom, true);
      }
      break;
    }
    case "show-surface": {
      // Save current surface frame state, switch, then restore target's state
      set(saveFrameStateAtom);
      set(activeSurfaceAtom, intent.surfaceId);
      set(restoreFrameStateAtom, intent.surfaceId);
      break;
    }
    case "toggle-frame": {
      // Respect surface layout constraints — only toggle if allowed
      const layout = getSurfaceLayout(get(activeSurfaceAtom));
      if (intent.frame === "dock-left" && layout.sidebar) set(sidebarVisibleAtom, (v) => !v);
      else if (intent.frame === "dock-right" && layout.agent) set(agentPanelVisibleAtom, (v) => !v);
      else if (intent.frame === "tray" && layout.tray) set(trayVisibleAtom, (v) => !v);
      break;
    }
    case "show-frame": {
      const showLayout = getSurfaceLayout(get(activeSurfaceAtom));
      if (intent.frame === "dock-left" && showLayout.sidebar) set(sidebarVisibleAtom, true);
      else if (intent.frame === "dock-right" && showLayout.agent) set(agentPanelVisibleAtom, true);
      else if (intent.frame === "tray" && showLayout.tray) set(trayVisibleAtom, true);
      break;
    }
    case "apply-preset": {
      set(applyLayoutPresetAtom, intent.preset);
      break;
    }
    case "editor-command": {
      // Editor commands are handled directly in EditorContextMenu
      // This intent type exists for extensibility and logging
      break;
    }
  }
});
