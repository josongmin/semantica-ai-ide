/**
 * Mock data factories for testing and development.
 * Each factory returns a valid entity with sensible defaults.
 * Override any field by passing a partial.
 */
import {
  type AgentInstance,
  type AgentMessage,
  type ArchitectState,
  type ArenaResponse,
  type Attachment,
  type AutoMemorySuggestion,
  type BackgroundAgentStatus,
  type BookmarkLabel,
  type BoomerangTask,
  type BreadcrumbContext,
  type BrowserAction,
  type BrowserConsoleEntry,
  type Checkpoint,
  type ClassifiedError,
  type CompactionEvent,
  type ContextSpace,
  type CostGovernorConfig,
  createAgentInstanceId,
  createArenaResponseId,
  createBackgroundAgentId,
  createGitCommitId,
  createIntentId,
  createMcpServerId,
  createMcpToolCallId,
  createMemoryRuleId,
  createMessageId,
  createRemoteCommandId,
  createReviewCommentId,
  createSessionId,
  createTerminalSessionId,
  createTransactionId,
  createTurnId,
  createWorkspaceGraphNodeId,
  type ElementMapping,
  type ExportOptions,
  type FileChange,
  type GanttEntry,
  type GitCommit,
  type GraphEdge,
  type GraphNode,
  type IntegrationConnection,
  type IntentEntry,
  type LinkedTicket,
  type MachineSnapshot,
  type McpRegistryEntry,
  type McpServer,
  type McpTool,
  type McpToolCall,
  type MemoryRule,
  type MessageId,
  type MissionControlAgent,
  type ModeEntry,
  type ModelInfo,
  type ModelRoute,
  type Notepad,
  type PatchSimulationResult,
  type PlanChecklistItem,
  type PlaybookEntry,
  type PreviewState,
  type PrivacyState,
  type PromptTemplate,
  type PRSummary,
  type RemoteCommand,
  type ResourceMetrics,
  type ReviewComment,
  type SemanticDiffResult,
  type SemanticSearchResult,
  type SessionId,
  type SessionListEntry,
  type SessionMeta,
  type SessionStats,
  type ShareLink,
  type SymbolMention,
  type TeamConfig,
  type TerminalAgentAction,
  type TerminalOutput,
  type TerminalSession,
  type ThreeModelState,
  type ThreeWayDiffData,
  type TimelineEvent,
  type ToolCall,
  type ToolCallOutput,
  type TransactionStatus,
  type Turn,
  type TurnId,
  type TurnPhaseEntry,
  type UiMessage,
  type UsageModelBreakdown,
  type UsageStats,
  type VoiceInputState,
  type WikiPage,
  type WorkspaceGraphSnapshot,
} from "../../protocol";

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

export function createMessage(overrides: Partial<UiMessage> = {}): UiMessage {
  return {
    id: createMessageId(nextId("msg")),
    role: "assistant",
    created_at_ms: Date.now(),
    text: "Hello, this is a test message.",
    status: "final",
    ...overrides,
  };
}

export function createTurnPhase(overrides: Partial<TurnPhaseEntry> = {}): TurnPhaseEntry {
  return {
    phase: "thinking",
    message_ids: [],
    tool_call_ids: [],
    summary: "",
    collapsed: true,
    status: "pending",
    ...overrides,
  };
}

export function createTurn(overrides: Partial<Turn> = {}): Turn {
  return {
    id: createTurnId(nextId("turn")),
    phases: [
      createTurnPhase({ phase: "user_message", collapsed: false, status: "success" }),
      createTurnPhase({ phase: "thinking" }),
      createTurnPhase({ phase: "analysis" }),
      createTurnPhase({ phase: "plan" }),
      createTurnPhase({ phase: "changes" }),
      createTurnPhase({ phase: "summary", collapsed: false }),
    ],
    status: "pending",
    created_at_ms: Date.now(),
    ...overrides,
  };
}

export function createToolCall(overrides: Partial<ToolCall> = {}): ToolCall {
  return {
    id: nextId("tc"),
    turn_id: "turn_1",
    tool_name: "read_file",
    category: "read",
    args_summary: "src/index.ts",
    status: "success",
    result_summary: "200 lines read",
    duration_ms: 42,
    ...overrides,
  };
}

export function createFileChange(overrides: Partial<FileChange> = {}): FileChange {
  return {
    file_path: "src/app.tsx",
    turn_id: "turn_1",
    status: "modified",
    insertions: 10,
    deletions: 3,
    approval_status: "pending",
    ...overrides,
  };
}

export function createTimelineEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: nextId("evt"),
    turn_id: "turn_1",
    type: "tool_call_start",
    timestamp_ms: Date.now(),
    summary: "Started read_file",
    ...overrides,
  };
}

export function createSessionMeta(overrides: Partial<SessionMeta> = {}): SessionMeta {
  return {
    session_id: createSessionId("session_1"),
    model_id: "claude-opus-4-6",
    model_label: "Claude Opus 4.6",
    approval_mode: "auto",
    status: "idle",
    cost_usd: 0,
    tokens_in: 0,
    tokens_out: 0,
    ...overrides,
  };
}

export function createSessionStats(overrides: Partial<SessionStats> = {}): SessionStats {
  return {
    turns_count: 3,
    files_modified: 2,
    files_created: 1,
    files_deleted: 0,
    tool_calls_count: 8,
    errors_count: 0,
    ...overrides,
  };
}

export function createCheckpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
  return {
    id: nextId("cp"),
    turn_id: "turn_1",
    label: "Checkpoint",
    timestamp_ms: Date.now(),
    ...overrides,
  };
}

export function createToolCallOutput(overrides: Partial<ToolCallOutput> = {}): ToolCallOutput {
  return {
    stdout: "output text",
    stderr: "",
    exit_code: 0,
    ...overrides,
  };
}

export function createSessionListEntry(
  overrides: Partial<SessionListEntry> = {},
): SessionListEntry {
  return {
    session_id: createSessionId(nextId("session")),
    title: "Test Session",
    model_label: "Claude Opus 4.6",
    status: "completed",
    created_at_ms: Date.now(),
    cost_usd: 0.05,
    turn_count: 3,
    last_message_preview: "Here is the implementation...",
    ...overrides,
  };
}

export function createModelInfo(overrides: Partial<ModelInfo> = {}): ModelInfo {
  return {
    id: "claude-opus-4-6",
    label: "Claude Opus 4.6",
    provider: "anthropic",
    supports_thinking: true,
    ...overrides,
  };
}

export function createAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    type: "file",
    name: "test-file.ts",
    path: "src/test-file.ts",
    ...overrides,
  };
}

export function createPlanChecklistItem(
  overrides: Partial<PlanChecklistItem> = {},
): PlanChecklistItem {
  return {
    id: nextId("plan_item"),
    label: "Implement feature",
    status: "pending",
    ...overrides,
  };
}

export function createClassifiedError(overrides: Partial<ClassifiedError> = {}): ClassifiedError {
  return {
    category: "unknown",
    message: `Test error ${++idCounter}`,
    ...overrides,
  };
}

/** Create a bookmarked turn (convenience wrapper) */
export function createBookmarkedTurn(
  label: BookmarkLabel = "important",
  overrides: Partial<Turn> = {},
): Turn {
  return createTurn({
    bookmarked: true,
    bookmark_label: label,
    ...overrides,
  });
}

/** Create a message with quote */
export function createQuotedMessage(
  quotedMessageId: MessageId,
  quotedText: string,
  overrides: Partial<UiMessage> = {},
): UiMessage {
  return createMessage({
    quoted_message_id: quotedMessageId,
    quoted_text: quotedText,
    ...overrides,
  });
}

/** Create a forked session meta */
export function createForkedSessionMeta(
  sourceSessionId: SessionId,
  sourceTurnId: TurnId,
  overrides: Partial<SessionMeta> = {},
): SessionMeta {
  return createSessionMeta({
    forked_from: {
      session_id: sourceSessionId,
      turn_id: sourceTurnId,
    },
    ...overrides,
  });
}

export function createSymbolMention(overrides: Partial<SymbolMention> = {}): SymbolMention {
  return {
    name: `symbol_${++idCounter}`,
    kind: "function",
    file_path: "src/utils.ts",
    turn_id: "turn_1",
    ...overrides,
  };
}

export function createPatchSimulationResult(
  overrides: Partial<PatchSimulationResult> = {},
): PatchSimulationResult {
  return {
    file_path: "src/app.ts",
    conflict_risk: "none",
    affected_files: [],
    ...overrides,
  };
}

export function createAutoMemorySuggestion(
  overrides: Partial<AutoMemorySuggestion> = {},
): AutoMemorySuggestion {
  return {
    id: nextId("sug"),
    title: "Auto-suggested pattern",
    content: "Detected pattern content",
    confidence: 0.8,
    ...overrides,
  };
}

export function createCompactionEvent(overrides: Partial<CompactionEvent> = {}): CompactionEvent {
  return {
    id: nextId("compact"),
    timestamp_ms: Date.now(),
    tokens_before: 100_000,
    tokens_after: 60_000,
    summary: "Compacted conversation context",
    ...overrides,
  };
}

export function createShareLink(overrides: Partial<ShareLink> = {}): ShareLink {
  return {
    url: `https://share.example.com/${nextId("share")}`,
    expires_at_ms: Date.now() + 24 * 60 * 60 * 1000,
    masked: true,
    ...overrides,
  };
}

export function createPRSummary(overrides: Partial<PRSummary> = {}): PRSummary {
  return {
    title: "Add authentication flow",
    changes: [
      createFileChange({ file_path: "src/auth.ts", status: "added", insertions: 50, deletions: 0 }),
      createFileChange({
        file_path: "src/app.ts",
        status: "modified",
        insertions: 5,
        deletions: 2,
      }),
    ],
    intent: "Implement user authentication with JWT tokens and session management.",
    todos: ["Add unit tests for auth module", "Configure rate limiting"],
    ...overrides,
  };
}

export function createBoomerangTask(overrides: Partial<BoomerangTask> = {}): BoomerangTask {
  return {
    id: nextId("boom"),
    parent_turn_id: createTurnId("turn_1"),
    label: "Subtask",
    status: "pending",
    ...overrides,
  };
}

export function createMissionControlAgent(
  overrides: Partial<MissionControlAgent> = {},
): MissionControlAgent {
  return {
    id: createAgentInstanceId(nextId("agent")),
    name: `Agent ${idCounter}`,
    status: "running",
    current_task: "Working on implementation",
    progress_pct: 50,
    risk_level: "safe",
    eta_ms: 30000,
    ...overrides,
  };
}

export function createBreadcrumbContext(
  overrides: Partial<BreadcrumbContext> = {},
): BreadcrumbContext {
  return {
    session_name: "Test Session",
    ...overrides,
  };
}

export function createArchitectState(overrides: Partial<ArchitectState> = {}): ArchitectState {
  return {
    active_role: "planner",
    model_name: "Claude Opus 4.6",
    ...overrides,
  };
}

export function createModelRoute(overrides: Partial<ModelRoute> = {}): ModelRoute {
  return {
    task_type: "code_generation",
    model: "Claude Opus 4.6",
    reason: "Complex task requiring deep reasoning",
    timestamp_ms: Date.now(),
    ...overrides,
  };
}

export function createMcpRegistryEntry(
  overrides: Partial<McpRegistryEntry> = {},
): McpRegistryEntry {
  return {
    id: nextId("mcp_reg"),
    name: "Example MCP Server",
    description: "An example MCP server for testing.",
    author: "Test Author",
    rating: 4.5,
    install_count: 1200,
    installed: false,
    categories: ["tools", "testing"],
    compatibility: ">=1.0.0",
    ...overrides,
  };
}

export function createPrivacyState(overrides: Partial<PrivacyState> = {}): PrivacyState {
  return {
    mode: "local",
    details: "All data stays on your machine. No external services are contacted.",
    ...overrides,
  };
}

export function createNotepad(overrides: Partial<Notepad> = {}): Notepad {
  return {
    id: nextId("np"),
    title: "My Notes",
    content: "Some example content.",
    updated_at_ms: Date.now(),
    ...overrides,
  };
}

export function createUsageModelBreakdown(
  overrides: Partial<UsageModelBreakdown> = {},
): UsageModelBreakdown {
  return {
    model: `model_${++idCounter}`,
    tokens: 50_000,
    cost_usd: 0.25,
    ...overrides,
  };
}

export function createUsageStats(overrides: Partial<UsageStats> = {}): UsageStats {
  return {
    total_sessions: 5,
    total_cost_usd: 1.5,
    total_tokens: 250_000,
    per_model: [
      createUsageModelBreakdown({ model: "claude-opus-4-6", tokens: 150_000, cost_usd: 1.0 }),
      createUsageModelBreakdown({ model: "claude-sonnet-4", tokens: 100_000, cost_usd: 0.5 }),
    ],
    ...overrides,
  };
}

export function createGanttEntry(overrides: Partial<GanttEntry> = {}): GanttEntry {
  const start = Date.now();
  return {
    id: nextId("gantt"),
    tool_name: "read_file",
    start_ms: start,
    end_ms: start + 500,
    status: "success",
    tool_type: "read",
    ...overrides,
  };
}

export function createThreeWayDiffData(
  overrides: Partial<ThreeWayDiffData> = {},
): ThreeWayDiffData {
  return {
    id: nextId("diff3"),
    turn_id: createTurnId("turn_1"),
    file_path: "src/app.ts",
    base_content: "const a = 1;\nconst b = 2;\nconst c = 3;",
    agent_content: "const a = 1;\nconst b = 42;\nconst c = 3;",
    current_content: "const a = 1;\nconst b = 99;\nconst c = 3;",
    conflicts: [{ start_line: 2, end_line: 2 }],
    status: "pending" as const,
    ...overrides,
  };
}

export function createExportOptions(overrides: Partial<ExportOptions> = {}): ExportOptions {
  return {
    include_diffs: true,
    include_tool_calls: true,
    include_timestamps: true,
    ...overrides,
  };
}

export function createTeamConfig(overrides: Partial<TeamConfig> = {}): TeamConfig {
  return {
    key: `config.${nextId("key")}`,
    local_value: "local_value",
    team_value: "team_value",
    status: "different",
    ...overrides,
  };
}

export function createPromptTemplate(overrides: Partial<PromptTemplate> = {}): PromptTemplate {
  return {
    id: nextId("tpl"),
    name: `Template ${idCounter}`,
    description: "A test template",
    template: "Please help me with {{task}}",
    scope: "personal",
    ...overrides,
  };
}

export function createThreeModelState(overrides: Partial<ThreeModelState> = {}): ThreeModelState {
  return {
    planner: { model: "claude-opus-4-6", status: "idle", output: "" },
    coder: { model: "claude-sonnet", status: "idle", output: "" },
    critic: { model: "claude-haiku", status: "idle", output: "" },
    ...overrides,
  };
}

export function createWikiPage(overrides: Partial<WikiPage> = {}): WikiPage {
  return {
    id: nextId("wiki"),
    title: "Wiki Page",
    content: "# Documentation\nDefault content",
    updated_at_ms: Date.now(),
    ...overrides,
  };
}

export function createElementMapping(overrides: Partial<ElementMapping> = {}): ElementMapping {
  return {
    selector: `.element-${++idCounter}`,
    file_path: "src/Component.tsx",
    line: 10,
    column: 3,
    ...overrides,
  };
}

export function createPreviewState(overrides: Partial<PreviewState> = {}): PreviewState {
  return {
    url: "http://localhost:3000",
    status: "connected",
    ...overrides,
  };
}

export function createVoiceInputState(overrides: Partial<VoiceInputState> = {}): VoiceInputState {
  return {
    status: "idle",
    ...overrides,
  };
}

export function createBrowserAction(overrides: Partial<BrowserAction> = {}): BrowserAction {
  return {
    id: nextId("action"),
    type: "click",
    timestamp_ms: Date.now(),
    ...overrides,
  };
}

export function createMachineSnapshot(overrides: Partial<MachineSnapshot> = {}): MachineSnapshot {
  return {
    id: nextId("snap"),
    label: `Snapshot ${idCounter}`,
    created_at_ms: Date.now(),
    size_mb: 128.5,
    status: "ready",
    ...overrides,
  };
}

export function createModeEntry(overrides: Partial<ModeEntry> = {}): ModeEntry {
  return {
    id: nextId("mode"),
    name: `Mode ${idCounter}`,
    description: "A community workflow mode",
    author: "community-author",
    rating: 4.5,
    install_count: 1000,
    installed: false,
    categories: ["general"],
    ...overrides,
  };
}

export function createPlaybookEntry(overrides: Partial<PlaybookEntry> = {}): PlaybookEntry {
  return {
    id: nextId("playbook"),
    name: `Playbook ${idCounter}`,
    description: "An agent playbook",
    version: "1.0.0",
    author: "playbook-author",
    rating: 4.2,
    installed: false,
    category: "general",
    ...overrides,
  };
}

export function createContextSpace(overrides: Partial<ContextSpace> = {}): ContextSpace {
  return {
    id: nextId("space"),
    name: `Context Space ${idCounter}`,
    description: "A shared context bundle",
    files: ["src/index.ts", "src/app.ts"],
    rules: ["Use TypeScript strict mode"],
    active: true,
    ...overrides,
  };
}

export function createIntegrationConnection(
  overrides: Partial<IntegrationConnection> = {},
): IntegrationConnection {
  return {
    id: nextId("integration"),
    platform: "slack",
    channel: "#dev-updates",
    status: "connected",
    last_sync_ms: Date.now() - 300_000,
    ...overrides,
  };
}

export function createLinkedTicket(overrides: Partial<LinkedTicket> = {}): LinkedTicket {
  return {
    id: nextId("ticket"),
    key: `ENG-${idCounter}`,
    title: "Implement feature",
    status: "In Progress",
    platform: "linear",
    url: `https://linear.app/team/ENG-${idCounter}`,
    ...overrides,
  };
}

export function createAgentMessage(overrides: Partial<AgentMessage> = {}): AgentMessage {
  return {
    id: nextId("amsg"),
    from_agent: "agent-alpha",
    to_agent: "agent-beta",
    content: "Task completed successfully.",
    timestamp_ms: Date.now(),
    message_type: "response",
    ...overrides,
  };
}

// ─── Feature 1: Parallel Agents ──────────────────────────────

export function createAgentInstance(overrides: Partial<AgentInstance> = {}): AgentInstance {
  return {
    id: createAgentInstanceId(nextId("agent")),
    label: "Test Agent",
    status: "queued",
    progress: 0,
    model_id: "claude-opus-4-6",
    created_at_ms: Date.now(),
    ...overrides,
  };
}

// ─── Feature 2: Semantic Indexing ───────────────────────────

export function createSemanticSearchResult(
  overrides: Partial<SemanticSearchResult> = {},
): SemanticSearchResult {
  return {
    file_path: "src/app.tsx",
    line_number: 42,
    snippet: "export function App() {",
    score: 0.95,
    ...overrides,
  };
}

// ─── Feature 3: MCP ──────────────────────────────────────────

export function createMcpServer(overrides: Partial<McpServer> = {}): McpServer {
  return {
    id: createMcpServerId(nextId("mcp_server")),
    name: "Test MCP Server",
    url: "http://localhost:3000",
    status: "connected",
    enabled: true,
    tool_count: 3,
    ...overrides,
  };
}

export function createMcpTool(overrides: Partial<McpTool> = {}): McpTool {
  return {
    server_id: createMcpServerId("mcp_server_1"),
    tool_name: "test_tool",
    description: "A test MCP tool",
    requires_approval: false,
    input_schema: { type: "object", properties: {} },
    ...overrides,
  };
}

export function createMcpToolCall(overrides: Partial<McpToolCall> = {}): McpToolCall {
  return {
    id: createMcpToolCallId(nextId("mcp_tc")),
    turn_id: "turn_1",
    server_id: createMcpServerId("mcp_server_1"),
    tool_name: "test_tool",
    args_summary: "{}",
    status: "success",
    ...overrides,
  };
}

// ─── Feature 5: Browser Preview ─────────────────────────────

export function createBrowserConsoleEntry(
  overrides: Partial<BrowserConsoleEntry> = {},
): BrowserConsoleEntry {
  return {
    id: nextId("console"),
    timestamp_ms: Date.now(),
    level: "log",
    message: "Browser console message",
    ...overrides,
  };
}

// ─── Feature 6: Project Memory ───────────────────────────────

export function createMemoryRule(overrides: Partial<MemoryRule> = {}): MemoryRule {
  return {
    id: createMemoryRuleId(nextId("rule")),
    title: "Test Rule",
    content: "Always use TypeScript strict mode.",
    source: "custom",
    active: true,
    created_at_ms: Date.now(),
    ...overrides,
  };
}

// ─── Feature 7: Arena Mode ───────────────────────────────────

export function createArenaResponse(overrides: Partial<ArenaResponse> = {}): ArenaResponse {
  return {
    id: createArenaResponseId(nextId("arena_resp")),
    slot: "A",
    model_id: "claude-opus-4-6",
    model_label: "Claude Opus 4.6",
    text: "Arena response text.",
    status: "final",
    created_at_ms: Date.now(),
    ...overrides,
  };
}

// ─── Feature 8: Git Auto-Commit ─────────────────────────────

export function createGitCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    id: createGitCommitId(nextId("commit")),
    sha: "abc1234",
    message: "auto: apply agent changes",
    timestamp_ms: Date.now(),
    auto: true,
    ...overrides,
  };
}

// ─── Feature 9: AI Code Review ───────────────────────────────

export function createReviewComment(overrides: Partial<ReviewComment> = {}): ReviewComment {
  return {
    id: createReviewCommentId(nextId("review")),
    file_path: "src/app.tsx",
    line_start: 10,
    line_end: 12,
    text: "Consider extracting this logic into a separate function.",
    severity: "suggestion",
    message: "Consider extracting this logic into a separate function.",
    status: "open",
    ...overrides,
    line: overrides.line ?? overrides.line_start ?? 10,
  };
}

// ─── Feature 10: Remote Control ─────────────────────────────

export function createRemoteCommand(overrides: Partial<RemoteCommand> = {}): RemoteCommand {
  return {
    id: createRemoteCommandId(nextId("remote_cmd")),
    text: "run tests",
    received_at_ms: Date.now(),
    executed: false,
    ...overrides,
  };
}

// ─── AI Native Coding OS Factories ──────────────────────────

export function createBackgroundAgent(overrides: Partial<BackgroundAgentStatus> = {}): BackgroundAgentStatus {
  return {
    agentId: createBackgroundAgentId(nextId("bg_agent")),
    kind: "lint-watch",
    label: "Lint Watch",
    state: "running",
    progress: { current: 3, total: 10 },
    lastResult: { summary: "3 warnings found", issues: 3, fixesApplied: 1, timestamp: Date.now() },
    logs: ["Started lint-watch agent", "Scanning files..."],
    startedAt: Date.now() - 60_000,
    config: {},
    ...overrides,
  };
}

export function createTransactionStatus(overrides: Partial<TransactionStatus> = {}): TransactionStatus {
  return {
    txId: createTransactionId(nextId("txn")),
    state: "preview",
    files: [
      {
        filePath: "src/App.tsx",
        type: "modify",
        hunks: [{ startLine: 1, endLine: 8, content: "+import React...", type: "add" }],
        insertions: 3,
        deletions: 0,
        included: true,
      },
    ],
    validationErrors: [],
    createdAt: Date.now(),
    description: "Add authentication module",
    ...overrides,
  };
}

export function createIntentEntry(overrides: Partial<IntentEntry> = {}): IntentEntry {
  return {
    id: createIntentId(nextId("intent")),
    summary: "Implement authentication",
    status: "active",
    turnIds: [],
    tags: ["auth"],
    createdAt: Date.now(),
    relatedFiles: ["src/auth.ts"],
    childIntents: [],
    ...overrides,
  };
}

export function createGraphNode(overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id: createWorkspaceGraphNodeId(nextId("gnode")),
    name: "MyComponent",
    kind: "function",
    filePath: "src/components/MyComponent.tsx",
    line: 42,
    connections: [],
    metrics: { complexity: 3, changeFreq: 2, lastModified: Date.now() },
    ...overrides,
  };
}

export function createGraphEdge(overrides: Partial<GraphEdge> = {}): GraphEdge {
  return {
    source: createWorkspaceGraphNodeId(nextId("gnode")),
    target: createWorkspaceGraphNodeId(nextId("gnode")),
    kind: "imports",
    ...overrides,
  };
}

export function createWorkspaceGraph(overrides: Partial<WorkspaceGraphSnapshot> = {}): WorkspaceGraphSnapshot {
  const nodes = overrides.nodes ?? [createGraphNode(), createGraphNode({ name: "useAuth", kind: "function" })];
  return {
    nodes,
    edges: overrides.edges ?? [createGraphEdge({ source: nodes[0]?.id ?? createWorkspaceGraphNodeId(""), target: nodes[1]?.id ?? createWorkspaceGraphNodeId("") })],
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createTerminalSession(overrides: Partial<TerminalSession> = {}): TerminalSession {
  return {
    id: createTerminalSessionId(nextId("term")),
    sessionId: nextId("term-session"),
    name: "bash",
    title: "bash",
    cwd: "/workspace",
    isActive: true,
    shellType: "bash",
    pid: 1234,
    createdAt: Date.now(),
    status: "running",
    provenance: null,
    mode: "default",
    markerSupport: false,
    ...overrides,
  };
}

export function createTerminalAction(overrides: Partial<TerminalAgentAction> = {}): TerminalAgentAction {
  return {
    id: nextId("tact"),
    sessionId: createTerminalSessionId(nextId("term")),
    command: "npm test",
    reason: "Run test suite after code changes",
    requiresApproval: true,
    status: "pending",
    ...overrides,
  };
}

export function createTerminalOutput(overrides: Partial<TerminalOutput> = {}): TerminalOutput {
  return {
    sessionId: createTerminalSessionId(nextId("term")),
    text: "PASS src/App.test.tsx",
    timestamp: Date.now(),
    isError: false,
    ...overrides,
  };
}

export function createSemanticDiff(overrides: Partial<SemanticDiffResult> = {}): SemanticDiffResult {
  return {
    turnId: createTurnId(nextId("turn")),
    overallNarrative: "Added user authentication with JWT tokens",
    groups: [
      {
        id: nextId("sg"),
        title: "JWT Auth Middleware",
        category: "feature",
        impact: "medium",
        narrative: "New JWT auth middleware",
        files: [
          { filePath: "src/middleware/auth.ts", hunks: [{ startLine: 1, endLine: 20, content: "+export function auth...", type: "add" }] },
        ],
        relatedGroupIds: [],
      },
    ],
    riskAssessment: { level: "safe", reasons: ["Well-tested pattern"] },
    ...overrides,
  };
}

export function createResourceMetrics(overrides: Partial<ResourceMetrics> = {}): ResourceMetrics {
  return {
    timestamp: Date.now(),
    tokens: { input: 15400, output: 6200, cached: 8000, total: 21600 },
    cost: { session_usd: 0.047, today_usd: 0.12, month_usd: 2.35, budget_usd: 5.0, remaining_usd: 2.65 },
    models: [
      { model: "claude-sonnet-4-6", tokens: 21600, cost_usd: 0.047, percentage: 100 },
    ],
    performance: { avg_latency_ms: 320, p95_latency_ms: 850, requests_per_min: 12, error_rate: 0.02 },
    ...overrides,
  };
}

export function createCostGovernorConfig(overrides: Partial<CostGovernorConfig> = {}): CostGovernorConfig {
  return {
    enabled: true,
    budget_usd: 5.0,
    period: "session",
    alerts: [{ threshold: 0.8, action: "warn", triggered: false }],
    autoDowngrade: true,
    autoDowngradeModel: "claude-haiku-4-5-20251001",
    ...overrides,
  };
}

/** Reset the ID counter (useful between tests) */
export function resetIdCounter(): void {
  idCounter = 0;
}
