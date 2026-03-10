/**
 * Agent menu action handlers.
 *
 * Uses lazy imports (dynamic import()) to avoid coupling the menu system
 * to the full app atom graph at bundle time.
 */
import { logger } from "../../../shared/lib/logger";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { AgentRequestMode, ApprovalMode } from "../../../shared/protocol";
import { registerMenuAction } from "../actionRegistry";
import { ACTION_IDS } from "../types";

// ── Agent — Control ──
registerMenuAction(ACTION_IDS.AGENT_STOP, (_store) => {
  getVscodeApi().postMessage({ type: "STOP_AGENT" });
});

registerMenuAction(ACTION_IDS.AGENT_RETRY, async (store) => {
  const { messageOrderAtom } = await import("~entities/message");
  const ids = store.get(messageOrderAtom);
  const lastId = ids[ids.length - 1];
  if (lastId) {
    getVscodeApi().postMessage({ type: "RETRY_MESSAGE", messageId: lastId });
  }
});

// ── Agent — Approval Mode ──
// ApprovalMode = "auto" | "turbo"
// "auto" = auto-approve all, "turbo" = require approval for dangerous ops
// MANUAL maps to "turbo" (strictest approval mode available)
const approvalActions: [string, ApprovalMode][] = [
  [ACTION_IDS.AGENT_APPROVAL_AUTO, "auto"],
  [ACTION_IDS.AGENT_APPROVAL_SUGGEST, "turbo"],
  [ACTION_IDS.AGENT_APPROVAL_MANUAL, "turbo"],
];

for (const [actionId, mode] of approvalActions) {
  registerMenuAction(actionId as typeof ACTION_IDS.AGENT_APPROVAL_AUTO, async (store) => {
    const { approvalModeAtom } = await import("~entities/session/settings");
    store.set(approvalModeAtom, mode);
  });
}

// ── Agent — Request Mode ──
const requestModeActions: [string, AgentRequestMode][] = [
  [ACTION_IDS.AGENT_MODE_CODE, "code_analysis"],
  [ACTION_IDS.AGENT_MODE_ARCHITECT, "agent"],
  [ACTION_IDS.AGENT_MODE_PLAN, "plan"],
];

for (const [actionId, mode] of requestModeActions) {
  registerMenuAction(actionId as typeof ACTION_IDS.AGENT_MODE_CODE, async (store) => {
    const { agentRequestModeAtom } = await import(
      "../../../features/agent-request-mode/model/agentRequestModeAtom"
    );
    store.set(agentRequestModeAtom, mode);
  });
}

// ── Agent — Model ──
const MODEL_MAP: Record<string, string> = {
  [ACTION_IDS.AGENT_MODEL_OPUS]: "claude-opus-4-6",
  [ACTION_IDS.AGENT_MODEL_SONNET]: "claude-sonnet-4-6",
  [ACTION_IDS.AGENT_MODEL_HAIKU]: "claude-haiku-4-5-20251001",
};

for (const [actionId, modelId] of Object.entries(MODEL_MAP)) {
  registerMenuAction(actionId as typeof ACTION_IDS.AGENT_MODEL_OPUS, (_store) => {
    getVscodeApi().postMessage({ type: "SWITCH_MODEL", model_id: modelId });
  });
}

// ── Agent — Checkpoints ──
registerMenuAction(ACTION_IDS.AGENT_CHECKPOINT_LIST, async (store) => {
  const { rewindPanelOpenAtom } = await import("../../../shared/lib/atoms/dialogAtoms");
  store.set(rewindPanelOpenAtom, true);
});

registerMenuAction(ACTION_IDS.AGENT_CHECKPOINT_RESTORE, async (store) => {
  const { checkpointsAtom } = await import("~entities/session");
  const checkpoints = store.get(checkpointsAtom);
  const latest = checkpoints[checkpoints.length - 1];
  if (latest) {
    getVscodeApi().postMessage({ type: "RESTORE_CHECKPOINT", checkpoint_id: latest.id });
  } else {
    logger.warn("[menu] no checkpoints to restore");
  }
});

registerMenuAction(ACTION_IDS.AGENT_CHECKPOINT_COMPARE, async (store) => {
  const { checkpointsAtom } = await import("~entities/session");
  const checkpoints = store.get(checkpointsAtom);
  if (checkpoints.length >= 2) {
    const from = checkpoints[checkpoints.length - 2];
    const to = checkpoints[checkpoints.length - 1];
    if (from == null || to == null) return;
    getVscodeApi().postMessage({ type: "GET_CHECKPOINT_DIFF", from_id: from.id, to_id: to.id });
  } else {
    logger.warn("[menu] need at least 2 checkpoints to compare");
  }
});

// ── Agent — Background Agents & Scratchpad ──
registerMenuAction(ACTION_IDS.AGENT_BG_AGENTS, async (store) => {
  const { bgAgentsPanelVisibleAtom } = await import("../../../shared/lib/atoms/panelAtoms");
  store.set(bgAgentsPanelVisibleAtom, !store.get(bgAgentsPanelVisibleAtom));
});

registerMenuAction(ACTION_IDS.AGENT_SCRATCHPAD, async (store) => {
  const { scratchpadPanelVisibleAtom } = await import("../../../shared/lib/atoms/panelAtoms");
  store.set(scratchpadPanelVisibleAtom, !store.get(scratchpadPanelVisibleAtom));
});
