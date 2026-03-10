import { ACTION_IDS, type MenuGroupDef } from "../types";

export function buildNavigateMenu(): MenuGroupDef {
  return {
    id: "navigate",
    label: "Navigate",
    items: [
      { kind: "action", id: ACTION_IDS.NAV_GO_TO_TURN, label: "Go to Turn...", shortcut: "CmdOrCtrl+G" },
      { kind: "action", id: ACTION_IDS.NAV_PREV_TURN, label: "Previous Turn", shortcut: "CmdOrCtrl+Up" },
      { kind: "action", id: ACTION_IDS.NAV_NEXT_TURN, label: "Next Turn", shortcut: "CmdOrCtrl+Down" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.NAV_GO_TO_FILE_CHANGE, label: "Go to File Change..." },
      { kind: "action", id: ACTION_IDS.NAV_GO_TO_BOOKMARK, label: "Go to Bookmark...", shortcut: "CmdOrCtrl+Shift+B" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.NAV_QUICK_FILE_OPEN, label: "Quick File Open", shortcut: "CmdOrCtrl+P" },
      { kind: "action", id: ACTION_IDS.NAV_SEARCH_SYMBOLS, label: "Search Symbols", shortcut: "CmdOrCtrl+Shift+O" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.NAV_BACK, label: "Back", shortcut: "CmdOrCtrl+[" },
      { kind: "action", id: ACTION_IDS.NAV_FORWARD, label: "Forward", shortcut: "CmdOrCtrl+]" },
    ],
  };
}
