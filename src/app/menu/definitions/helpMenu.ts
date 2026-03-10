import { ACTION_IDS, type MenuGroupDef } from "../types";

export function buildHelpMenu(): MenuGroupDef {
  return {
    id: "help",
    label: "Help",
    items: [
      { kind: "action", id: ACTION_IDS.HELP_DOCS, label: "Documentation" },
      { kind: "action", id: ACTION_IDS.HELP_WHATS_NEW, label: "What's New" },
      { kind: "action", id: ACTION_IDS.HELP_KEYBOARD_SHORTCUTS, label: "Keyboard Shortcuts", shortcut: "CmdOrCtrl+K CmdOrCtrl+S" },
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.HELP_TROUBLESHOOTING, label: "Troubleshooting" },
      { kind: "action", id: ACTION_IDS.HELP_REPORT_ISSUE, label: "Report Issue..." },
      { kind: "separator" },
      { kind: "status", id: "agentd-status", label: "agentd Status" },
      { kind: "action", id: ACTION_IDS.HELP_AGENTD_STATUS, label: "View agentd Details..." },
    ],
  };
}
