/**
 * Extended Feature Handlers (Tiers 9–25)
 *
 * Covers:
 * - Arena mode
 * - Git operations
 * - Session share & PR
 * - Notepad
 * - Machine snapshots
 * - Mode gallery & Playbook market
 * - Context spaces
 * - Integrations & Tickets
 * - Agents & Team config
 * - Code review
 * - Remote control
 * - Search & Index
 * - Browser & Voice
 */
import type {
  AgentInstanceId,
  ArenaResponseId,
  GitCommitId,
  ReviewCommentId,
  TurnId,
} from "../../../../shared/protocol";
import {
  abortableSleep,
  nextId,
  postServerEvent,
  postServerEvents,
} from "../MockBackendCore";
import type { Handler } from "./index";

// ── Registration ──────────────────────────────────────────────

export function registerExtendedFeatureHandlers(registry: Map<string, Handler>): void {
  // ── Tier 9: Arena Mode ──────────────────────────────────────

  registry.set("ARENA_SET_MODELS", (msg) => {
    postServerEvents([
      {
        t: "UPSERT_ARENA_RESPONSE",
        response: {
          id: nextId("arena-a") as ArenaResponseId,
          slot: "A",
          model_id: msg.model_a,
          model_label: msg.model_a,
          text: "",
          status: "final",
          created_at_ms: Date.now(),
        },
      },
      {
        t: "UPSERT_ARENA_RESPONSE",
        response: {
          id: nextId("arena-b") as ArenaResponseId,
          slot: "B",
          model_id: msg.model_b,
          model_label: msg.model_b,
          text: "",
          status: "final",
          created_at_ms: Date.now(),
        },
      },
    ]);
  });

  registry.set("ARENA_SEND_PROMPT", (msg, ctx) => {
    ctx.activeAbort?.abort();
    const abort = new AbortController();
    ctx.setActiveAbort(abort);
    void handleArenaSend(msg.text, abort.signal);
  });

  registry.set("ARENA_SELECT_WINNER", (msg) => {
    postServerEvent({ t: "SET_ARENA_WINNER", winner: msg.winner });
  });

  // ── Tier 10: Git ────────────────────────────────────────────

  registry.set("GIT_UNDO_COMMIT", () => {
    postServerEvent({
      t: "PUSH_GIT_COMMIT",
      commit: {
        id: nextId("gc") as GitCommitId,
        sha: `revert-${Date.now().toString(16).slice(-7)}`,
        message: "Revert: undo last commit",
        timestamp_ms: Date.now(),
        auto: false,
      },
    });
  });

  registry.set("TOGGLE_AUTO_COMMIT", (msg) => {
    postServerEvent({ t: "SET_AUTO_COMMIT_ENABLED", enabled: msg.enabled });
  });

  // ── Tier 11: Session Share & PR ─────────────────────────────

  registry.set("SHARE_SESSION", (_msg, ctx) => {
    postServerEvent({
      t: "SET_SHARE_LINK",
      session_id: ctx.state.sessionId,
      link: {
        url: `https://share.example.com/${nextId("share")}`,
        expires_at_ms: Date.now() + 24 * 60 * 60 * 1000,
        masked: true,
      },
    });
  });

  registry.set("GENERATE_PR_SUMMARY", () => {
    postServerEvent({
      t: "SET_PR_SUMMARY",
      summary: {
        title: "feat: implement changes",
        intent: "Mock backend generated PR summary",
        changes: [
          { file_path: "src/app.ts", turn_id: "turn-1" as TurnId, status: "modified", insertions: 10, deletions: 3, approval_status: "pending" },
        ],
        todos: ["Add unit tests", "Update documentation"],
      },
    });
  });

  registry.set("OPEN_PR_IN_GITHUB", () => {
    // noop
  });

  // ── Tier 12: Notepad ────────────────────────────────────────

  registry.set("SAVE_NOTEPAD", (msg) => {
    postServerEvent({
      t: "SET_NOTEPADS",
      notepads: [
        { id: msg.notepad_id, title: msg.title, content: msg.content, updated_at_ms: Date.now() },
      ],
    });
  });

  registry.set("DELETE_NOTEPAD", () => {
    postServerEvent({ t: "SET_NOTEPADS", notepads: [] });
  });

  // ── Tier 13: Machine Snapshots ──────────────────────────────

  registry.set("CREATE_SNAPSHOT", (msg) => {
    postServerEvent({
      t: "SET_MACHINE_SNAPSHOTS",
      snapshots: [
        { id: nextId("snap"), label: msg.label ?? "Snapshot", created_at_ms: Date.now(), size_mb: 250, status: "ready" },
      ],
    });
  });

  registry.set("RESTORE_SNAPSHOT_ENV", (msg) => {
    postServerEvent({
      t: "SET_MACHINE_SNAPSHOTS",
      snapshots: [
        { id: msg.snapshot_id, label: "Restored Snapshot", created_at_ms: Date.now(), size_mb: 250, status: "restoring" },
      ],
    });
    setTimeout(() => {
      postServerEvent({
        t: "SET_MACHINE_SNAPSHOTS",
        snapshots: [
          { id: msg.snapshot_id, label: "Restored Snapshot", created_at_ms: Date.now(), size_mb: 250, status: "ready" },
        ],
      });
    }, 2000);
  });

  registry.set("DELETE_SNAPSHOT", () => {
    postServerEvent({ t: "SET_MACHINE_SNAPSHOTS", snapshots: [] });
  });

  // ── Tier 14: Mode Gallery ───────────────────────────────────

  registry.set("INSTALL_MODE", (msg) => {
    postServerEvent({
      t: "SET_MODE_GALLERY",
      entries: [
        { id: msg.mode_id, name: "Installed Mode", description: "Mock installed mode", author: "user", rating: 4.5, install_count: 1, installed: true, categories: ["custom"] },
      ],
    });
  });

  registry.set("UNINSTALL_MODE", (msg) => {
    postServerEvent({
      t: "SET_MODE_GALLERY",
      entries: [
        { id: msg.mode_id, name: "Uninstalled Mode", description: "Mock mode", author: "user", rating: 4.5, install_count: 0, installed: false, categories: ["custom"] },
      ],
    });
  });

  // ── Tier 15: Playbook Market ────────────────────────────────

  registry.set("INSTALL_PLAYBOOK", (msg) => {
    postServerEvent({
      t: "SET_PLAYBOOK_MARKET",
      entries: [
        { id: msg.playbook_id, name: "Installed Playbook", description: "Mock playbook", version: "1.0.0", author: "user", rating: 4.5, installed: true, category: "custom" },
      ],
    });
  });

  registry.set("UNINSTALL_PLAYBOOK", (msg) => {
    postServerEvent({
      t: "SET_PLAYBOOK_MARKET",
      entries: [
        { id: msg.playbook_id, name: "Playbook", description: "Mock playbook", version: "1.0.0", author: "user", rating: 4.5, installed: false, category: "custom" },
      ],
    });
  });

  // Note: APPLY_PLAYBOOK needs handleSendMessage — registered in streamingHandlers

  // ── Tier 16: Context Spaces ─────────────────────────────────

  registry.set("CREATE_CONTEXT_SPACE", (msg) => {
    postServerEvent({
      t: "SET_CONTEXT_SPACES",
      spaces: [
        { id: nextId("cs"), name: msg.name, description: msg.description, files: [], rules: [], active: true },
      ],
    });
  });

  registry.set("UPDATE_CONTEXT_SPACE", (msg) => {
    postServerEvent({
      t: "SET_CONTEXT_SPACES",
      spaces: [
        { id: msg.space_id, name: "Updated", description: "", files: [], rules: [], active: true, ...msg.updates },
      ],
    });
  });

  registry.set("DELETE_CONTEXT_SPACE", () => {
    postServerEvent({ t: "SET_CONTEXT_SPACES", spaces: [] });
  });

  // ── Tier 17: Integrations ───────────────────────────────────

  registry.set("SEND_INTEGRATION_UPDATE", (msg) => {
    postServerEvent({
      t: "SET_INTEGRATIONS",
      connections: [
        {
          id: msg.connection_id,
          platform: "slack",
          channel: "#dev",
          status: "connected",
          last_sync_ms: Date.now(),
        },
      ],
    });
  });

  registry.set("DISCONNECT_INTEGRATION", (msg) => {
    postServerEvent({
      t: "SET_INTEGRATIONS",
      connections: [
        { id: msg.connection_id, platform: "slack", channel: "#dev", status: "disconnected" },
      ],
    });
  });

  // ── Tier 18: Ticket Link ────────────────────────────────────

  registry.set("LINK_TICKET", (msg) => {
    postServerEvent({
      t: "SET_LINKED_TICKET",
      ticket: {
        id: nextId("ticket"),
        key: msg.ticket_key,
        title: `Ticket ${msg.ticket_key}`,
        status: "In Progress",
        platform: msg.platform as "linear" | "jira" | "github",
        url: `https://${msg.platform}.app/team/${msg.ticket_key}`,
      },
    });
  });

  registry.set("UNLINK_TICKET", () => {
    postServerEvent({ t: "SET_LINKED_TICKET", ticket: null });
  });

  registry.set("SYNC_TICKET_STATUS", (msg) => {
    postServerEvent({
      t: "SET_LINKED_TICKET",
      ticket: {
        id: msg.ticket_id,
        key: "PROJ-42",
        title: "Implement feature X",
        status: "In Review",
        platform: "linear",
        url: `https://linear.app/team/PROJ-42`,
      },
    });
  });

  // ── Tier 19: Agents ─────────────────────────────────────────

  registry.set("SPAWN_AGENT", (msg, ctx) => {
    const agentId = nextId("agent") as AgentInstanceId;
    postServerEvent({
      t: "UPSERT_AGENT_INSTANCE",
      instance: {
        id: agentId,
        label: msg.label ?? "Spawned agent",
        status: "running",
        progress: 0,
        model_id: msg.model_id ?? ctx.state.activeModel,
        created_at_ms: Date.now(),
      },
    });
    setTimeout(() => {
      postServerEvent({ t: "UPDATE_AGENT_STATUS", id: agentId, status: "success", progress: 100 });
    }, 3000);
  });

  registry.set("CANCEL_AGENT", (msg) => {
    postServerEvent({
      t: "UPDATE_AGENT_STATUS",
      id: msg.agent_id as AgentInstanceId,
      status: "error",
      error_message: "Cancelled by user",
    });
  });

  registry.set("SEND_AGENT_INTERVENTION", (msg) => {
    postServerEvent({
      t: "UPDATE_AGENT_STATUS",
      id: msg.agent_id as AgentInstanceId,
      status: "running",
      progress: 50,
    });
    // eslint-disable-next-line no-console
    console.log(`[mockBackend] Agent ${msg.agent_id} received intervention: "${msg.message}"`);
  });

  // ── Tier 20: Team Config ────────────────────────────────────

  registry.set("SYNC_TEAM_CONFIG", (_msg, ctx) => {
    postServerEvent({
      t: "SET_TEAM_CONFIG",
      items: [
        { key: "model", local_value: ctx.state.activeModel, team_value: "claude-sonnet-4-6", status: "different" },
        { key: "approval_mode", local_value: ctx.state.approvalMode, team_value: "auto", status: "same" },
      ],
    });
  });

  registry.set("APPLY_CONFIG_CHOICE", (msg) => {
    let resolvedValue: string;
    if (msg.choice === "team") {
      resolvedValue = "team-default";
    } else if (msg.choice === "local") {
      resolvedValue = "local-value";
    } else {
      resolvedValue = "merged-value";
    }
    postServerEvent({
      t: "SET_TEAM_CONFIG",
      items: [
        {
          key: msg.key,
          local_value: resolvedValue,
          team_value: resolvedValue,
          status: "same",
        },
      ],
    });
  });

  // ── Tier 21: Code Review ────────────────────────────────────

  registry.set("REQUEST_CODE_REVIEW", (msg) => {
    postServerEvent({
      t: "UPSERT_REVIEW_COMMENT",
      comment: {
        id: nextId("rc") as ReviewCommentId,
        file_path: msg.file_path ?? "src/app.ts",
        line: 10,
        line_start: 10,
        line_end: 12,
        text: "Consider extracting this logic",
        message: "Consider extracting this logic",
        severity: "suggestion",
        status: "open",
      },
    });
  });

  registry.set("ACCEPT_REVIEW_COMMENT", (msg) => {
    postServerEvent({ t: "UPDATE_REVIEW_COMMENT_STATUS", id: msg.comment_id as ReviewCommentId, status: "accepted" });
  });

  registry.set("DISMISS_REVIEW_COMMENT", (msg) => {
    postServerEvent({ t: "UPDATE_REVIEW_COMMENT_STATUS", id: msg.comment_id as ReviewCommentId, status: "dismissed" });
  });

  // ── Tier 22: Remote Control ─────────────────────────────────

  registry.set("REQUEST_REMOTE_QR", () => {
    postServerEvent({
      t: "SET_REMOTE_STATUS",
      status: "waiting",
      qr_code_data_url: "data:image/png;base64,iVBOR...",
    });
    setTimeout(() => {
      postServerEvent({ t: "SET_REMOTE_STATUS", status: "connected" });
    }, 2000);
  });

  registry.set("DISCONNECT_REMOTE", () => {
    postServerEvent({ t: "SET_REMOTE_STATUS", status: "disconnected" });
  });

  // ── Tier 23: Search & Index ─────────────────────────────────

  registry.set("REQUEST_INDEX", () => {
    postServerEvent({ t: "SET_INDEX_STATUS", status: "indexing", progress: 0, file_count: 0 });
    setTimeout(() => {
      postServerEvent({ t: "SET_INDEX_STATUS", status: "ready", progress: 100, file_count: 156 });
    }, 2000);
  });

  registry.set("SEMANTIC_SEARCH", (msg) => {
    postServerEvent({
      t: "SET_SEARCH_RESULTS",
      query: msg.query,
      results: [
        {
          file_path: "src/auth/handler.ts",
          line_number: 1,
          snippet:
            "export async function handleAuth(req: Request) { const token = req.headers.authorization; if (!token) throw new UnauthorizedError();",
          score: 0.95,
        },
        {
          file_path: "src/middleware/auth.ts",
          line_number: 15,
          snippet:
            "export const authMiddleware = (req, res, next) => { try { verifyToken(req); next(); } catch { res.status(401).json({ error:...",
          score: 0.82,
        },
        {
          file_path: "src/routes/api.ts",
          line_number: 42,
          snippet:
            "router.post('/login', authMiddleware, loginController); router.get('/profile', authMiddleware, profileController);",
          score: 0.71,
        },
        {
          file_path: "src/types/auth.ts",
          line_number: 1,
          snippet:
            "export type AuthToken = { userId: string; exp: number; iat: number }; export type AuthResult = { success: boolean; token?: AuthToken };",
          score: 0.65,
        },
      ],
    });
  });

  // ── Tier 24: Browser ────────────────────────────────────────

  registry.set("BROWSER_NAVIGATE", (msg) => {
    postServerEvent({ t: "SET_BROWSER_STATE", state: { url: msg.url, loading: true } });
    setTimeout(() => {
      postServerEvent({ t: "SET_BROWSER_STATE", state: { loading: false, title: "Page loaded" } });
    }, 1000);
  });

  registry.set("BROWSER_CLICK", () => {
    postServerEvent({ t: "SET_BROWSER_STATE", state: { loading: true } });
    setTimeout(() => {
      postServerEvent({ t: "SET_BROWSER_STATE", state: { loading: false } });
    }, 500);
  });

  registry.set("BROWSER_CLOSE", () => {
    postServerEvent({ t: "SET_BROWSER_STATE", state: { url: "", loading: false } });
  });

  // ── Tier 25: Voice ──────────────────────────────────────────

  registry.set("START_VOICE_INPUT", () => {
    postServerEvent({ t: "SET_VOICE_INPUT_STATE", state: { status: "listening" } });
  });

  registry.set("STOP_VOICE_INPUT", () => {
    postServerEvent({ t: "SET_VOICE_INPUT_STATE", state: { status: "processing", transcript: "Mock voice input..." } });
    setTimeout(() => {
      postServerEvent({ t: "SET_VOICE_INPUT_STATE", state: { status: "idle", transcript: "Mock voice input text" } });
    }, 1000);
  });

  registry.set("CONFIRM_VOICE_INPUT", () => {
    postServerEvent({ t: "SET_VOICE_INPUT_STATE", state: { status: "idle" } });
  });
}

// ── Arena async helper ────────────────────────────────────────

async function handleArenaSend(prompt: string, signal: AbortSignal) {
  const idA = nextId("arena") as ArenaResponseId;
  const idB = nextId("arena") as ArenaResponseId;
  postServerEvents([
    {
      t: "UPSERT_ARENA_RESPONSE",
      response: {
        id: idA,
        slot: "A",
        model_id: "claude-opus-4-6",
        model_label: "Claude Opus 4.6",
        text: "",
        status: "streaming",
        created_at_ms: Date.now(),
      },
    },
    {
      t: "UPSERT_ARENA_RESPONSE",
      response: {
        id: idB,
        slot: "B",
        model_id: "claude-sonnet-4-6",
        model_label: "Claude Sonnet 4.6",
        text: "",
        status: "streaming",
        created_at_ms: Date.now(),
      },
    },
  ]);

  const textA = `Opus 응답: "${prompt}"에 대해 깊이 분석한 결과, 이 접근이 가장 적합합니다.`;
  const textB = `Sonnet 응답: "${prompt}"에 대해 효율적인 방법을 제안합니다.`;

  for (let i = 0; i < Math.max(textA.length, textB.length); i += 3) {
    if (signal.aborted) return;
    if (i < textA.length) postServerEvent({ t: "APPEND_ARENA_TEXT", id: idA, chunk: textA.slice(i, i + 3) });
    if (i < textB.length) postServerEvent({ t: "APPEND_ARENA_TEXT", id: idB, chunk: textB.slice(i, i + 3) });
    await abortableSleep(40, signal).catch(() => { /* abort expected */ });
  }

  if (signal.aborted) return;
  postServerEvents([
    { t: "UPSERT_ARENA_RESPONSE", response: { id: idA, slot: "A", model_id: "claude-opus-4-6", model_label: "Claude Opus 4.6", text: textA, status: "final", created_at_ms: Date.now() } },
    { t: "UPSERT_ARENA_RESPONSE", response: { id: idB, slot: "B", model_id: "claude-sonnet-4-6", model_label: "Claude Sonnet 4.6", text: textB, status: "final", created_at_ms: Date.now() } },
  ]);
}
