/**
 * Help menu action handlers.
 */
import { keyboardShortcutsOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";
import { logger } from "../../../shared/lib/logger";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import { dispatchIntentAtom } from "../../shell/model/intentRouter";
import { registerMenuAction } from "../actionRegistry";
import { ACTION_IDS } from "../types";

// ── Documentation ──
registerMenuAction(ACTION_IDS.HELP_DOCS, (_store) => {
  getVscodeApi().postMessage({
    type: "OPEN_PREVIEW_EXTERNAL",
    url: "https://docs.semantica.dev",
  });
});

// ── What's New ──
registerMenuAction(ACTION_IDS.HELP_WHATS_NEW, (_store) => {
  getVscodeApi().postMessage({
    type: "OPEN_PREVIEW_EXTERNAL",
    url: "https://docs.semantica.dev/changelog",
  });
});

// ── Keyboard Shortcuts ──
registerMenuAction(ACTION_IDS.HELP_KEYBOARD_SHORTCUTS, (store) => {
  store.set(keyboardShortcutsOpenAtom, true);
});

// ── Troubleshooting ──
registerMenuAction(ACTION_IDS.HELP_TROUBLESHOOTING, (_store) => {
  getVscodeApi().postMessage({
    type: "OPEN_PREVIEW_EXTERNAL",
    url: "https://docs.semantica.dev/troubleshooting",
  });
});

// ── Report Issue ──
registerMenuAction(ACTION_IDS.HELP_REPORT_ISSUE, (_store) => {
  getVscodeApi().postMessage({
    type: "OPEN_PREVIEW_EXTERNAL",
    url: "https://github.com/semantica-dev/semantica/issues/new",
  });
});

// ── Agent Status ──
registerMenuAction(ACTION_IDS.HELP_AGENTD_STATUS, (store) => {
  store.set(dispatchIntentAtom, { action: "show-view", viewId: "agent-log" });
  logger.debug("[menu] showing agent status panel");
});
