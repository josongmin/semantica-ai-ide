import { ACTION_IDS, type MenuGroupDef } from "../types";

export function buildEditMenu(): MenuGroupDef {
  return {
    id: "edit",
    label: "Edit",
    items: [
      { kind: "action", id: ACTION_IDS.EDIT_UNDO, label: "Undo", shortcut: "CmdOrCtrl+Z" },
      { kind: "action", id: ACTION_IDS.EDIT_REDO, label: "Redo", shortcut: "CmdOrCtrl+Shift+Z" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.EDIT_CUT, label: "Cut", shortcut: "CmdOrCtrl+X" },
      { kind: "action", id: ACTION_IDS.EDIT_COPY, label: "Copy", shortcut: "CmdOrCtrl+C" },
      { kind: "action", id: ACTION_IDS.EDIT_PASTE, label: "Paste", shortcut: "CmdOrCtrl+V" },
      { kind: "action", id: ACTION_IDS.EDIT_SELECT_ALL, label: "Select All", shortcut: "CmdOrCtrl+A" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.EDIT_COPY_LAST_RESPONSE, label: "Copy Last Response", shortcut: "CmdOrCtrl+Shift+C" },
      { kind: "action", id: ACTION_IDS.EDIT_COPY_AS_MARKDOWN, label: "Copy as Markdown" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.EDIT_FIND, label: "Find in Conversation", shortcut: "CmdOrCtrl+F" },
    ],
  };
}
