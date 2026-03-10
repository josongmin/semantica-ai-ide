import { ACTION_IDS, type MenuGroupDef, type MenuState } from "../types";

export function buildSessionMenu(state: MenuState): MenuGroupDef {
  return {
    id: "session",
    label: "Session",
    items: [
      { kind: "action", id: ACTION_IDS.SESSION_NEW, label: "New Session", shortcut: "CmdOrCtrl+N" },
      { kind: "action", id: ACTION_IDS.SESSION_NEW_FROM_TEMPLATE, label: "New from Template...", shortcut: "CmdOrCtrl+Shift+N" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.SESSION_OPEN_PROJECT, label: "Open Project...", shortcut: "CmdOrCtrl+O" },
      { kind: "action", id: ACTION_IDS.SESSION_SWITCH_PROJECT, label: "Switch Project...", shortcut: "CmdOrCtrl+Shift+P" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.SESSION_EXPORT, label: "Export Session...", shortcut: "CmdOrCtrl+Shift+E", enabled: state.hasActiveSession },
      { kind: "action", id: ACTION_IDS.SESSION_SHARE, label: "Share Session...", enabled: state.hasActiveSession },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.SESSION_CLOSE, label: "Close Session", shortcut: "CmdOrCtrl+W", enabled: state.hasActiveSession },
      { kind: "action", id: ACTION_IDS.SESSION_CLOSE_ALL, label: "Close All Sessions" },
    ],
  };
}
