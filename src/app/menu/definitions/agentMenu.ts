import { ACTION_IDS, type AgentStatus, type MenuGroupDef, type MenuState } from "../types";

function agentLabel(status: AgentStatus): string {
  switch (status) {
    case "thinking":          return "Agent \u{1F7E1}";
    case "tool_running":      return "Agent \u{1F535}";
    case "awaiting_approval": return "Agent \u{1F534}";
    case "error":             return "Agent \u2715";
    case "idle":              return "Agent";
  }
}

function statusDescription(status: AgentStatus): string {
  switch (status) {
    case "thinking":          return "Thinking...";
    case "tool_running":      return "Running tool...";
    case "awaiting_approval": return "Awaiting approval";
    case "error":             return "Error occurred";
    case "idle":              return "Idle";
  }
}

export function buildAgentMenu(state: MenuState): MenuGroupDef {
  const isRunning = state.agentStatus !== "idle" && state.agentStatus !== "error";

  return {
    id: "agent",
    label: agentLabel(state.agentStatus),
    items: [
      // Live status (disabled, info-only)
      { kind: "status", id: "agent-status", label: statusDescription(state.agentStatus) },
      { kind: "separator" },

      // Control
      { kind: "action", id: ACTION_IDS.AGENT_STOP, label: "Stop Agent", shortcut: "CmdOrCtrl+Shift+S", enabled: isRunning },
      { kind: "action", id: ACTION_IDS.AGENT_RETRY, label: "Retry Last Turn", shortcut: "CmdOrCtrl+Shift+R" },
      { kind: "separator" },

      // Approval Mode
      { kind: "submenu", id: "approval-mode", label: "Approval Mode", items: [
        { kind: "radio", id: ACTION_IDS.AGENT_APPROVAL_AUTO, label: "Auto", group: "approval", selected: state.approvalMode === "auto" },
        { kind: "radio", id: ACTION_IDS.AGENT_APPROVAL_SUGGEST, label: "Turbo", group: "approval", selected: state.approvalMode === "turbo" },
        { kind: "radio", id: ACTION_IDS.AGENT_APPROVAL_MANUAL, label: "Manual", group: "approval", selected: false },
      ]},

      // Request Mode
      { kind: "submenu", id: "request-mode", label: "Request Mode", items: [
        { kind: "radio", id: ACTION_IDS.AGENT_MODE_CODE, label: "Code", group: "reqmode", selected: state.requestMode === "code" },
        { kind: "radio", id: ACTION_IDS.AGENT_MODE_ARCHITECT, label: "Architect", group: "reqmode", selected: state.requestMode === "architect" },
        { kind: "radio", id: ACTION_IDS.AGENT_MODE_PLAN, label: "Plan", group: "reqmode", selected: state.requestMode === "plan" },
      ]},

      // Model
      { kind: "submenu", id: "model", label: "Model", items: [
        { kind: "radio", id: ACTION_IDS.AGENT_MODEL_OPUS, label: "Claude Opus", group: "model", selected: state.currentModel === "opus" },
        { kind: "radio", id: ACTION_IDS.AGENT_MODEL_SONNET, label: "Claude Sonnet", group: "model", selected: state.currentModel === "sonnet" },
        { kind: "radio", id: ACTION_IDS.AGENT_MODEL_HAIKU, label: "Claude Haiku", group: "model", selected: state.currentModel === "haiku" },
      ]},
      { kind: "separator" },

      // Checkpoints
      { kind: "submenu", id: "checkpoints", label: "Checkpoints", items: [
        { kind: "action", id: ACTION_IDS.AGENT_CHECKPOINT_LIST, label: "View All Checkpoints..." },
        { kind: "action", id: ACTION_IDS.AGENT_CHECKPOINT_RESTORE, label: "Restore Last" },
        { kind: "action", id: ACTION_IDS.AGENT_CHECKPOINT_COMPARE, label: "Compare with Current..." },
      ]},
      { kind: "separator" },

      { kind: "action", id: ACTION_IDS.AGENT_BG_AGENTS, label: "Background Agents..." },
      { kind: "action", id: ACTION_IDS.AGENT_SCRATCHPAD, label: "Scratchpad" },
    ],
  };
}
