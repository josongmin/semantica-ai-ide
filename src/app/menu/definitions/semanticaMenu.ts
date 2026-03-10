import { ACTION_IDS, type MenuGroupDef } from "../types";

export function buildSemanticaMenu(): MenuGroupDef {
  return {
    id: "semantica",
    label: "Semantica",
    items: [
      { kind: "separator" },
      { kind: "action", id: ACTION_IDS.APP_PREFERENCES, label: "Preferences...", shortcut: "CmdOrCtrl+," },
      { kind: "action", id: ACTION_IDS.APP_AGENT_RULES, label: "Agent Rules..." },
      { kind: "action", id: ACTION_IDS.APP_MCP_SERVERS, label: "MCP Servers..." },
      { kind: "separator" },
    ],
  };
}
