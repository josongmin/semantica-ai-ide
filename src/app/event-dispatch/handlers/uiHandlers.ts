/**
 * UI handlers -- cases that update UI atoms:
 * session-list, current-page, available-models, project-files,
 * thinking-mode, fast-mode, notifications, and the RESET_STORES bulk reset.
 */
import {
  resetAgentStoreAtom,
} from "~entities/agent-instance";
import { resetArenaStoreAtom } from "~entities/arena";
import { resetCompletionStoreAtom } from "~entities/completion-settings";
import { resetDiffStoreAtom } from "~entities/diff";
import { resetGitStoreAtom } from "~entities/git-history";
import { resetMcpStoreAtom } from "~entities/mcp";
import { resetMessageStoreAtom } from "~entities/message/writers";
import { resetSessionStoreAtom } from "~entities/session/state";
import { resetTimelineStoreAtom } from "~entities/timeline-event";
import { resetToolCallStoreAtom } from "~entities/tool-call";
import { resetTurnPipelineStoreAtom } from "~entities/turn-pipeline";
import { resetOptimisticApprovalsAtom } from "~shared/bootstrap/approval-gate";
import { resetBackgroundJobsAtom } from "~shared/bootstrap/background-agent";
import { resetScopeGuardAtom } from "~shared/bootstrap/scope-guard";
import { resetMessageQueueAtom } from "~shared/bootstrap/send-message";
import { resetPrefetchedSessionsAtom } from "~shared/bootstrap/session-lifecycle";

import { resetBrowserStoreAtom } from "../../../entities/browser";
import { resetCompactionHistoryAtom } from "../../../entities/compaction-history";
import { resetMemoryRuleStoreAtom } from "../../../entities/memory-rule";
import { resetPlanChecklistStoreAtom } from "../../../entities/plan-checklist";
import { resetRemoteStoreAtom } from "../../../entities/remote-control";
import { resetReviewStoreAtom } from "../../../entities/review-comment";
import { resetSemanticIndexStoreAtom } from "../../../entities/semantic-index";
import { resetReplaySessionAtom } from "../../../features/action-replay";
import { resetAgentRulesAtom, resetRuleViolationsAtom } from "../../../features/agent-rules";
import { resetAgentSteerAtom } from "../../../features/agent-steer";
import { resetAgentTeamStoreAtom } from "../../../features/agent-team";
import { resetAgentWaveAtom } from "../../../features/agent-wave";
import { resetArchitectStateAtom } from "../../../features/architect-mode";
import { resetAuthStatusAtom } from "../../../features/auth-status";
import { resetAutoCompactAtom } from "../../../features/auto-compact";
import { resetAutoContextAtom } from "../../../features/auto-context";
import { resetAutoMemoryStoreAtom } from "../../../features/auto-memory";
import { resetBoomerangTasksStoreAtom } from "../../../features/boomerang-tasks";
import { resetBreadcrumbContextAtom } from "../../../features/breadcrumb-nav";
import { resetBrowserAutomationStoreAtom } from "../../../features/browser-automation";
import { resetBugbotStatusAtom } from "../../../features/bugbot-status";
import { resetCiCdStatusAtom } from "../../../features/ci-cd-status";
import { resetClickToEditStoreAtom } from "../../../features/click-to-edit";
import { resetContextSpacesStoreAtom } from "../../../features/context-spaces";
import { resetDebugStateAtom } from "../../../features/debug-state";
import { resetDeepWikiStoreAtom } from "../../../features/deep-wiki";
import { resetDeployStatusAtom } from "../../../features/deploy-status";
import { resetDiagnosticsAtom } from "../../../features/diagnostics";
import { resetExportStoreAtom } from "../../../features/export";
import { resetFileWatchAtom } from "../../../features/file-watch";
import { resetGanttEntriesAtom } from "../../../features/gantt-timeline";
import { resetHookEventsAtom } from "../../../features/hook-events";
import { resetIntegrationsStoreAtom } from "../../../features/integration-status";
import { resetLivePreviewStoreAtom } from "../../../features/live-preview";
import { resetLivingSpecAtom } from "../../../features/living-spec";
import { resetMachineSnapshotsStoreAtom } from "../../../features/machine-snapshots";
import { resetMcpRegistryAtom } from "../../../features/mcp-registry";
import { resetModeGalleryStoreAtom } from "../../../features/mode-gallery";
import { resetModelRoutesAtom } from "../../../features/model-routing";
import { resetDebateSessionAtom } from "../../../features/multi-agent-debate";
import { pushNotificationAtom,resetNotificationsAtom } from "../../../features/notifications";
import { resetMissionControlStoreAtom } from "../../../features/parallel-agents";
import { resetPatchSimulationAtom } from "../../../features/patch-simulation";
import { resetCategoryPermissionsAtom } from "../../../features/permission-settings";
import { resetPlaybookMarketStoreAtom } from "../../../features/playbook-market";
import { resetPluginStatusAtom } from "../../../features/plugin-status";
import { resetPrSummaryStoreAtom } from "../../../features/pr-summary";
import { resetPrivacyStateAtom } from "../../../features/privacy-mode";
import { resetPromptSuggestionsAtom } from "../../../features/prompt-suggestions";
import { resetPromptTemplatesStoreAtom } from "../../../features/prompt-templates";
import { resetQuotaStatusAtom } from "../../../features/quota-status";
import { resetSandboxStatusAtom } from "../../../features/sandbox-status";
import { resetScratchpadAtom } from "../../../features/scratchpad";
import { resetSecurityScanAtom } from "../../../features/security-scan";
import { resetSessionScheduleAtom } from "../../../features/session-schedule";
import { resetSessionShareStoreAtom } from "../../../features/session-share";
import { resetSpeculativeEditAtom } from "../../../features/speculative-edit";
import { resetTeamConfigStoreAtom } from "../../../features/team-config-sync";
import { resetTerminalOutputAtom } from "../../../features/terminal-output";
import { resetTestResultsAtom } from "../../../features/test-results";
import { resetThreeModelStoreAtom } from "../../../features/three-model";
import { resetThreeWayDiffStoreAtom } from "../../../features/three-way-diff";
import { resetTicketLinkStoreAtom } from "../../../features/ticket-link";
import { resetBookmarkStoreAtom } from "../../../features/turn-bookmark";
import { resetUsageStatsAtom } from "../../../features/usage-dashboard";
import { resetUserInputStoreAtom } from "../../../features/user-input";
import { resetVerifierResultAtom } from "../../../features/verifier-result";
import { resetVoiceInputStoreAtom } from "../../../features/voice-input";
import { resetWorktreeStatusAtom } from "../../../features/worktree-status";
import {
  currentPageAtom,
  fastModeAtom,
  resetProgressStoreAtom,
  resetUiStoreAtom,
  setAvailableModelsAtom,
  setProjectFilesAtom,
  setSessionListAtom,
  thinkingModeAtom,
  updateTabMetaAtom,
  workspaceNameAtom,
} from "../../../shared/lib";
import type { ServerEvent, SessionId } from "../../../shared/protocol";
import { registerHandler, type Store } from "./types";

/**
 * All reset atoms invoked on RESET_STORES.
 * Maintained as an array so new features only need to append here.
 */
const ALL_RESET_ATOMS = [
  resetMessageStoreAtom,
  resetMessageQueueAtom,
  resetDiffStoreAtom,
  resetToolCallStoreAtom,
  resetTimelineStoreAtom,
  resetSessionStoreAtom,
  resetUiStoreAtom,
  resetPlanChecklistStoreAtom,
  resetProgressStoreAtom,
  resetBookmarkStoreAtom,
  resetPatchSimulationAtom,
  resetScopeGuardAtom,
  resetMemoryRuleStoreAtom,
  resetAutoMemoryStoreAtom,
  resetCompactionHistoryAtom,
  resetSessionShareStoreAtom,
  resetPrSummaryStoreAtom,
  resetBoomerangTasksStoreAtom,
  resetMissionControlStoreAtom,
  resetArchitectStateAtom,
  resetModelRoutesAtom,
  resetMcpRegistryAtom,
  resetPrivacyStateAtom,
  resetScratchpadAtom,
  resetUsageStatsAtom,
  resetGanttEntriesAtom,
  resetThreeWayDiffStoreAtom,
  resetExportStoreAtom,
  resetTeamConfigStoreAtom,
  resetPromptTemplatesStoreAtom,
  resetThreeModelStoreAtom,
  resetDeepWikiStoreAtom,
  resetClickToEditStoreAtom,
  resetLivePreviewStoreAtom,
  resetVoiceInputStoreAtom,
  resetBrowserAutomationStoreAtom,
  resetMachineSnapshotsStoreAtom,
  resetModeGalleryStoreAtom,
  resetPlaybookMarketStoreAtom,
  resetContextSpacesStoreAtom,
  resetIntegrationsStoreAtom,
  resetTicketLinkStoreAtom,
  resetAgentTeamStoreAtom,
  resetAgentStoreAtom,
  resetSemanticIndexStoreAtom,
  resetMcpStoreAtom,
  resetCompletionStoreAtom,
  resetBrowserStoreAtom,
  resetArenaStoreAtom,
  resetGitStoreAtom,
  resetReviewStoreAtom,
  resetRemoteStoreAtom,
  resetAutoCompactAtom,
  resetBreadcrumbContextAtom,
  resetCategoryPermissionsAtom,
  resetOptimisticApprovalsAtom,
  resetPrefetchedSessionsAtom,
  // ── P0
  resetTerminalOutputAtom,
  resetTestResultsAtom,
  resetDiagnosticsAtom,
  resetQuotaStatusAtom,
  resetNotificationsAtom,
  resetAuthStatusAtom,
  // ── P1
  resetHookEventsAtom,
  resetWorktreeStatusAtom,
  resetFileWatchAtom,
  resetCiCdStatusAtom,
  resetSecurityScanAtom,
  resetDeployStatusAtom,
  resetPromptSuggestionsAtom,
  resetDebugStateAtom,
  // ── P2
  resetSandboxStatusAtom,
  resetPluginStatusAtom,
  resetAgentWaveAtom,
  resetVerifierResultAtom,
  resetLivingSpecAtom,
  resetSessionScheduleAtom,
  resetAgentSteerAtom,
  resetBugbotStatusAtom,
  // ── SOTA Features
  resetAgentRulesAtom,
  resetRuleViolationsAtom,
  resetAutoContextAtom,
  resetSpeculativeEditAtom,
  resetBackgroundJobsAtom,
  resetReplaySessionAtom,
  resetDebateSessionAtom,
  resetUserInputStoreAtom,
  // ── Pipeline (per-turn atomFamily)
  resetTurnPipelineStoreAtom,
] as const;

// ── Self-registering handlers (side-effect at import time) ──

registerHandler("RESET_STORES", (_e: ServerEvent, s: Store) => {
  for (const resetAtom of ALL_RESET_ATOMS) {
    s.set(resetAtom);
  }
});

registerHandler("SET_SESSION_LIST", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SESSION_LIST") return;
  s.set(setSessionListAtom, e.sessions);
});

registerHandler("SET_CURRENT_PAGE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_CURRENT_PAGE") return;
  s.set(currentPageAtom, e.page);
});

registerHandler("SET_AVAILABLE_MODELS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_AVAILABLE_MODELS") return;
  s.set(setAvailableModelsAtom, e.models);
});

registerHandler("SET_PROJECT_FILES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PROJECT_FILES") return;
  s.set(setProjectFilesAtom, e.files);
  if (e.workspace_name) {
    s.set(workspaceNameAtom, e.workspace_name);
  }
});

registerHandler("SET_THINKING_MODE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_THINKING_MODE") return;
  s.set(thinkingModeAtom, e.enabled);
});

registerHandler("SET_FAST_MODE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_FAST_MODE") return;
  s.set(fastModeAtom, e.enabled);
});

registerHandler("PUSH_NOTIFICATION", (e: ServerEvent, s: Store) => {
  if (e.t !== "PUSH_NOTIFICATION") return;
  s.set(pushNotificationAtom, e.notification);
});

registerHandler("SET_SESSION_TITLE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SESSION_TITLE") return;
  s.set(updateTabMetaAtom, {
    session_id: e.session_id as SessionId,
    updates: { title: e.title },
  });
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupUiHandlers(): void {
  // Handlers are now registered at module scope.
}
