/**
 * Edit menu action handlers.
 *
 * OS-handled edit actions (undo, redo, cut, copy, paste, select-all) are
 * registered as no-ops — Tauri/OS handles them natively.
 */
import { messageAtomFamily, messageOrderAtom } from "~entities/message";

import { conversationSearchOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";
import { logger } from "../../../shared/lib/logger";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import { registerMenuAction, registerMenuActions } from "../actionRegistry";
import { ACTION_IDS } from "../types";

// ── OS-handled Edit actions (no-op) ──
registerMenuActions(
  [
    ACTION_IDS.EDIT_UNDO,
    ACTION_IDS.EDIT_REDO,
    ACTION_IDS.EDIT_CUT,
    ACTION_IDS.EDIT_COPY,
    ACTION_IDS.EDIT_PASTE,
    ACTION_IDS.EDIT_SELECT_ALL,
  ],
  () => {
    // No-op: OS handles these natively
  },
);

// ── Copy Last Response ──
registerMenuAction(ACTION_IDS.EDIT_COPY_LAST_RESPONSE, (store) => {
  const ids = store.get(messageOrderAtom);
  // Walk backward to find the last assistant message
  for (let i = ids.length - 1; i >= 0; i--) {
    const id = ids[i];
    if (id === undefined) continue;
    const msg = store.get(messageAtomFamily(id));
    if (msg?.role === "assistant" && msg.text) {
      navigator.clipboard.writeText(msg.text).catch(() => {
        // Fallback for VS Code webview where clipboard API may be restricted
        getVscodeApi().postMessage({ type: "COPY_CONVERSATION" });
      });
      return;
    }
  }
  logger.debug("[menu] no assistant message to copy");
});

// ── Copy As Markdown ──
registerMenuAction(ACTION_IDS.EDIT_COPY_AS_MARKDOWN, (store) => {
  const messageIds = store.get(messageOrderAtom);
  const parts: string[] = [];
  let lastRole = "";

  for (const msgId of messageIds) {
    const msg = store.get(messageAtomFamily(msgId));
    if (!msg?.text || msg.role === "system") continue;

    if (msg.role !== lastRole) {
      if (parts.length > 0) parts.push("---\n");
      const label = msg.role === "user" ? "User" : "Assistant";
      parts.push(`### **${label}**\n`);
      lastRole = msg.role;
    }
    parts.push(msg.text);
    parts.push("");
  }

  const markdown = parts.join("\n").trim();
  if (!markdown) {
    logger.debug("[menu] no messages to export as markdown");
    return;
  }

  navigator.clipboard.writeText(markdown).catch(() => {
    getVscodeApi().postMessage({ type: "COPY_CONVERSATION" });
  });
});

// ── Find in Conversation ──
registerMenuAction(ACTION_IDS.EDIT_FIND, (store) => {
  store.set(conversationSearchOpenAtom, true);
});
