import { ACTION_IDS, type MenuGroupDef, type MenuState } from "../types";

export function buildViewMenu(state: MenuState): MenuGroupDef {
  return {
    id: "view",
    label: "View",
    items: [
      // Zoom shortcuts are handled natively by Tauri (zoomHotkeysEnabled).
      // Do NOT register accelerators here — they intercept the event before Tauri's native handler.
      { kind: "action", id: ACTION_IDS.VIEW_ZOOM_IN, label: "Zoom In" },
      { kind: "action", id: ACTION_IDS.VIEW_ZOOM_OUT, label: "Zoom Out" },
      { kind: "action", id: ACTION_IDS.VIEW_ZOOM_RESET, label: "Reset Zoom" },
      { kind: "separator" },
      {
        kind: "action",
        id: ACTION_IDS.VIEW_PAGE_SESSIONS,
        label: "Sessions",
        shortcut: "CmdOrCtrl+1",
      },
      { kind: "action", id: ACTION_IDS.VIEW_PAGE_ARENA, label: "Arena", shortcut: "CmdOrCtrl+2" },
      {
        kind: "action",
        id: ACTION_IDS.VIEW_PAGE_REVIEW,
        label: "Review Board",
        shortcut: "CmdOrCtrl+3",
      },
      {
        kind: "action",
        id: ACTION_IDS.VIEW_PAGE_TODOS,
        label: "Todo Board",
        shortcut: "CmdOrCtrl+4",
      },
      { kind: "separator" },
      {
        kind: "check",
        id: ACTION_IDS.VIEW_TOGGLE_SIDEBAR,
        label: "Sidebar",
        checked: state.sidebarVisible,
      },
      {
        kind: "check",
        id: ACTION_IDS.VIEW_TOGGLE_FEATURE_BAR,
        label: "Feature Bar",
        checked: state.featureBarVisible,
      },
      { kind: "separator" },
      {
        kind: "action",
        id: ACTION_IDS.VIEW_WORKSPACE_GRAPH,
        label: "Workspace Graph",
        shortcut: "CmdOrCtrl+Shift+G",
      },
      { kind: "action", id: ACTION_IDS.VIEW_FILE_CHANGES, label: "File Changes" },
      { kind: "action", id: ACTION_IDS.VIEW_SYMBOL_PANEL, label: "Symbol Panel" },
      { kind: "separator" },
      {
        kind: "check",
        id: ACTION_IDS.VIEW_FOCUS_MODE,
        label: "Focus Mode",
        checked: state.focusMode,
      },
    ],
  };
}
