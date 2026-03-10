/**
 * Session menu action handlers.
 */
import { sessionMetaAtom } from "~entities/session";

import { logger } from "../../../shared/lib/logger";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import { registerMenuAction } from "../actionRegistry";
import { ACTION_IDS } from "../types";

/** Guard: defaultMeta uses "" as SessionId — treat empty string as no session */
function hasActiveSession(sessionId: string): boolean {
  return sessionId.length > 0;
}

// ── New Session ──
registerMenuAction(ACTION_IDS.SESSION_NEW, (_store) => {
  getVscodeApi().postMessage({ type: "NEW_SESSION" });
});

// ── New From Template ──
registerMenuAction(ACTION_IDS.SESSION_NEW_FROM_TEMPLATE, (_store) => {
  getVscodeApi().postMessage({ type: "LOAD_PROMPT_TEMPLATES" });
});

// ── Open / Switch Project ──
registerMenuAction(ACTION_IDS.SESSION_OPEN_PROJECT, async (store) => {
  const { currentPageAtom } = await import("../../../shared/lib/atoms/uiAtoms");
  store.set(currentPageAtom, "sessions");
  getVscodeApi().postMessage({ type: "LOAD_SESSION_LIST" });
});

registerMenuAction(ACTION_IDS.SESSION_SWITCH_PROJECT, async (store) => {
  const { sessionSwitcherOpenAtom } = await import("../../../shared/lib/atoms/sessionTabAtoms");
  store.set(sessionSwitcherOpenAtom, true);
});

// ── Export Session ──
registerMenuAction(ACTION_IDS.SESSION_EXPORT, (store) => {
  const meta = store.get(sessionMetaAtom);
  if (!hasActiveSession(meta.session_id)) {
    logger.warn("[menu] cannot export: no active session");
    return;
  }
  getVscodeApi().postMessage({
    type: "EXPORT_MARKDOWN",
    session_id: meta.session_id,
    options: { include_diffs: true, include_tool_calls: true, include_timestamps: true },
  });
});

// ── Share Session ──
registerMenuAction(ACTION_IDS.SESSION_SHARE, (store) => {
  const meta = store.get(sessionMetaAtom);
  if (!hasActiveSession(meta.session_id)) {
    logger.warn("[menu] cannot share: no active session");
    return;
  }
  getVscodeApi().postMessage({
    type: "SHARE_SESSION",
    session_id: meta.session_id,
    options: { expires_in_hours: 72, mask_secrets: true },
  });
});

// ── Close Session ──
registerMenuAction(ACTION_IDS.SESSION_CLOSE, (store) => {
  const meta = store.get(sessionMetaAtom);
  if (hasActiveSession(meta.session_id)) {
    getVscodeApi().postMessage({ type: "DELETE_SESSION", session_id: meta.session_id });
  }
  getVscodeApi().postMessage({ type: "CLEAR_CONVERSATION" });
});

// ── Close All ──
registerMenuAction(ACTION_IDS.SESSION_CLOSE_ALL, async (store) => {
  const { sessionListAtom } = await import("../../../shared/lib/atoms/uiAtoms");
  const sessions = store.get(sessionListAtom);
  for (const s of sessions) {
    getVscodeApi().postMessage({ type: "DELETE_SESSION", session_id: s.session_id });
  }
  getVscodeApi().postMessage({ type: "CLEAR_CONVERSATION" });
});
