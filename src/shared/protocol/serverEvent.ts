/**
 * ServerEvent Protocol Types
 *
 * The ServerEvent union type and all event subtypes, plus type guards.
 */

import type { ArenaResponse, ArenaWinner } from "./arena";
import type { AgentInstanceId, ArenaResponseId,McpServerId, MemoryRuleId, MessageId, ProjectTodoId, ReviewCommentId, SessionId, TurnId } from "./brandedIds";
import type { BrowserAction,BrowserConsoleEntry, BrowserState } from "./browser";
import type { ConflictRisk, FileChange, GitCommit,ThreeWayDiffData } from "./git";
import type { McpRegistryEntry,McpServer, McpServerStatus, McpTool, McpToolCall } from "./mcp";
import type { BookmarkLabel, ClassifiedError, MessageStatus, Turn, TurnPhase, TurnPhaseEntry, UiMessage } from "./message";
import type {
  AgentInstance,
  AgentInstanceStatus,
  AgentMessage,
  AgentRule,
  AgentSteer,
  AgentWave,
  AppNotification,
  ArchitectState,
  AuthStatus,
  AutoContextState,
  AutoMemorySuggestion,
  BackgroundJob,
  BoomerangTask,
  BugbotStatus,
  CiCdPipeline,
  CompactionEvent,
  CompletionSettings,
  CompletionStats,
  ContextSpace,
  DebateSession,
  DebugState,
  DecisionTraceEntry,
  DeployStatus,
  Diagnostic,
  DriftGuardState,
  ElementMapping,
  EvidenceBundle,
  ExplainableVerdict,
  ExportProgress,
  ExternalFileChange,
  FailClosedConstraints,
  GanttEntry,
  HookEvent,
  IndexStatus,
  InputGateResult,
  IntegrationConnection,
  LinkedTicket,
  LivingSpec,
  MachineSnapshot,
  MemoryRule,
  MissionControlAgent,
  ModeEntry,
  ModelRoute,
  Notepad,
  PlanChecklistItem,
  PlanChecklistItemStatus,
  PlaybookEntry,
  PluginInfo,
  PreviewState,
  PrivacyState,
  ProjectTodo,
  ProjectTodoStatus,
  PromptSuggestion,
  PromptTemplate,
  PRSummary,
  QuotaStatus,
  RemoteCommand,
  RemoteConnectionStatus,
  ReplaySession,
  ReviewComment,
  ReviewCommentStatus,
  RiskHeatmapEntry,
  RuleViolation,
  SandboxStatus,
  SecurityScan,
  SemanticSearchResult,
  SessionSchedule,
  ShareLink,
  SideEffectBudget,
  SpeculativeEditState,
  StrategyState,
  SymbolMention,
  TeamConfig,
  TerminalChunk,
  TestResults,
  ThreeModelState,
  TimelineEvent,
  UsageStats,
  UserInputRequest,
  UserInputRequestStatus,
  ValidationState,
  VerifierResult,
  VoiceInputState,
  WikiPage,
  WorktreeStatus,
} from "./misc";
import type { ApprovalMode, Checkpoint, ModelInfo, SessionListEntry, SessionMeta, SessionStats } from "./session";
import type { RiskLevel,ToolCall, ToolCallOutput, ToolCallStatus, ToolCategory } from "./tool";

// ─── ServerEvent Protocol ────────────────────────────────────────
export type ServerEvent =
  | { readonly t: "UPSERT_MESSAGE"; readonly msg: UiMessage }
  | { readonly t: "APPEND_TEXT"; readonly id: MessageId; readonly chunk: string }
  | {
      readonly t: "SET_PROGRESS";
      readonly key: string;
      readonly value: number;
      readonly max?: number;
      readonly label?: string;
    }
  | { readonly t: "SET_DIFF_LOADED"; readonly id: MessageId; readonly diff_text: string }
  | { readonly t: "SET_MESSAGE_STATUS"; readonly id: MessageId; readonly status: MessageStatus }
  | { readonly t: "UPSERT_TURN"; readonly turn: Turn }
  | {
      readonly t: "UPDATE_TURN_PHASE";
      readonly turn_id: TurnId;
      readonly phase: TurnPhase;
      readonly entry: Partial<TurnPhaseEntry>;
    }
  | { readonly t: "UPSERT_TOOL_CALL"; readonly tool_call: ToolCall }
  | {
      readonly t: "UPDATE_TOOL_CALL_STATUS";
      readonly id: string;
      readonly status: ToolCallStatus;
      readonly result_summary?: string;
      readonly duration_ms?: number;
    }
  | { readonly t: "UPSERT_FILE_CHANGE"; readonly file_change: FileChange }
  | { readonly t: "SET_SESSION_META"; readonly meta: Partial<SessionMeta> }
  | { readonly t: "ADD_CHECKPOINT"; readonly checkpoint: Checkpoint }
  | { readonly t: "PUSH_TIMELINE"; readonly event: TimelineEvent }
  | { readonly t: "SET_APPROVAL_MODE"; readonly mode: ApprovalMode }
  | {
      readonly t: "REQUEST_TOOL_APPROVAL";
      readonly tool_call_id: string;
      readonly action_id: string;
      readonly risk_level: RiskLevel;
      readonly description: string;
      readonly supports_sandbox?: boolean;
    }
  | { readonly t: "SET_TOOL_OUTPUT"; readonly id: string; readonly output: ToolCallOutput }
  | {
      readonly t: "SET_SESSION_LIST";
      readonly sessions: readonly SessionListEntry[];
    }
  | {
      readonly t: "SET_CURRENT_PAGE";
      readonly page: "chat" | "sessions" | "arena" | "review" | "todos" | "settings";
    }
  | { readonly t: "SET_AVAILABLE_MODELS"; readonly models: readonly ModelInfo[] }
  | { readonly t: "SET_PROJECT_FILES"; readonly files: readonly string[]; readonly workspace_name?: string }
  | { readonly t: "SET_THINKING_MODE"; readonly enabled: boolean }
  | { readonly t: "SET_FAST_MODE"; readonly enabled: boolean }
  | {
      readonly t: "UPSERT_PLAN_CHECKLIST";
      readonly turn_id: TurnId;
      readonly items: readonly PlanChecklistItem[];
    }
  | {
      readonly t: "UPDATE_PLAN_ITEM";
      readonly turn_id: TurnId;
      readonly item_id: string;
      readonly status: PlanChecklistItemStatus;
    }
  | {
      readonly t: "UPDATE_TURN_METRICS";
      readonly turn_id: TurnId;
      readonly ttft_ms?: number;
      readonly latency_ms?: number;
      readonly token_usage?: Turn["token_usage"];
      readonly estimated_cost_usd?: number;
    }
  | { readonly t: "CLASSIFY_ERROR"; readonly id: MessageId; readonly error: ClassifiedError }
  | {
      readonly t: "UPDATE_SESSION_SUMMARY";
      readonly summary: string;
      readonly stats?: SessionStats;
    }
  | {
      readonly t: "TOGGLE_TURN_BOOKMARK";
      readonly turn_id: TurnId;
      readonly bookmarked: boolean;
      readonly bookmark_label?: BookmarkLabel;
    }
  | {
      readonly t: "SET_QUOTE_CONTEXT";
      readonly message_id: MessageId;
      readonly quoted_text: string;
    }
  | {
      readonly t: "FORK_SESSION";
      readonly source_session_id: SessionId;
      readonly source_turn_id: TurnId;
      readonly new_session_id: SessionId;
    }
  | {
      readonly t: "SET_SYMBOL_MENTIONS";
      readonly symbols: readonly SymbolMention[];
    }
  | {
      readonly t: "SET_PATCH_SIMULATION";
      readonly turn_id: TurnId;
      readonly file_path: string;
      readonly conflict_risk: ConflictRisk;
      readonly conflict_details?: string;
      readonly affected_files: readonly string[];
    }
  | {
      readonly t: "SET_SCOPE_GUARD";
      readonly includes: readonly string[];
      readonly excludes: readonly string[];
    }
  | {
      readonly t: "SET_CATEGORY_PERMISSIONS";
      readonly permissions: readonly {
        readonly category: ToolCategory;
        readonly permission: string;
      }[];
    }
  | { readonly t: "UPSERT_MEMORY_RULE"; readonly rule: MemoryRule }
  | { readonly t: "REMOVE_MEMORY_RULE"; readonly id: MemoryRuleId }
  | { readonly t: "PIN_MEMORY_RULE"; readonly id: MemoryRuleId; readonly pinned: boolean }
  | { readonly t: "SUGGEST_AUTO_MEMORY"; readonly suggestion: AutoMemorySuggestion }
  | { readonly t: "DISMISS_AUTO_MEMORY"; readonly id: string }
  | { readonly t: "LOG_COMPACTION"; readonly event: CompactionEvent }
  | {
      readonly t: "SET_SHARE_LINK";
      readonly session_id: SessionId;
      readonly link: ShareLink;
    }
  | { readonly t: "SET_PR_SUMMARY"; readonly summary: PRSummary }
  | {
      readonly t: "SET_BOOMERANG_TASKS";
      readonly tasks: readonly BoomerangTask[];
    }
  | {
      readonly t: "SET_MISSION_CONTROL_AGENTS";
      readonly agents: readonly MissionControlAgent[];
    }
  // ── Feature 1: Parallel Agents
  | { readonly t: "UPSERT_AGENT_INSTANCE"; readonly instance: AgentInstance }
  | {
      readonly t: "UPDATE_AGENT_STATUS";
      readonly id: AgentInstanceId;
      readonly status: AgentInstanceStatus;
      readonly progress?: number;
      readonly error_message?: string;
    }
  | { readonly t: "REMOVE_AGENT_INSTANCE"; readonly id: AgentInstanceId }
  // ── Feature 2: Semantic Indexing
  | {
      readonly t: "SET_INDEX_STATUS";
      readonly status: IndexStatus;
      readonly progress?: number;
      readonly file_count?: number;
    }
  | {
      readonly t: "SET_SEARCH_RESULTS";
      readonly query: string;
      readonly results: readonly SemanticSearchResult[];
    }
  // ── Feature 3: MCP
  | { readonly t: "UPSERT_MCP_SERVER"; readonly server: McpServer }
  | {
      readonly t: "SET_MCP_SERVER_STATUS";
      readonly id: McpServerId;
      readonly status: McpServerStatus;
      readonly error_message?: string;
    }
  | {
      readonly t: "SET_MCP_TOOLS";
      readonly server_id: McpServerId;
      readonly tools: readonly McpTool[];
    }
  | { readonly t: "UPSERT_MCP_TOOL_CALL"; readonly call: McpToolCall }
  // ── Feature 4: Inline Completion
  | { readonly t: "SET_COMPLETION_STATS"; readonly stats: CompletionStats }
  | { readonly t: "SET_COMPLETION_SETTINGS"; readonly settings: Partial<CompletionSettings> }
  // ── Feature 5: Browser Preview
  | { readonly t: "SET_BROWSER_STATE"; readonly state: Partial<BrowserState> }
  | { readonly t: "PUSH_BROWSER_CONSOLE"; readonly entry: BrowserConsoleEntry }
  | { readonly t: "CLEAR_BROWSER_CONSOLE" }
  // ── Feature 6: Project Memory
  | { readonly t: "DELETE_MEMORY_RULE"; readonly id: MemoryRuleId }
  | { readonly t: "SET_ACTIVE_RULES"; readonly ids: readonly MemoryRuleId[] }
  // ── Feature 7: Arena Mode
  | { readonly t: "UPSERT_ARENA_RESPONSE"; readonly response: ArenaResponse }
  | { readonly t: "APPEND_ARENA_TEXT"; readonly id: ArenaResponseId; readonly chunk: string }
  | { readonly t: "SET_ARENA_WINNER"; readonly winner: ArenaWinner }
  // ── Feature 8: Git Auto-Commit
  | { readonly t: "PUSH_GIT_COMMIT"; readonly commit: GitCommit }
  | { readonly t: "SET_AUTO_COMMIT_ENABLED"; readonly enabled: boolean }
  // ── Feature 9: AI Code Review
  | { readonly t: "UPSERT_REVIEW_COMMENT"; readonly comment: ReviewComment }
  | {
      readonly t: "UPDATE_REVIEW_COMMENT_STATUS";
      readonly id: ReviewCommentId;
      readonly status: ReviewCommentStatus;
    }
  | {
      readonly t: "SET_REVIEW_COMMENTS";
      readonly file_path: string;
      readonly comments: readonly ReviewComment[];
    }
  // ── Feature 10: Remote Control
  | {
      readonly t: "SET_REMOTE_STATUS";
      readonly status: RemoteConnectionStatus;
      readonly qr_code_data_url?: string;
    }
  | { readonly t: "PUSH_REMOTE_COMMAND"; readonly command: RemoteCommand }
  // ── Project TODO
  | { readonly t: "SYNC_PROJECT_TODOS"; readonly todos: readonly ProjectTodo[] }
  | { readonly t: "UPSERT_PROJECT_TODO"; readonly todo: ProjectTodo }
  | {
      readonly t: "UPDATE_PROJECT_TODO_STATUS";
      readonly id: ProjectTodoId;
      readonly status: ProjectTodoStatus;
    }
  | { readonly t: "DELETE_PROJECT_TODO"; readonly id: ProjectTodoId }
  | {
      readonly t: "SET_CHECKPOINT_DIFF";
      readonly from_id: string;
      readonly to_id: string;
      readonly files: readonly FileChange[];
    }
  | { readonly t: "SET_ARCHITECT_STATE"; readonly state: ArchitectState }
  | { readonly t: "SET_MODEL_ROUTES"; readonly routes: readonly ModelRoute[] }
  | { readonly t: "SET_MCP_REGISTRY"; readonly entries: readonly McpRegistryEntry[] }
  | { readonly t: "SET_PRIVACY_STATE"; readonly state: PrivacyState }
  | { readonly t: "SET_NOTEPADS"; readonly notepads: readonly Notepad[] }
  | { readonly t: "SET_USAGE_STATS"; readonly stats: UsageStats }
  | { readonly t: "SET_GANTT_ENTRIES"; readonly entries: readonly GanttEntry[] }
  | { readonly t: "SET_THREE_WAY_DIFF"; readonly data: ThreeWayDiffData }
  | {
      readonly t: "SET_EXPORT_PROGRESS";
      readonly progress: ExportProgress;
      readonly error_message?: string;
    }
  | {
      readonly t: "SET_TEAM_CONFIG";
      readonly items: readonly TeamConfig[];
    }
  | {
      readonly t: "SET_PROMPT_TEMPLATES";
      readonly templates: readonly PromptTemplate[];
    }
  | { readonly t: "SET_THREE_MODEL_STATE"; readonly state: ThreeModelState }
  | { readonly t: "SET_WIKI_PAGES"; readonly pages: readonly WikiPage[] }
  | { readonly t: "SET_ELEMENT_MAPPINGS"; readonly mappings: readonly ElementMapping[] }
  | { readonly t: "SET_PREVIEW_STATE"; readonly state: PreviewState }
  | { readonly t: "SET_VOICE_INPUT_STATE"; readonly state: VoiceInputState }
  | { readonly t: "SET_BROWSER_ACTIONS"; readonly actions: readonly BrowserAction[] }
  | { readonly t: "SET_MACHINE_SNAPSHOTS"; readonly snapshots: readonly MachineSnapshot[] }
  | { readonly t: "SET_MODE_GALLERY"; readonly entries: readonly ModeEntry[] }
  | { readonly t: "SET_PLAYBOOK_MARKET"; readonly entries: readonly PlaybookEntry[] }
  | {
      readonly t: "SET_CONTEXT_SPACES";
      readonly spaces: readonly ContextSpace[];
    }
  | {
      readonly t: "SET_INTEGRATIONS";
      readonly connections: readonly IntegrationConnection[];
    }
  | { readonly t: "SET_LINKED_TICKET"; readonly ticket: LinkedTicket | null }
  | {
      readonly t: "SET_AGENT_MESSAGES";
      readonly messages: readonly AgentMessage[];
    }
  // ── Pipeline (per-turn, all carry turn_id)
  | { readonly t: "SET_INPUT_GATE_RESULT"; readonly turn_id: TurnId; readonly result: InputGateResult }
  | { readonly t: "SET_FAIL_CLOSED_CONSTRAINTS"; readonly turn_id: TurnId; readonly constraints: FailClosedConstraints }
  | { readonly t: "SET_STRATEGY_STATE"; readonly turn_id: TurnId; readonly state: StrategyState }
  | { readonly t: "SET_VALIDATION_STATE"; readonly turn_id: TurnId; readonly state: ValidationState }
  | { readonly t: "SET_EVIDENCE_BUNDLE"; readonly turn_id: TurnId; readonly bundle: EvidenceBundle }
  | { readonly t: "PUSH_DECISION_TRACE"; readonly turn_id: TurnId; readonly entry: DecisionTraceEntry }
  | { readonly t: "SET_EXPLAINABLE_VERDICT"; readonly turn_id: TurnId; readonly verdict: ExplainableVerdict }
  | { readonly t: "SET_RISK_HEATMAP"; readonly turn_id: TurnId; readonly entries: readonly RiskHeatmapEntry[] }
  | { readonly t: "SET_SIDE_EFFECT_BUDGET"; readonly turn_id: TurnId; readonly budget: SideEffectBudget }
  | { readonly t: "SET_DRIFT_GUARD_STATE"; readonly turn_id: TurnId; readonly state: DriftGuardState }
  // ── P0: Terminal, Test, Lint, Quota, Notification, Auth
  | { readonly t: "APPEND_TERMINAL_OUTPUT"; readonly chunk: TerminalChunk }
  | { readonly t: "SET_TEST_RESULTS"; readonly results: TestResults }
  | { readonly t: "SET_DIAGNOSTICS"; readonly file_path: string; readonly diagnostics: readonly Diagnostic[] }
  | { readonly t: "SET_QUOTA_STATUS"; readonly status: QuotaStatus }
  | { readonly t: "PUSH_NOTIFICATION"; readonly notification: AppNotification }
  | { readonly t: "SET_AUTH_STATUS"; readonly status: AuthStatus }
  // ── P1: Hook, Worktree, FileWatch, CI/CD, Security, Deploy, Prompt, Debug
  | { readonly t: "SET_HOOK_EVENT"; readonly event: HookEvent }
  | { readonly t: "SET_WORKTREE_STATUS"; readonly worktree: WorktreeStatus }
  | { readonly t: "FILE_CHANGE_EXTERNAL"; readonly change: ExternalFileChange }
  | { readonly t: "SET_CI_CD_STATUS"; readonly pipeline: CiCdPipeline }
  | { readonly t: "SET_SECURITY_SCAN"; readonly scan: SecurityScan }
  | { readonly t: "SET_DEPLOY_STATUS"; readonly deploy: DeployStatus }
  | { readonly t: "PUSH_PROMPT_SUGGESTION"; readonly suggestion: PromptSuggestion }
  | { readonly t: "SET_DEBUG_STATE"; readonly state: DebugState }
  // ── P2: Sandbox, Plugin, Wave, Verifier, Spec, Schedule, Steer, Bugbot
  | { readonly t: "SET_SANDBOX_STATUS"; readonly status: SandboxStatus }
  | { readonly t: "SET_PLUGIN_STATUS"; readonly plugins: readonly PluginInfo[] }
  | { readonly t: "SET_AGENT_WAVE"; readonly wave: AgentWave }
  | { readonly t: "SET_VERIFIER_RESULT"; readonly result: VerifierResult }
  | { readonly t: "UPDATE_LIVING_SPEC"; readonly spec: LivingSpec }
  | { readonly t: "SET_SESSION_SCHEDULE"; readonly schedules: readonly SessionSchedule[] }
  | { readonly t: "STEER_AGENT"; readonly steer: AgentSteer }
  | { readonly t: "SET_BUGBOT_STATUS"; readonly status: BugbotStatus }
  // ── SOTA Features: Agent Rules, Smart Context, Speculative, Background, Replay, Debate
  | { readonly t: "SET_AGENT_RULES"; readonly rules: readonly AgentRule[] }
  | { readonly t: "PUSH_RULE_VIOLATION"; readonly violation: RuleViolation }
  | { readonly t: "SET_AUTO_CONTEXT"; readonly turn_id: TurnId; readonly state: AutoContextState }
  | { readonly t: "SET_SPECULATIVE_EDITS"; readonly turn_id: TurnId; readonly state: SpeculativeEditState }
  | { readonly t: "UPSERT_BACKGROUND_JOB"; readonly job: BackgroundJob }
  | { readonly t: "REMOVE_BACKGROUND_JOB"; readonly id: string }
  | { readonly t: "SET_REPLAY_SESSION"; readonly session: ReplaySession }
  | { readonly t: "SET_DEBATE_SESSION"; readonly turn_id: TurnId; readonly session: DebateSession }
  // ── HITL: User Input
  | { readonly t: "REQUEST_USER_INPUT"; readonly request: UserInputRequest }
  | {
      readonly t: "UPDATE_USER_INPUT";
      readonly id: string;
      readonly status: UserInputRequestStatus;
      readonly answer?: string | readonly string[];
    }
  | { readonly t: "CANCEL_USER_INPUT"; readonly id: string }
  | { readonly t: "RESET_STORES" }
  | { readonly t: "NOP" };

/** Extract the discriminant union of all ServerEvent "t" values */
export type ServerEventType = ServerEvent["t"];

export interface ServerEventBatch {
  readonly type: "SERVER_EVENT_BATCH";
  readonly batch_id: string;
  readonly created_at_ms: number;
  readonly serverEvents: readonly ServerEvent[];
}

// ─── Type Guards ───────────────────────────────────────────

/** Runtime type guard: is the value a valid ServerEventBatch? */
export function isServerEventBatch(value: unknown): value is ServerEventBatch {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.type === "SERVER_EVENT_BATCH" &&
    typeof obj.batch_id === "string" &&
    typeof obj.created_at_ms === "number" &&
    Array.isArray(obj.serverEvents)
  );
}

/** Known ServerEvent discriminant values for runtime validation */
const KNOWN_SERVER_EVENT_TYPES: ReadonlySet<string> = new Set<ServerEventType>([
  "UPSERT_MESSAGE",
  "APPEND_TEXT",
  "SET_PROGRESS",
  "SET_DIFF_LOADED",
  "SET_MESSAGE_STATUS",
  "UPSERT_TURN",
  "UPDATE_TURN_PHASE",
  "UPSERT_TOOL_CALL",
  "UPDATE_TOOL_CALL_STATUS",
  "UPSERT_FILE_CHANGE",
  "SET_SESSION_META",
  "ADD_CHECKPOINT",
  "PUSH_TIMELINE",
  "SET_APPROVAL_MODE",
  "REQUEST_TOOL_APPROVAL",
  "SET_TOOL_OUTPUT",
  "SET_SESSION_LIST",
  "SET_CURRENT_PAGE",
  "SET_AVAILABLE_MODELS",
  "SET_PROJECT_FILES",
  "SET_THINKING_MODE",
  "SET_FAST_MODE",
  "UPSERT_PLAN_CHECKLIST",
  "UPDATE_PLAN_ITEM",
  "UPDATE_TURN_METRICS",
  "CLASSIFY_ERROR",
  "UPDATE_SESSION_SUMMARY",
  "TOGGLE_TURN_BOOKMARK",
  "SET_QUOTE_CONTEXT",
  "FORK_SESSION",
  "SET_SYMBOL_MENTIONS",
  "SET_PATCH_SIMULATION",
  "SET_SCOPE_GUARD",
  "SET_CATEGORY_PERMISSIONS",
  "UPSERT_MEMORY_RULE",
  "REMOVE_MEMORY_RULE",
  "PIN_MEMORY_RULE",
  "SUGGEST_AUTO_MEMORY",
  "DISMISS_AUTO_MEMORY",
  "LOG_COMPACTION",
  "SET_SHARE_LINK",
  "SET_PR_SUMMARY",
  "SET_BOOMERANG_TASKS",
  "SET_MISSION_CONTROL_AGENTS",
  // Feature 1: Parallel Agents
  "UPSERT_AGENT_INSTANCE",
  "UPDATE_AGENT_STATUS",
  "REMOVE_AGENT_INSTANCE",
  // Feature 2: Semantic Indexing
  "SET_INDEX_STATUS",
  "SET_SEARCH_RESULTS",
  // Feature 3: MCP
  "UPSERT_MCP_SERVER",
  "SET_MCP_SERVER_STATUS",
  "SET_MCP_TOOLS",
  "UPSERT_MCP_TOOL_CALL",
  // Feature 4: Inline Completion
  "SET_COMPLETION_STATS",
  "SET_COMPLETION_SETTINGS",
  // Feature 5: Browser Preview
  "SET_BROWSER_STATE",
  "PUSH_BROWSER_CONSOLE",
  "CLEAR_BROWSER_CONSOLE",
  // Feature 6: Project Memory
  "DELETE_MEMORY_RULE",
  "SET_ACTIVE_RULES",
  // Feature 7: Arena Mode
  "UPSERT_ARENA_RESPONSE",
  "APPEND_ARENA_TEXT",
  "SET_ARENA_WINNER",
  // Feature 8: Git Auto-Commit
  "PUSH_GIT_COMMIT",
  "SET_AUTO_COMMIT_ENABLED",
  // Feature 9: AI Code Review
  "UPSERT_REVIEW_COMMENT",
  "UPDATE_REVIEW_COMMENT_STATUS",
  "SET_REVIEW_COMMENTS",
  // Feature 10: Remote Control
  "SET_REMOTE_STATUS",
  "PUSH_REMOTE_COMMAND",
  // Project TODO
  "SYNC_PROJECT_TODOS",
  "UPSERT_PROJECT_TODO",
  "UPDATE_PROJECT_TODO_STATUS",
  "DELETE_PROJECT_TODO",
  "SET_CHECKPOINT_DIFF",
  "SET_ARCHITECT_STATE",
  "SET_MODEL_ROUTES",
  "SET_MCP_REGISTRY",
  "SET_PRIVACY_STATE",
  "SET_NOTEPADS",
  "SET_USAGE_STATS",
  "SET_GANTT_ENTRIES",
  "SET_THREE_WAY_DIFF",
  "SET_EXPORT_PROGRESS",
  "SET_TEAM_CONFIG",
  "SET_PROMPT_TEMPLATES",
  "SET_THREE_MODEL_STATE",
  "SET_WIKI_PAGES",
  "SET_ELEMENT_MAPPINGS",
  "SET_PREVIEW_STATE",
  "SET_VOICE_INPUT_STATE",
  "SET_BROWSER_ACTIONS",
  "SET_MACHINE_SNAPSHOTS",
  "SET_MODE_GALLERY",
  "SET_PLAYBOOK_MARKET",
  "SET_CONTEXT_SPACES",
  "SET_INTEGRATIONS",
  "SET_LINKED_TICKET",
  "SET_AGENT_MESSAGES",
  // Pipeline
  "SET_INPUT_GATE_RESULT",
  "SET_FAIL_CLOSED_CONSTRAINTS",
  "SET_STRATEGY_STATE",
  "SET_VALIDATION_STATE",
  "SET_EVIDENCE_BUNDLE",
  "PUSH_DECISION_TRACE",
  "SET_EXPLAINABLE_VERDICT",
  "SET_RISK_HEATMAP",
  "SET_SIDE_EFFECT_BUDGET",
  "SET_DRIFT_GUARD_STATE",
  // P0: Terminal, Test, Lint, Quota, Notification, Auth
  "APPEND_TERMINAL_OUTPUT",
  "SET_TEST_RESULTS",
  "SET_DIAGNOSTICS",
  "SET_QUOTA_STATUS",
  "PUSH_NOTIFICATION",
  "SET_AUTH_STATUS",
  // P1: Hook, Worktree, FileWatch, CI/CD, Security, Deploy, Prompt, Debug
  "SET_HOOK_EVENT",
  "SET_WORKTREE_STATUS",
  "FILE_CHANGE_EXTERNAL",
  "SET_CI_CD_STATUS",
  "SET_SECURITY_SCAN",
  "SET_DEPLOY_STATUS",
  "PUSH_PROMPT_SUGGESTION",
  "SET_DEBUG_STATE",
  // P2: Sandbox, Plugin, Wave, Verifier, Spec, Schedule, Steer, Bugbot
  "SET_SANDBOX_STATUS",
  "SET_PLUGIN_STATUS",
  "SET_AGENT_WAVE",
  "SET_VERIFIER_RESULT",
  "UPDATE_LIVING_SPEC",
  "SET_SESSION_SCHEDULE",
  "STEER_AGENT",
  "SET_BUGBOT_STATUS",
  // SOTA Features
  "SET_AGENT_RULES",
  "PUSH_RULE_VIOLATION",
  "SET_AUTO_CONTEXT",
  "SET_SPECULATIVE_EDITS",
  "UPSERT_BACKGROUND_JOB",
  "REMOVE_BACKGROUND_JOB",
  "SET_REPLAY_SESSION",
  "SET_DEBATE_SESSION",
  "RESET_STORES",
  "NOP",
]);

/** Runtime type guard: is the value a ServerEvent with a known "t" discriminant and valid payload? */
export function isServerEvent(value: unknown): value is ServerEvent {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!KNOWN_SERVER_EVENT_TYPES.has(obj.t as string)) return false;

  // Payload validation for all serverEvent types
  switch (obj.t) {
    case "UPSERT_MESSAGE":
      return typeof obj.msg === "object" && obj.msg !== null;
    case "APPEND_TEXT":
      return typeof obj.id === "string" && typeof obj.chunk === "string";
    case "SET_PROGRESS":
      return typeof obj.key === "string" && typeof obj.value === "number";
    case "SET_DIFF_LOADED":
      return typeof obj.id === "string" && typeof obj.diff_text === "string";
    case "SET_MESSAGE_STATUS":
      return typeof obj.id === "string" && typeof obj.status === "string";
    case "UPSERT_TURN":
      return typeof obj.turn === "object" && obj.turn !== null;
    case "UPDATE_TURN_PHASE":
      return (
        typeof obj.turn_id === "string" &&
        typeof obj.phase === "string" &&
        typeof obj.entry === "object" &&
        obj.entry !== null
      );
    case "UPSERT_TOOL_CALL":
      return typeof obj.tool_call === "object" && obj.tool_call !== null;
    case "UPDATE_TOOL_CALL_STATUS":
      return typeof obj.id === "string" && typeof obj.status === "string";
    case "UPSERT_FILE_CHANGE":
      return typeof obj.file_change === "object" && obj.file_change !== null;
    case "SET_SESSION_META":
      return typeof obj.meta === "object" && obj.meta !== null;
    case "ADD_CHECKPOINT":
      return typeof obj.checkpoint === "object" && obj.checkpoint !== null;
    case "PUSH_TIMELINE":
      return typeof obj.event === "object" && obj.event !== null;
    case "SET_APPROVAL_MODE":
      return typeof obj.mode === "string";
    case "REQUEST_TOOL_APPROVAL":
      return (
        typeof obj.tool_call_id === "string" &&
        typeof obj.action_id === "string" &&
        typeof obj.risk_level === "string" &&
        typeof obj.description === "string"
      );
    case "SET_TOOL_OUTPUT":
      return typeof obj.id === "string" && typeof obj.output === "object" && obj.output !== null;
    case "SET_SESSION_LIST":
      return Array.isArray(obj.sessions);
    case "SET_CURRENT_PAGE":
      return (
        obj.page === "chat" ||
        obj.page === "sessions" ||
        obj.page === "arena" ||
        obj.page === "review" ||
        obj.page === "todos" ||
        obj.page === "settings"
      );
    case "SET_AVAILABLE_MODELS":
      return Array.isArray(obj.models);
    case "SET_PROJECT_FILES":
      return Array.isArray(obj.files);
    case "SET_THINKING_MODE":
    case "SET_FAST_MODE":
      return typeof obj.enabled === "boolean";
    case "UPSERT_PLAN_CHECKLIST":
      return typeof obj.turn_id === "string" && Array.isArray(obj.items);
    case "UPDATE_PLAN_ITEM":
      return (
        typeof obj.turn_id === "string" &&
        typeof obj.item_id === "string" &&
        typeof obj.status === "string"
      );
    case "UPDATE_TURN_METRICS":
      return typeof obj.turn_id === "string";
    case "CLASSIFY_ERROR":
      return typeof obj.id === "string" && typeof obj.error === "object" && obj.error !== null;
    case "UPDATE_SESSION_SUMMARY":
      return typeof obj.summary === "string";
    case "TOGGLE_TURN_BOOKMARK":
      return typeof obj.turn_id === "string" && typeof obj.bookmarked === "boolean";
    case "SET_QUOTE_CONTEXT":
      return typeof obj.message_id === "string" && typeof obj.quoted_text === "string";
    case "FORK_SESSION":
      return (
        typeof obj.source_session_id === "string" &&
        typeof obj.source_turn_id === "string" &&
        typeof obj.new_session_id === "string"
      );
    case "SET_SYMBOL_MENTIONS":
      return Array.isArray(obj.symbols);
    case "SET_PATCH_SIMULATION":
      return (
        typeof obj.turn_id === "string" &&
        typeof obj.file_path === "string" &&
        typeof obj.conflict_risk === "string" &&
        Array.isArray(obj.affected_files)
      );
    case "SET_SCOPE_GUARD":
      return Array.isArray(obj.includes) && Array.isArray(obj.excludes);
    case "SET_CATEGORY_PERMISSIONS":
      return Array.isArray(obj.permissions);
    case "UPSERT_MEMORY_RULE":
      return typeof obj.rule === "object" && obj.rule !== null;
    case "REMOVE_MEMORY_RULE":
      return typeof obj.id === "string";
    case "PIN_MEMORY_RULE":
      return typeof obj.id === "string" && typeof obj.pinned === "boolean";
    case "SUGGEST_AUTO_MEMORY":
      return typeof obj.suggestion === "object" && obj.suggestion !== null;
    case "DISMISS_AUTO_MEMORY":
      return typeof obj.id === "string";
    case "LOG_COMPACTION":
      return typeof obj.event === "object" && obj.event !== null;
    case "SET_SHARE_LINK":
      return (
        typeof obj.session_id === "string" && typeof obj.link === "object" && obj.link !== null
      );
    case "SET_PR_SUMMARY":
      return typeof obj.summary === "object" && obj.summary !== null;
    case "SET_BOOMERANG_TASKS":
      return Array.isArray(obj.tasks);
    case "SET_MISSION_CONTROL_AGENTS":
      return Array.isArray(obj.agents);
    case "SET_CHECKPOINT_DIFF":
      return (
        typeof obj.from_id === "string" && typeof obj.to_id === "string" && Array.isArray(obj.files)
      );
    case "SET_ARCHITECT_STATE":
      return typeof obj.state === "object" && obj.state !== null;
    case "SET_MODEL_ROUTES":
      return Array.isArray(obj.routes);
    case "SET_MCP_REGISTRY":
      return Array.isArray(obj.entries);
    case "SET_PRIVACY_STATE":
      return typeof obj.state === "object" && obj.state !== null;
    case "SET_NOTEPADS":
      return Array.isArray(obj.notepads);
    case "SET_USAGE_STATS":
      return typeof obj.stats === "object" && obj.stats !== null;
    case "SET_GANTT_ENTRIES":
      return Array.isArray(obj.entries);
    case "SET_THREE_WAY_DIFF":
      return typeof obj.data === "object" && obj.data !== null;
    case "SET_EXPORT_PROGRESS":
      return typeof obj.progress === "string";
    case "SET_TEAM_CONFIG":
      return Array.isArray(obj.items);
    case "SET_PROMPT_TEMPLATES":
      return Array.isArray(obj.templates);
    case "SET_THREE_MODEL_STATE":
      return typeof obj.state === "object" && obj.state !== null;
    case "SET_WIKI_PAGES":
      return Array.isArray(obj.pages);
    case "SET_ELEMENT_MAPPINGS":
      return Array.isArray(obj.mappings);
    case "SET_PREVIEW_STATE":
      return typeof obj.state === "object" && obj.state !== null;
    case "SET_VOICE_INPUT_STATE":
      return typeof obj.state === "object" && obj.state !== null;
    case "SET_BROWSER_ACTIONS":
      return Array.isArray(obj.actions);
    case "SET_MACHINE_SNAPSHOTS":
      return Array.isArray(obj.snapshots);
    case "SET_MODE_GALLERY":
      return Array.isArray(obj.entries);
    case "SET_PLAYBOOK_MARKET":
      return Array.isArray(obj.entries);
    case "SET_CONTEXT_SPACES":
      return Array.isArray(obj.spaces);
    case "SET_INTEGRATIONS":
      return Array.isArray(obj.connections);
    case "SET_LINKED_TICKET":
      return obj.ticket === null || typeof obj.ticket === "object";
    case "SET_AGENT_MESSAGES":
      return Array.isArray(obj.messages);
    // Feature 1: Parallel Agents
    case "UPSERT_AGENT_INSTANCE":
      return typeof obj.instance === "object" && obj.instance !== null;
    case "UPDATE_AGENT_STATUS":
      return typeof obj.id === "string" && typeof obj.status === "string";
    case "REMOVE_AGENT_INSTANCE":
      return typeof obj.id === "string";
    // Feature 2: Semantic Indexing
    case "SET_INDEX_STATUS":
      return typeof obj.status === "string";
    case "SET_SEARCH_RESULTS":
      return typeof obj.query === "string" && Array.isArray(obj.results);
    // Feature 3: MCP
    case "UPSERT_MCP_SERVER":
      return typeof obj.server === "object" && obj.server !== null;
    case "SET_MCP_SERVER_STATUS":
      return typeof obj.id === "string" && typeof obj.status === "string";
    case "SET_MCP_TOOLS":
      return typeof obj.server_id === "string" && Array.isArray(obj.tools);
    case "UPSERT_MCP_TOOL_CALL":
      return typeof obj.call === "object" && obj.call !== null;
    // Feature 4: Inline Completion
    case "SET_COMPLETION_STATS":
      return typeof obj.stats === "object" && obj.stats !== null;
    case "SET_COMPLETION_SETTINGS":
      return typeof obj.settings === "object" && obj.settings !== null;
    // Feature 5: Browser Preview
    case "SET_BROWSER_STATE":
      return typeof obj.state === "object" && obj.state !== null;
    case "PUSH_BROWSER_CONSOLE":
      return typeof obj.entry === "object" && obj.entry !== null;
    case "CLEAR_BROWSER_CONSOLE":
      return true;
    // Feature 6: Project Memory
    case "DELETE_MEMORY_RULE":
      return typeof obj.id === "string";
    case "SET_ACTIVE_RULES":
      return Array.isArray(obj.ids);
    // Feature 7: Arena Mode
    case "UPSERT_ARENA_RESPONSE":
      return typeof obj.response === "object" && obj.response !== null;
    case "APPEND_ARENA_TEXT":
      return typeof obj.id === "string" && typeof obj.chunk === "string";
    case "SET_ARENA_WINNER":
      return true; // winner can be null
    // Feature 8: Git Auto-Commit
    case "PUSH_GIT_COMMIT":
      return typeof obj.commit === "object" && obj.commit !== null;
    case "SET_AUTO_COMMIT_ENABLED":
      return typeof obj.enabled === "boolean";
    // Feature 9: AI Code Review
    case "UPSERT_REVIEW_COMMENT":
      return typeof obj.comment === "object" && obj.comment !== null;
    case "UPDATE_REVIEW_COMMENT_STATUS":
      return typeof obj.id === "string" && typeof obj.status === "string";
    case "SET_REVIEW_COMMENTS":
      return typeof obj.file_path === "string" && Array.isArray(obj.comments);
    // Feature 10: Remote Control
    case "SET_REMOTE_STATUS":
      return typeof obj.status === "string";
    case "PUSH_REMOTE_COMMAND":
      return typeof obj.command === "object" && obj.command !== null;
    // Project TODO
    case "SYNC_PROJECT_TODOS":
      return Array.isArray(obj.todos);
    case "UPSERT_PROJECT_TODO":
      return typeof obj.todo === "object" && obj.todo !== null;
    case "UPDATE_PROJECT_TODO_STATUS":
      return typeof obj.id === "string" && typeof obj.status === "string";
    case "DELETE_PROJECT_TODO":
      return typeof obj.id === "string";

    // Pipeline
    case "SET_INPUT_GATE_RESULT":
      return typeof obj.result === "object" && obj.result !== null;
    case "SET_FAIL_CLOSED_CONSTRAINTS":
      return typeof obj.constraints === "object" && obj.constraints !== null;
    case "SET_STRATEGY_STATE":
      return typeof obj.state === "object" && obj.state !== null;
    case "SET_VALIDATION_STATE":
      return typeof obj.state === "object" && obj.state !== null;
    case "SET_EVIDENCE_BUNDLE":
      return typeof obj.bundle === "object" && obj.bundle !== null;
    case "PUSH_DECISION_TRACE":
      return typeof obj.entry === "object" && obj.entry !== null;
    case "SET_EXPLAINABLE_VERDICT":
      return typeof obj.verdict === "object" && obj.verdict !== null;
    case "SET_RISK_HEATMAP":
      return Array.isArray(obj.entries);
    case "SET_SIDE_EFFECT_BUDGET":
      return typeof obj.budget === "object" && obj.budget !== null;
    case "SET_DRIFT_GUARD_STATE":
      return typeof obj.state === "object" && obj.state !== null;

    // P0: Terminal, Test, Lint, Quota, Notification, Auth
    case "APPEND_TERMINAL_OUTPUT":
      return typeof obj.chunk === "object" && obj.chunk !== null;
    case "SET_TEST_RESULTS":
      return typeof obj.results === "object" && obj.results !== null;
    case "SET_DIAGNOSTICS":
      return typeof obj.file_path === "string" && Array.isArray(obj.diagnostics);
    case "SET_QUOTA_STATUS":
      return typeof obj.status === "object" && obj.status !== null;
    case "PUSH_NOTIFICATION":
      return typeof obj.notification === "object" && obj.notification !== null;
    case "SET_AUTH_STATUS":
      return typeof obj.status === "object" && obj.status !== null;

    // P1: Hook, Worktree, FileWatch, CI/CD, Security, Deploy, Prompt, Debug
    case "SET_HOOK_EVENT":
      return typeof obj.event === "object" && obj.event !== null;
    case "SET_WORKTREE_STATUS":
      return typeof obj.worktree === "object" && obj.worktree !== null;
    case "FILE_CHANGE_EXTERNAL":
      return typeof obj.change === "object" && obj.change !== null;
    case "SET_CI_CD_STATUS":
      return typeof obj.pipeline === "object" && obj.pipeline !== null;
    case "SET_SECURITY_SCAN":
      return typeof obj.scan === "object" && obj.scan !== null;
    case "SET_DEPLOY_STATUS":
      return typeof obj.deploy === "object" && obj.deploy !== null;
    case "PUSH_PROMPT_SUGGESTION":
      return typeof obj.suggestion === "object" && obj.suggestion !== null;
    case "SET_DEBUG_STATE":
      return typeof obj.state === "object" && obj.state !== null;

    // P2: Sandbox, Plugin, Wave, Verifier, Spec, Schedule, Steer, Bugbot
    case "SET_SANDBOX_STATUS":
      return typeof obj.status === "object" && obj.status !== null;
    case "SET_PLUGIN_STATUS":
      return Array.isArray(obj.plugins);
    case "SET_AGENT_WAVE":
      return typeof obj.wave === "object" && obj.wave !== null;
    case "SET_VERIFIER_RESULT":
      return typeof obj.result === "object" && obj.result !== null;
    case "UPDATE_LIVING_SPEC":
      return typeof obj.spec === "object" && obj.spec !== null;
    case "SET_SESSION_SCHEDULE":
      return Array.isArray(obj.schedules);
    case "STEER_AGENT":
      return typeof obj.steer === "object" && obj.steer !== null;
    case "SET_BUGBOT_STATUS":
      return typeof obj.status === "object" && obj.status !== null;
    // SOTA Features
    case "SET_AGENT_RULES":
      return Array.isArray(obj.rules);
    case "PUSH_RULE_VIOLATION":
      return typeof obj.violation === "object" && obj.violation !== null;
    case "SET_AUTO_CONTEXT":
      return typeof obj.state === "object" && obj.state !== null;
    case "SET_SPECULATIVE_EDITS":
      return typeof obj.turn_id === "string" && typeof obj.state === "object" && obj.state !== null;
    case "UPSERT_BACKGROUND_JOB":
      return typeof obj.job === "object" && obj.job !== null;
    case "REMOVE_BACKGROUND_JOB":
      return typeof obj.id === "string";
    case "SET_REPLAY_SESSION":
      return typeof obj.session === "object" && obj.session !== null;
    case "SET_DEBATE_SESSION":
      return typeof obj.turn_id === "string" && typeof obj.session === "object" && obj.session !== null;

    case "RESET_STORES":
    case "NOP":
      return true;
    default:
      return false;
  }
}
