import { atom } from "jotai";

import type { SurfaceId } from "../../../shared/protocol/types/ui";
import { detachToFloatingAtom } from "./floatingAtoms";
import {
  activeSidebarViewAtom,
  activeSurfaceAtom,
  activeTrayViewAtom,
  agentPanelVisibleAtom,
  applyLayoutPresetAtom,
  type LayoutPreset,
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

export const dispatchIntentAtom = atom(null, (_get, set, intent: IntentAction) => {
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
      set(activeSurfaceAtom, intent.surfaceId);
      break;
    }
    case "toggle-frame": {
      if (intent.frame === "dock-left") set(sidebarVisibleAtom, (v) => !v);
      else if (intent.frame === "dock-right") set(agentPanelVisibleAtom, (v) => !v);
      else if (intent.frame === "tray") set(trayVisibleAtom, (v) => !v);
      break;
    }
    case "show-frame": {
      if (intent.frame === "dock-left") set(sidebarVisibleAtom, true);
      else if (intent.frame === "dock-right") set(agentPanelVisibleAtom, true);
      else if (intent.frame === "tray") set(trayVisibleAtom, true);
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
