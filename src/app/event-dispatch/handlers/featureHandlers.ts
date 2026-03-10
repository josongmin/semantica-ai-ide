/**
 * Feature handlers -- cases that update feature-specific atoms:
 * architect, model-routing, mcp-registry, privacy, scratchpad,
 * usage, gantt, three-way-diff, export, team-config, prompt-templates,
 * three-model, deep-wiki, click-to-edit, live-preview, voice-input,
 * browser-automation, machine-snapshots, mode-gallery, playbook-market,
 * context-spaces, integrations, ticket-link, agent-team,
 * boomerang-tasks, mission-control, terminal, test, diagnostics,
 * quota, auth, hook-events, worktree, file-watch, ci-cd, security,
 * deploy, prompt-suggestions, debug, sandbox, plugin, agent-wave,
 * verifier, living-spec, session-schedule, agent-steer, bugbot,
 * agent-rules, auto-context, speculative-edit, background-agent,
 * action-replay, multi-agent-debate.
 */
import { removeBackgroundJobAtom,upsertBackgroundJobAtom } from "~shared/bootstrap/background-agent";

import { setReplaySessionAtom } from "../../../features/action-replay";
// ── SOTA Features
import { pushRuleViolationAtom,setAgentRulesAtom } from "../../../features/agent-rules";
import { pushAgentSteerAtom } from "../../../features/agent-steer";
import { setAgentMessagesAtom } from "../../../features/agent-team";
import { setAgentWaveAtom } from "../../../features/agent-wave";
import { setArchitectStateAtom } from "../../../features/architect-mode";
import { setAuthStatusAtom } from "../../../features/auth-status";
import { setAutoContextForTurnAtom } from "../../../features/auto-context";
import { setBoomerangTasksAtom } from "../../../features/boomerang-tasks";
import { setBrowserActionsAtom } from "../../../features/browser-automation";
import { setBugbotStatusAtom } from "../../../features/bugbot-status";
import { setCiCdPipelineAtom } from "../../../features/ci-cd-status";
import { setElementMappingsAtom } from "../../../features/click-to-edit";
import { setContextSpacesAtom } from "../../../features/context-spaces";
import { setDebugStateAtom } from "../../../features/debug-state";
import { setWikiPagesAtom } from "../../../features/deep-wiki";
import { setDeployStatusAtom } from "../../../features/deploy-status";
import { setDiagnosticsAtom } from "../../../features/diagnostics";
import { setExportProgressAtom } from "../../../features/export";
import { pushExternalChangeAtom } from "../../../features/file-watch";
import { setGanttEntriesAtom } from "../../../features/gantt-timeline";
// ── P1: Hook, Worktree, FileWatch, CI/CD, Security, Deploy, Prompt, Debug
import { pushHookEventAtom } from "../../../features/hook-events";
import { setIntegrationsAtom } from "../../../features/integration-status";
import { setPreviewStateAtom } from "../../../features/live-preview";
import { setLivingSpecAtom } from "../../../features/living-spec";
import { setMachineSnapshotsAtom } from "../../../features/machine-snapshots";
import { setMcpRegistryAtom } from "../../../features/mcp-registry";
import { setModeGalleryAtom } from "../../../features/mode-gallery";
import { setModelRoutesAtom } from "../../../features/model-routing";
import { setDebateSessionAtom, setDebateSessionForTurnAtom } from "../../../features/multi-agent-debate";
import { setMissionControlAgentsAtom } from "../../../features/parallel-agents";
import { setPlaybookMarketAtom } from "../../../features/playbook-market";
import { setPluginListAtom } from "../../../features/plugin-status";
import { setPrivacyStateAtom } from "../../../features/privacy-mode";
import { pushPromptSuggestionAtom } from "../../../features/prompt-suggestions";
import { setPromptTemplatesAtom } from "../../../features/prompt-templates";
import { setQuotaStatusAtom } from "../../../features/quota-status";
// ── P2: Sandbox, Plugin, Wave, Verifier, Spec, Schedule, Steer, Bugbot
import { setSandboxStatusAtom } from "../../../features/sandbox-status";
import { setNotepadsAtom } from "../../../features/scratchpad";
import { setSecurityScanAtom } from "../../../features/security-scan";
import { setSessionSchedulesAtom } from "../../../features/session-schedule";
import { setSpeculativeEditForTurnAtom } from "../../../features/speculative-edit";
import { setTeamConfigAtom } from "../../../features/team-config-sync";
// ── P0: Terminal, Test, Lint, Quota, Auth
import { appendTerminalChunkAtom } from "../../../features/terminal-output";
import { setTestResultsAtom } from "../../../features/test-results";
import { setThreeModelStateAtom } from "../../../features/three-model";
import { pushThreeWayDiffAtom, resolveThreeWayDiffAtom } from "../../../features/three-way-diff";
import { setLinkedTicketAtom } from "../../../features/ticket-link";
import { setUsageStatsAtom } from "../../../features/usage-dashboard";
import { setVerifierResultAtom } from "../../../features/verifier-result";
import { setVoiceInputStateAtom } from "../../../features/voice-input";
import { setWorktreeStatusAtom } from "../../../features/worktree-status";
import type { ServerEvent, TurnId } from "../../../shared/protocol";
import { registerHandler, type Store } from "./types";

// ── Self-registering handlers (side-effect at import time) ──

registerHandler("SET_ARCHITECT_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_ARCHITECT_STATE") return;
  s.set(setArchitectStateAtom, e.state);
});

registerHandler("SET_MODEL_ROUTES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_MODEL_ROUTES") return;
  s.set(setModelRoutesAtom, e.routes);
});

registerHandler("SET_MCP_REGISTRY", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_MCP_REGISTRY") return;
  s.set(setMcpRegistryAtom, e.entries);
});

registerHandler("SET_PRIVACY_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PRIVACY_STATE") return;
  s.set(setPrivacyStateAtom, e.state);
});

registerHandler("SET_NOTEPADS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_NOTEPADS") return;
  s.set(setNotepadsAtom, e.notepads);
});

registerHandler("SET_USAGE_STATS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_USAGE_STATS") return;
  s.set(setUsageStatsAtom, e.stats);
});

registerHandler("SET_GANTT_ENTRIES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_GANTT_ENTRIES") return;
  s.set(setGanttEntriesAtom, e.entries);
});

registerHandler("SET_THREE_WAY_DIFF", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_THREE_WAY_DIFF") return;
  s.set(pushThreeWayDiffAtom, e.data);
});

registerHandler("RESOLVE_THREE_WAY_DIFF", (e: ServerEvent, s: Store) => {
  if (e.t !== "RESOLVE_THREE_WAY_DIFF") return;
  s.set(resolveThreeWayDiffAtom, { id: e.id, resolution: e.resolution });
});

registerHandler("SET_EXPORT_PROGRESS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_EXPORT_PROGRESS") return;
  s.set(setExportProgressAtom, {
    progress: e.progress,
    error_message: e.error_message,
  });
});

registerHandler("SET_TEAM_CONFIG", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_TEAM_CONFIG") return;
  s.set(setTeamConfigAtom, e.items);
});

registerHandler("SET_PROMPT_TEMPLATES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PROMPT_TEMPLATES") return;
  s.set(setPromptTemplatesAtom, e.templates);
});

registerHandler("SET_THREE_MODEL_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_THREE_MODEL_STATE") return;
  s.set(setThreeModelStateAtom, e.state);
});

registerHandler("SET_WIKI_PAGES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_WIKI_PAGES") return;
  s.set(setWikiPagesAtom, e.pages);
});

registerHandler("SET_ELEMENT_MAPPINGS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_ELEMENT_MAPPINGS") return;
  s.set(setElementMappingsAtom, e.mappings);
});

registerHandler("SET_PREVIEW_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PREVIEW_STATE") return;
  s.set(setPreviewStateAtom, e.state);
});

registerHandler("SET_VOICE_INPUT_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_VOICE_INPUT_STATE") return;
  s.set(setVoiceInputStateAtom, e.state);
});

registerHandler("SET_BROWSER_ACTIONS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_BROWSER_ACTIONS") return;
  s.set(setBrowserActionsAtom, e.actions);
});

registerHandler("SET_MACHINE_SNAPSHOTS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_MACHINE_SNAPSHOTS") return;
  s.set(setMachineSnapshotsAtom, e.snapshots);
});

registerHandler("SET_MODE_GALLERY", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_MODE_GALLERY") return;
  s.set(setModeGalleryAtom, e.entries);
});

registerHandler("SET_PLAYBOOK_MARKET", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PLAYBOOK_MARKET") return;
  s.set(setPlaybookMarketAtom, e.entries);
});

registerHandler("SET_CONTEXT_SPACES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_CONTEXT_SPACES") return;
  s.set(setContextSpacesAtom, e.spaces);
});

registerHandler("SET_INTEGRATIONS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_INTEGRATIONS") return;
  s.set(setIntegrationsAtom, e.connections);
});

registerHandler("SET_LINKED_TICKET", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_LINKED_TICKET") return;
  s.set(setLinkedTicketAtom, e.ticket);
});

registerHandler("SET_AGENT_MESSAGES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_AGENT_MESSAGES") return;
  s.set(setAgentMessagesAtom, e.messages);
});

registerHandler("SET_BOOMERANG_TASKS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_BOOMERANG_TASKS") return;
  s.set(setBoomerangTasksAtom, e.tasks);
});

registerHandler("SET_MISSION_CONTROL_AGENTS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_MISSION_CONTROL_AGENTS") return;
  s.set(setMissionControlAgentsAtom, e.agents);
});

// ── P0: Terminal, Test, Lint, Quota, Notification, Auth
registerHandler("APPEND_TERMINAL_OUTPUT", (e: ServerEvent, s: Store) => {
  if (e.t !== "APPEND_TERMINAL_OUTPUT") return;
  s.set(appendTerminalChunkAtom, e.chunk);
});

registerHandler("SET_TEST_RESULTS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_TEST_RESULTS") return;
  s.set(setTestResultsAtom, e.results);
});

registerHandler("SET_DIAGNOSTICS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_DIAGNOSTICS") return;
  s.set(setDiagnosticsAtom, {
    file_path: e.file_path,
    diagnostics: e.diagnostics,
  });
});

registerHandler("SET_QUOTA_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_QUOTA_STATUS") return;
  s.set(setQuotaStatusAtom, e.status);
});

registerHandler("SET_AUTH_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_AUTH_STATUS") return;
  s.set(setAuthStatusAtom, e.status);
});

// ── P1: Hook, Worktree, FileWatch, CI/CD, Security, Deploy, Prompt, Debug
registerHandler("SET_HOOK_EVENT", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_HOOK_EVENT") return;
  s.set(pushHookEventAtom, e.event);
});

registerHandler("SET_WORKTREE_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_WORKTREE_STATUS") return;
  s.set(setWorktreeStatusAtom, e.worktree);
});

registerHandler("FILE_CHANGE_EXTERNAL", (e: ServerEvent, s: Store) => {
  if (e.t !== "FILE_CHANGE_EXTERNAL") return;
  s.set(pushExternalChangeAtom, e.change);
});

registerHandler("SET_CI_CD_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_CI_CD_STATUS") return;
  s.set(setCiCdPipelineAtom, e.pipeline);
});

registerHandler("SET_SECURITY_SCAN", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SECURITY_SCAN") return;
  s.set(setSecurityScanAtom, e.scan);
});

registerHandler("SET_DEPLOY_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_DEPLOY_STATUS") return;
  s.set(setDeployStatusAtom, e.deploy);
});

registerHandler("PUSH_PROMPT_SUGGESTION", (e: ServerEvent, s: Store) => {
  if (e.t !== "PUSH_PROMPT_SUGGESTION") return;
  s.set(pushPromptSuggestionAtom, e.suggestion);
});

registerHandler("SET_DEBUG_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_DEBUG_STATE") return;
  s.set(setDebugStateAtom, e.state);
});

// ── P2: Sandbox, Plugin, Wave, Verifier, Spec, Schedule, Steer, Bugbot
registerHandler("SET_SANDBOX_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SANDBOX_STATUS") return;
  s.set(setSandboxStatusAtom, e.status);
});

registerHandler("SET_PLUGIN_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PLUGIN_STATUS") return;
  s.set(setPluginListAtom, e.plugins);
});

registerHandler("SET_AGENT_WAVE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_AGENT_WAVE") return;
  s.set(setAgentWaveAtom, e.wave);
});

registerHandler("SET_VERIFIER_RESULT", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_VERIFIER_RESULT") return;
  s.set(setVerifierResultAtom, e.result);
});

registerHandler("UPDATE_LIVING_SPEC", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_LIVING_SPEC") return;
  s.set(setLivingSpecAtom, e.spec);
});

registerHandler("SET_SESSION_SCHEDULE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SESSION_SCHEDULE") return;
  s.set(setSessionSchedulesAtom, e.schedules);
});

registerHandler("STEER_AGENT", (e: ServerEvent, s: Store) => {
  if (e.t !== "STEER_AGENT") return;
  s.set(pushAgentSteerAtom, e.steer);
});

registerHandler("SET_BUGBOT_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_BUGBOT_STATUS") return;
  s.set(setBugbotStatusAtom, e.status);
});

// ── SOTA Features
registerHandler("SET_AGENT_RULES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_AGENT_RULES") return;
  s.set(setAgentRulesAtom, e.rules);
});

registerHandler("PUSH_RULE_VIOLATION", (e: ServerEvent, s: Store) => {
  if (e.t !== "PUSH_RULE_VIOLATION") return;
  s.set(pushRuleViolationAtom, e.violation);
});

registerHandler("SET_AUTO_CONTEXT", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_AUTO_CONTEXT") return;
  s.set(setAutoContextForTurnAtom, { turn_id: e.turn_id, state: e.state });
});

registerHandler("SET_SPECULATIVE_EDITS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SPECULATIVE_EDITS") return;
  s.set(setSpeculativeEditForTurnAtom, { turn_id: e.turn_id, state: e.state });
});

registerHandler("UPSERT_BACKGROUND_JOB", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_BACKGROUND_JOB") return;
  s.set(upsertBackgroundJobAtom, e.job);
});

registerHandler("REMOVE_BACKGROUND_JOB", (e: ServerEvent, s: Store) => {
  if (e.t !== "REMOVE_BACKGROUND_JOB") return;
  s.set(removeBackgroundJobAtom, e.id);
});

registerHandler("SET_REPLAY_SESSION", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_REPLAY_SESSION") return;
  s.set(setReplaySessionAtom, e.session);
});

registerHandler("SET_DEBATE_SESSION", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_DEBATE_SESSION") return;
  s.set(setDebateSessionAtom, e.session);
  if ((e as Record<string, unknown>).turn_id) {
    s.set(setDebateSessionForTurnAtom, {
      turn_id: (e as Record<string, unknown>).turn_id as TurnId,
      session: e.session,
    });
  }
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupFeatureHandlers(): void {
  // Handlers are now registered at module scope.
}
