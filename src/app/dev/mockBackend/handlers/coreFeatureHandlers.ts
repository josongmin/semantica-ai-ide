/**
 * Core Feature Handlers (Tiers 4–7)
 *
 * Covers:
 * - Bookmarks, edit, compact
 * - Memory rules
 * - Prompt templates
 * - Project todos
 * - Export
 * - Diff operations, scope guard, permissions
 * - Checkpoint/restore
 * - Tool actions
 */
import type {
  MemoryRuleId,
  MessageId,
  ProjectTodoId,
  ToolCategory,
  TurnId,
} from "../../../../shared/protocol";
import {
  nextId,
  postServerEvent,
} from "../MockBackendCore";
import { createMockSessionState } from "../MockSessionState";
import type { Handler } from "./index";

// ── Constants ─────────────────────────────────────────────────

const MOCK_PROMPT_TEMPLATES = [
  { id: "tpl_1", name: "Bug Fix", description: "Fix a bug", template: "Fix the following bug: {{description}}", scope: "personal" as const },
  { id: "tpl_2", name: "Code Review", description: "Review code", template: "Review this code: {{code}}", scope: "team" as const },
  { id: "tpl_3", name: "Refactor", description: "Refactor code", template: "Refactor: {{target}}", scope: "personal" as const },
];

// ── Registration ──────────────────────────────────────────────

export function registerCoreFeatureHandlers(registry: Map<string, Handler>): void {
  // ── Tier 4: Bookmarks / Edit / Compact ──────────────────────

  registry.set("TOGGLE_BOOKMARK", (msg) => {
    postServerEvent({
      t: "TOGGLE_TURN_BOOKMARK",
      turn_id: msg.turn_id as TurnId,
      bookmarked: msg.bookmarked,
      bookmark_label: (msg.bookmark_label as "important" | "decision" | "fix" | "risk") ?? undefined,
    });
  });

  registry.set("EDIT_MESSAGE", (msg, ctx) => {
    const editTurnId = ctx.state.turnIds.at(-1) ?? (nextId("turn") as TurnId);
    postServerEvent({
      t: "UPSERT_MESSAGE",
      msg: {
        id: msg.messageId as MessageId,
        turn_id: editTurnId,
        role: "user",
        text: msg.text,
        status: "final",
        created_at_ms: Date.now(),
      },
    });
  });

  registry.set("COMPACT_CONTEXT", (_msg, ctx) => {
    postServerEvent({
      t: "LOG_COMPACTION",
      event: {
        id: nextId("compact"),
        timestamp_ms: Date.now(),
        tokens_before: ctx.state.tokensIn + ctx.state.tokensOut,
        tokens_after: Math.floor((ctx.state.tokensIn + ctx.state.tokensOut) * 0.6),
        summary: "Context compacted by mock backend",
      },
    });
  });

  registry.set("COMPACT_FROM_TURN", (msg, ctx) => {
    postServerEvent({
      t: "LOG_COMPACTION",
      event: {
        id: nextId("compact"),
        timestamp_ms: Date.now(),
        tokens_before: ctx.state.tokensIn + ctx.state.tokensOut,
        tokens_after: Math.floor((ctx.state.tokensIn + ctx.state.tokensOut) * 0.4),
        summary: `Summarized messages before turn ${msg.turn_id}`,
      },
    });
  });

  // ── Tier 4a: Memory ─────────────────────────────────────────

  registry.set("SAVE_MEMORY_RULE", (msg) => {
    postServerEvent({
      t: "UPSERT_MEMORY_RULE",
      rule: {
        id: nextId("rule") as MemoryRuleId,
        title: msg.title,
        content: msg.content,
        source: msg.source,
        active: true,
        created_at_ms: Date.now(),
      },
    });
  });

  registry.set("DELETE_MEMORY_RULE", (msg) => {
    postServerEvent({ t: "DELETE_MEMORY_RULE", id: msg.rule_id as MemoryRuleId });
  });

  registry.set("TOGGLE_MEMORY_RULE", (msg) => {
    postServerEvent({
      t: "UPSERT_MEMORY_RULE",
      rule: {
        id: msg.rule_id as MemoryRuleId,
        title: "Memory Rule",
        content: "",
        source: "user",
        active: msg.active,
        created_at_ms: Date.now(),
      },
    });
  });

  // ── Tier 4b: Prompt Templates ───────────────────────────────

  registry.set("LOAD_PROMPT_TEMPLATES", () => {
    postServerEvent({
      t: "SET_PROMPT_TEMPLATES",
      templates: MOCK_PROMPT_TEMPLATES,
    });
  });

  registry.set("SAVE_PROMPT_TEMPLATE", (msg) => {
    postServerEvent({
      t: "SET_PROMPT_TEMPLATES",
      templates: [
        ...MOCK_PROMPT_TEMPLATES,
        { id: nextId("tpl"), ...msg.template },
      ],
    });
  });

  registry.set("DELETE_PROMPT_TEMPLATE", () => {
    postServerEvent({ t: "SET_PROMPT_TEMPLATES", templates: MOCK_PROMPT_TEMPLATES });
  });

  registry.set("APPLY_PROMPT_TEMPLATE", (msg) => {
    const tpl = MOCK_PROMPT_TEMPLATES.find((t) => t.id === msg.template_id);
    // eslint-disable-next-line no-console
    console.log(`[mockBackend] Applied template "${tpl?.name ?? msg.template_id}"`);
    if (tpl) {
      postServerEvent({ t: "SET_PROMPT_TEMPLATES", templates: MOCK_PROMPT_TEMPLATES });
    }
  });

  // ── Tier 4c: Project Todos ──────────────────────────────────

  registry.set("LOAD_PROJECT_TODOS", () => {
    postServerEvent({ t: "SYNC_PROJECT_TODOS", todos: [] });
  });

  registry.set("ADD_PROJECT_TODO", (msg) => {
    postServerEvent({
      t: "UPSERT_PROJECT_TODO",
      todo: {
        id: nextId("todo") as ProjectTodoId,
        label: msg.label,
        priority: msg.priority,
        status: "pending",
        created_at_ms: Date.now(),
        updated_at_ms: Date.now(),
        source_session_ids: [],
      },
    });
  });

  registry.set("UPDATE_PROJECT_TODO", (msg) => {
    postServerEvent({
      t: "UPDATE_PROJECT_TODO_STATUS",
      id: msg.id as ProjectTodoId,
      status: msg.status,
    });
  });

  registry.set("DELETE_PROJECT_TODO", (msg) => {
    postServerEvent({ t: "DELETE_PROJECT_TODO", id: msg.id as ProjectTodoId });
  });

  // ── Tier 4d: Export ─────────────────────────────────────────

  const exportHandler: Handler = () => {
    postServerEvent({ t: "SET_EXPORT_PROGRESS", progress: "done" });
  };
  registry.set("EXPORT_SESSION", exportHandler);
  registry.set("EXPORT_HTML", exportHandler);
  registry.set("EXPORT_PDF", exportHandler);
  registry.set("EXPORT_MARKDOWN", exportHandler);

  // ── Tier 5: Diff operations ─────────────────────────────────

  registry.set("DIFF_APPROVE", (msg) => {
    postServerEvent({
      t: "UPSERT_FILE_CHANGE",
      file_change: {
        file_path: msg.file_path,
        turn_id: msg.turn_id,
        status: "modified",
        insertions: 0,
        deletions: 0,
        approval_status: "accepted",
      },
    });
  });

  registry.set("DIFF_REJECT", (msg) => {
    postServerEvent({
      t: "UPSERT_FILE_CHANGE",
      file_change: {
        file_path: msg.file_path,
        turn_id: msg.turn_id,
        status: "modified",
        insertions: 0,
        deletions: 0,
        approval_status: "rejected",
      },
    });
  });

  registry.set("DIFF_APPROVE_ALL", () => {
    // UI handles optimistically
  });
  registry.set("DIFF_REJECT_ALL", () => {
    // UI handles optimistically
  });

  registry.set("SET_SCOPE_GUARD", (msg) => {
    postServerEvent({
      t: "SET_SCOPE_GUARD",
      includes: msg.includes,
      excludes: msg.excludes,
    });
  });

  registry.set("SET_CATEGORY_PERMISSIONS", (msg) => {
    postServerEvent({
      t: "SET_CATEGORY_PERMISSIONS",
      permissions: msg.permissions.map((p: { category: string; permission: string }) => ({
        category: p.category as ToolCategory,
        permission: p.permission,
      })) as readonly { readonly category: ToolCategory; readonly permission: string }[],
    });
  });

  // ── Tier 6: Checkpoint/Restore ──────────────────────────────

  registry.set("RESTORE_CHECKPOINT", (msg, ctx) => {
    postServerEvent({ t: "RESET_STORES" });
    ctx.setState(createMockSessionState());
    // eslint-disable-next-line no-console
    console.log(`[mockBackend] Restored checkpoint ${msg.checkpoint_id}`);
  });

  registry.set("GET_CHECKPOINT_DIFF", (msg) => {
    postServerEvent({
      t: "SET_CHECKPOINT_DIFF",
      from_id: msg.from_id,
      to_id: msg.to_id,
      files: [
        { file_path: "src/routes/auth.ts", turn_id: "turn-1" as TurnId, status: "added", insertions: 45, deletions: 0, approval_status: "pending" },
        { file_path: "src/middleware/jwt.ts", turn_id: "turn-1" as TurnId, status: "added", insertions: 28, deletions: 0, approval_status: "pending" },
      ],
    });
  });

  // ── Tier 7: Tool actions ────────────────────────────────────

  registry.set("STOP_TOOL", (msg) => {
    postServerEvent({ t: "UPDATE_TOOL_CALL_STATUS", id: msg.tool_call_id, status: "error", result_summary: "Stopped by user" });
  });

  registry.set("RETRY_TOOL", (msg) => {
    postServerEvent({ t: "UPDATE_TOOL_CALL_STATUS", id: msg.tool_call_id, status: "running" });
    setTimeout(() => {
      postServerEvent({ t: "UPDATE_TOOL_CALL_STATUS", id: msg.tool_call_id, status: "success", result_summary: "Retry succeeded", duration_ms: 100 });
    }, 500);
  });

  // ── Three-Way Diff HITL ────────────────────────────────────
  registry.set("RESOLVE_THREE_WAY_DIFF", (msg, ctx) => {
    postServerEvent({ t: "RESOLVE_THREE_WAY_DIFF", id: msg.id, resolution: msg.resolution });
    ctx.pendingDiffResolve?.(msg.resolution);
    ctx.setPendingDiffResolve(null);
  });
}
