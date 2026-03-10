/**
 * Entity handlers -- orchestrator + misc entity handlers.
 *
 * Delegates domain-specific handlers to sub-modules:
 *   - messageHandlers   — messages, turns, bookmarks, NOP
 *   - sessionHandlers   — session meta, checkpoints, approval, fork
 *   - toolCallHandlers  — tool calls, approval, output
 *   - diffHandlers      — file changes
 *   - mcpHandlers       — MCP servers, tools, tool calls
 *   - pipelineHandlers  — turn-pipeline gates, strategy, validation, etc.
 *
 * Remaining misc handlers: memory, agent-instance, arena, browser, git,
 * review, remote, semantic-index, completion, timeline, compaction,
 * plan-checklist, project-todo, user-input, permissions.
 */
// Side-effect imports — each sub-module self-registers its handlers
import "./diffHandlers";
import "./mcpHandlers";
import "./messageHandlers";
import "./pipelineHandlers";
import "./sessionHandlers";
import "./toolCallHandlers";

import { removeAgentInstanceAtom, updateAgentStatusAtom, upsertAgentInstanceAtom } from "~entities/agent-instance";
import { appendArenaTextAtom, setArenaWinnerAtom, upsertArenaResponseAtom } from "~entities/arena";
import { setCompletionStatsAtom, updateCompletionSettingsAtom } from "~entities/completion-settings";
import { pushGitCommitAtom, setAutoCommitEnabledAtom } from "~entities/git-history";
import { deleteProjectTodoAtom, syncProjectTodosAtom, updateProjectTodoStatusAtom, upsertProjectTodoAtom } from "~entities/project-todo";
import { pushTimelineEventAtom } from "~entities/timeline-event";
import { setScopeGuardAtom } from "~shared/bootstrap/scope-guard";

import { clearBrowserConsoleAtom, pushBrowserConsoleAtom, updateBrowserStateAtom } from "../../../entities/browser";
import { addCompactionEventAtom } from "../../../entities/compaction-history";
import { pinMemoryRuleAtom, removeMemoryRuleAtom, setActiveRulesAtom, upsertMemoryRuleAtom } from "../../../entities/memory-rule";
import { updatePlanItemStatusAtom, upsertPlanChecklistAtom } from "../../../entities/plan-checklist";
import { pushRemoteCommandAtom, setRemoteStatusAtom } from "../../../entities/remote-control";
import { setReviewCommentsAtom, updateReviewCommentStatusAtom, upsertReviewCommentAtom } from "../../../entities/review-comment";
import { setIndexStatusAtom, setSearchResultsAtom, setSymbolMentionsAtom } from "../../../entities/semantic-index";
import { addAutoMemorySuggestionForTurnAtom, dismissAutoMemoryForTurnAtom } from "../../../features/auto-memory";
import { setCheckpointDiffAtom } from "../../../features/checkpoint-comparison";
import { setPatchSimulationAtom } from "../../../features/patch-simulation";
import { type CategoryPermission, setAllCategoryPermissionsAtom } from "../../../features/permission-settings";
import { setPrSummaryContentAtom } from "../../../features/pr-summary";
import { setShareLinkAtom } from "../../../features/session-share";
import { pushUserInputRequestAtom, removeUserInputAtom, updateUserInputAtom } from "../../../features/user-input";
import { setPendingQuoteAtom, setProgressAtom } from "../../../shared/lib";
import type { ServerEvent, TurnId } from "../../../shared/protocol";
import { registerHandler, type Store } from "./types";

// ── Self-registering handlers (side-effect at import time) ──

// ── Timeline ──
registerHandler("PUSH_TIMELINE", (e: ServerEvent, s: Store) => {
    if (e.t !== "PUSH_TIMELINE") return;
    s.set(pushTimelineEventAtom, e.event);
});

// ── Quote Context ──
registerHandler("SET_QUOTE_CONTEXT", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_QUOTE_CONTEXT") return;
  s.set(setPendingQuoteAtom, { message_id: e.message_id, text: e.quoted_text });
});

// ── Memory Rules ──
registerHandler("UPSERT_MEMORY_RULE", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_MEMORY_RULE") return;
  s.set(upsertMemoryRuleAtom, e.rule);
});
registerHandler("REMOVE_MEMORY_RULE", (e: ServerEvent, s: Store) => {
  if (e.t !== "REMOVE_MEMORY_RULE") return;
  s.set(removeMemoryRuleAtom, e.id);
});
registerHandler("DELETE_MEMORY_RULE", (e: ServerEvent, s: Store) => {
  if (e.t !== "DELETE_MEMORY_RULE") return;
  s.set(removeMemoryRuleAtom, e.id);
});
registerHandler("PIN_MEMORY_RULE", (e: ServerEvent, s: Store) => {
  if (e.t !== "PIN_MEMORY_RULE") return;
  s.set(pinMemoryRuleAtom, { id: e.id, pinned: e.pinned });
});
registerHandler("SUGGEST_AUTO_MEMORY", (e: ServerEvent, s: Store) => {
  if (e.t !== "SUGGEST_AUTO_MEMORY") return;
  s.set(addAutoMemorySuggestionForTurnAtom, e.suggestion);
});
registerHandler("DISMISS_AUTO_MEMORY", (e: ServerEvent, s: Store) => {
  if (e.t !== "DISMISS_AUTO_MEMORY") return;
  s.set(dismissAutoMemoryForTurnAtom, { id: e.id, turn_id: (e as Record<string, unknown>).turn_id as TurnId });
});
registerHandler("SET_ACTIVE_RULES", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_ACTIVE_RULES") return;
  s.set(setActiveRulesAtom, e.ids as readonly string[]);
});

// ── Compaction / Share / PR ──
registerHandler("LOG_COMPACTION", (e: ServerEvent, s: Store) => {
  if (e.t !== "LOG_COMPACTION") return;
  s.set(addCompactionEventAtom, e.event);
});
registerHandler("SET_SHARE_LINK", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SHARE_LINK") return;
  s.set(setShareLinkAtom, { session_id: e.session_id, link: e.link });
});
registerHandler("SET_PR_SUMMARY", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PR_SUMMARY") return;
  s.set(setPrSummaryContentAtom, e.summary);
});

// ── Plan Checklist ──
registerHandler("UPSERT_PLAN_CHECKLIST", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_PLAN_CHECKLIST") return;
  s.set(upsertPlanChecklistAtom, { turn_id: e.turn_id, items: e.items });
});
registerHandler("UPDATE_PLAN_ITEM", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_PLAN_ITEM") return;
  s.set(updatePlanItemStatusAtom, { turn_id: e.turn_id, item_id: e.item_id, status: e.status });
});

// ── Progress ──
registerHandler("SET_PROGRESS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PROGRESS") return;
  s.set(setProgressAtom, { key: e.key, value: e.value, max: e.max, label: e.label });
});

// ── Semantic Index / Patch / Scope ──
registerHandler("SET_SYMBOL_MENTIONS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SYMBOL_MENTIONS") return;
  s.set(setSymbolMentionsAtom, e.symbols);
});
registerHandler("SET_INDEX_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_INDEX_STATUS") return;
  s.set(setIndexStatusAtom, { status: e.status, progress: e.progress, file_count: e.file_count });
});
registerHandler("SET_SEARCH_RESULTS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SEARCH_RESULTS") return;
  s.set(setSearchResultsAtom, { query: e.query, results: e.results });
});
registerHandler("SET_PATCH_SIMULATION", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_PATCH_SIMULATION") return;
  s.set(setPatchSimulationAtom, {
    file_path: e.file_path, conflict_risk: e.conflict_risk,
    conflict_details: e.conflict_details, affected_files: e.affected_files,
  });
});
registerHandler("SET_SCOPE_GUARD", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SCOPE_GUARD") return;
  s.set(setScopeGuardAtom, { includes: e.includes, excludes: e.excludes });
});
registerHandler("SET_CATEGORY_PERMISSIONS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_CATEGORY_PERMISSIONS") return;
  const map = new Map(
    e.permissions.map((p) => [p.category, p.permission as CategoryPermission] as const),
  );
  s.set(setAllCategoryPermissionsAtom, map);
});

// ── Project Todos ──
registerHandler("SYNC_PROJECT_TODOS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SYNC_PROJECT_TODOS") return;
  s.set(syncProjectTodosAtom, e.todos);
});
registerHandler("UPSERT_PROJECT_TODO", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_PROJECT_TODO") return;
  s.set(upsertProjectTodoAtom, e.todo);
});
registerHandler("UPDATE_PROJECT_TODO_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_PROJECT_TODO_STATUS") return;
  s.set(updateProjectTodoStatusAtom, { id: e.id, status: e.status });
});
registerHandler("DELETE_PROJECT_TODO", (e: ServerEvent, s: Store) => {
  if (e.t !== "DELETE_PROJECT_TODO") return;
  s.set(deleteProjectTodoAtom, e.id);
});

// ── Parallel Agents ──
registerHandler("UPSERT_AGENT_INSTANCE", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_AGENT_INSTANCE") return;
  s.set(upsertAgentInstanceAtom, e.instance);
});
registerHandler("UPDATE_AGENT_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_AGENT_STATUS") return;
  s.set(updateAgentStatusAtom, { id: e.id, status: e.status, progress: e.progress, error_message: e.error_message });
});
registerHandler("REMOVE_AGENT_INSTANCE", (e: ServerEvent, s: Store) => {
  if (e.t !== "REMOVE_AGENT_INSTANCE") return;
  s.set(removeAgentInstanceAtom, e.id);
});

// ── Inline Completion ──
registerHandler("SET_COMPLETION_STATS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_COMPLETION_STATS") return;
  s.set(setCompletionStatsAtom, e.stats);
});
registerHandler("SET_COMPLETION_SETTINGS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_COMPLETION_SETTINGS") return;
  s.set(updateCompletionSettingsAtom, e.settings);
});

// ── Browser Preview ──
registerHandler("SET_BROWSER_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_BROWSER_STATE") return;
  s.set(updateBrowserStateAtom, e.state);
});
registerHandler("PUSH_BROWSER_CONSOLE", (e: ServerEvent, s: Store) => {
  if (e.t !== "PUSH_BROWSER_CONSOLE") return;
  s.set(pushBrowserConsoleAtom, e.entry);
});
registerHandler("CLEAR_BROWSER_CONSOLE", (e: ServerEvent, s: Store) => {
  if (e.t !== "CLEAR_BROWSER_CONSOLE") return;
  s.set(clearBrowserConsoleAtom);
});

// ── Arena Mode ──
registerHandler("UPSERT_ARENA_RESPONSE", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_ARENA_RESPONSE") return;
  s.set(upsertArenaResponseAtom, e.response);
});
registerHandler("APPEND_ARENA_TEXT", (e: ServerEvent, s: Store) => {
  if (e.t !== "APPEND_ARENA_TEXT") return;
  s.set(appendArenaTextAtom, { id: e.id, chunk: e.chunk });
});
registerHandler("SET_ARENA_WINNER", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_ARENA_WINNER") return;
  s.set(setArenaWinnerAtom, e.winner);
});

// ── Git Auto-Commit ──
registerHandler("PUSH_GIT_COMMIT", (e: ServerEvent, s: Store) => {
  if (e.t !== "PUSH_GIT_COMMIT") return;
  s.set(pushGitCommitAtom, e.commit);
});
registerHandler("SET_AUTO_COMMIT_ENABLED", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_AUTO_COMMIT_ENABLED") return;
  s.set(setAutoCommitEnabledAtom, e.enabled);
});

// ── AI Code Review ──
registerHandler("UPSERT_REVIEW_COMMENT", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_REVIEW_COMMENT") return;
  s.set(upsertReviewCommentAtom, e.comment);
});
registerHandler("UPDATE_REVIEW_COMMENT_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_REVIEW_COMMENT_STATUS") return;
  s.set(updateReviewCommentStatusAtom, { id: e.id, status: e.status });
});
registerHandler("SET_REVIEW_COMMENTS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_REVIEW_COMMENTS") return;
  s.set(setReviewCommentsAtom, { file_path: e.file_path, comments: e.comments });
});

// ── Remote Control ──
registerHandler("SET_REMOTE_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_REMOTE_STATUS") return;
  s.set(setRemoteStatusAtom, { status: e.status, qr_code_data_url: e.qr_code_data_url });
});
registerHandler("PUSH_REMOTE_COMMAND", (e: ServerEvent, s: Store) => {
  if (e.t !== "PUSH_REMOTE_COMMAND") return;
  s.set(pushRemoteCommandAtom, e.command);
});
registerHandler("SET_CHECKPOINT_DIFF", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_CHECKPOINT_DIFF") return;
  s.set(setCheckpointDiffAtom, { from_id: e.from_id, to_id: e.to_id, files: e.files });
});

// ── HITL: User Input ──
registerHandler("REQUEST_USER_INPUT", (e: ServerEvent, s: Store) => {
  if (e.t !== "REQUEST_USER_INPUT") return;
  s.set(pushUserInputRequestAtom, e.request);
});
registerHandler("UPDATE_USER_INPUT", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_USER_INPUT") return;
  s.set(updateUserInputAtom, { id: e.id, status: e.status, answer: e.answer });
});
registerHandler("CANCEL_USER_INPUT", (e: ServerEvent, s: Store) => {
  if (e.t !== "CANCEL_USER_INPUT") return;
  s.set(removeUserInputAtom, e.id);
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupEntityHandlers(): void {
  // Handlers are now registered at module scope.
}
