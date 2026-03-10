/**
 * App menu action handlers.
 *
 * Uses lazy imports (dynamic import()) to avoid coupling the menu system
 * to the full app atom graph at bundle time.
 */
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import { registerMenuAction } from "../actionRegistry";
import { ACTION_IDS } from "../types";

registerMenuAction(ACTION_IDS.APP_PREFERENCES, async (store) => {
  const { currentPageAtom } = await import("../../../shared/lib/atoms/uiAtoms");
  store.set(currentPageAtom, "settings");
});

registerMenuAction(ACTION_IDS.APP_AGENT_RULES, (_store) => {
  getVscodeApi().postMessage({ type: "LOAD_AGENT_RULES" });
});

registerMenuAction(ACTION_IDS.APP_MCP_SERVERS, async (store) => {
  const { mcpPanelVisibleAtom } = await import("../../../shared/lib/atoms/panelAtoms");
  store.set(mcpPanelVisibleAtom, true);
});
