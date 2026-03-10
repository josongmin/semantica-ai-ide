/**
 * Protocol Types — Barrel Export
 *
 * Explicit named re-exports from all domain-specific type files.
 * This eliminates transitive `export *` chains for better tree-shaking
 * and import clarity. Every public symbol is listed explicitly.
 */

// ── agent-os.ts ──────────────────────────────────────────────
export type {
  BackgroundAgentKind,
  BackgroundAgentState,
  BackgroundAgentStatus,
  IntentEntry,
  IntentStatus,
  TransactionFileChange,
  TransactionState,
  TransactionStatus,
} from "./agent-os";

// ── arena.ts ─────────────────────────────────────────────────
export type {
  ArenaModelSlot,
  ArenaResponse,
  ArenaResponseStatus,
  ArenaWinner,
  ConsensusResult,
  DebateAgent,
  DebateAgentStatus,
  DebateSession,
} from "./arena";

// ── browser.ts ───────────────────────────────────────────────
export type {
  BrowserAction,
  BrowserActionType,
  BrowserConsoleEntry,
  BrowserConsoleLevel,
  BrowserState,
} from "./browser";

// ── core.ts ──────────────────────────────────────────────────
export type {
  AgentInstanceId,
  ApprovalStatus,
  ArenaResponseId,
  BackgroundAgentId,
  ClassifiedError,
  CodeLensActionId,
  ConflictRisk,
  ErrorCategory,
  ExportFormat,
  ExportProgress,
  GitCommitId,
  IntentId,
  KnowledgeEntryId,
  McpServerId,
  McpToolCallId,
  MemoryRuleId,
  MessageId,
  PatchIR,
  PluginId,
  PrivacyMode,
  ProjectTodoId,
  RemoteCommandId,
  RestoreMode,
  ReviewCommentId,
  RiskLevel,
  SessionId,
  TeamMemberId,
  TerminalSessionId,
  TransactionId,
  TurnId,
  WorkspaceGraphNodeId,
} from "./core";
export {
  createAgentInstanceId,
  createArenaResponseId,
  createBackgroundAgentId,
  createCodeLensActionId,
  createGitCommitId,
  createIntentId,
  createKnowledgeEntryId,
  createMcpServerId,
  createMcpToolCallId,
  createMemoryRuleId,
  createMessageId,
  createPluginId,
  createProjectTodoId,
  createRemoteCommandId,
  createReviewCommentId,
  createSessionId,
  createTeamMemberId,
  createTerminalSessionId,
  createTransactionId,
  createTurnId,
  createWorkspaceGraphNodeId,
} from "./core";

// ── cost.ts ──────────────────────────────────────────────────
export type {
  BudgetAlert,
  CostGovernorConfig,
  ResourceMetrics,
} from "./cost";

// ── devops.ts ────────────────────────────────────────────────
export type {
  AgentSteer,
  AgentWave,
  AgentWavePhase,
  AppNotification,
  AuthState,
  AuthStatus,
  BugbotIssue,
  BugbotPhase,
  BugbotStatus,
  CiCdPhase,
  CiCdPipeline,
  DebugHypothesis,
  DebugPhase,
  DebugState,
  DeployPhase,
  DeployStatus,
  DeployTarget,
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticSource,
  ExternalChangeType,
  ExternalFileChange,
  HookEvent,
  HookEventName,
  HookEventPhase,
  LivingSpec,
  NotificationType,
  NotificationUrgency,
  PluginInfo,
  PluginPhase,
  QuotaAlertLevel,
  QuotaStatus,
  SandboxStatus,
  SandboxViolationType,
  ScheduleFrequency,
  SecurityFinding,
  SecurityFindingSeverity,
  SecurityScan,
  SecurityScanType,
  SessionSchedule,
  SteerAction,
  TerminalChunk,
  TerminalStreamType,
  TestCase,
  TestResults,
  TestRunnerStatus,
  TestStatus,
  VerifierOutcome,
  VerifierResult,
  WorktreePhase,
  WorktreeStatus,
} from "./devops";

// ── git.ts ───────────────────────────────────────────────────
export type { GitCommit } from "./git";

// ── mcp.ts ───────────────────────────────────────────────────
export type {
  McpRegistryEntry,
  McpServer,
  McpServerStatus,
  McpTool,
  McpToolCall,
  McpToolCallStatus,
} from "./mcp";

// ── message.ts ───────────────────────────────────────────────
export type {
  AgentMessage,
  AgentMessageType,
  AgentRole,
  Attachment,
  AttachmentType,
  DiffRef,
  MessageStatus,
  UiMessage,
} from "./message";

// ── pipeline.ts ──────────────────────────────────────────────
export type {
  AgentRule,
  AgentRuleSource,
  AgentRuleStatus,
  AutoContextState,
  BackgroundJob,
  BackgroundJobPhase,
  BudgetAllocation,
  ChangeSize,
  ContextSuggestion,
  CounterExample,
  DecisionTraceEntry,
  DriftAlert,
  DriftAlertSeverity,
  DriftAlertType,
  DriftGuardState,
  EquivalenceResult,
  EvidenceBundle,
  ExplainableVerdict,
  FailClosedConstraints,
  HypothesisNode,
  InputGateResult,
  IntentType,
  InvariantResult,
  PipelineMode,
  QAPIQueryType,
  QAPIResult,
  ReplaySession,
  ReplayStep,
  ReplayStepType,
  RiskHeatmapEntry,
  RiskWitness,
  RuleViolation,
  SideEffectBudget,
  SideEffectBudgetStatus,
  SpeculativeEdit,
  SpeculativeEditState,
  StrategyState,
  StrategyType,
  TurnPipeline,
  UncertaintyLevel,
  ValidationGateStatus,
  ValidationState,
  VerdictImpact,
  VerdictReason,
} from "./pipeline";

// ── semantic-diff.ts ─────────────────────────────────────────
export type {
  SemanticChangeGroup,
  SemanticDiffResult,
} from "./semantic-diff";

// ── server-event.ts ──────────────────────────────────────────
export type {
  ServerEvent,
  ServerEventBatch,
  ServerEventType,
} from "./server-event";
export { isServerEvent, isServerEventBatch } from "./server-event";

// ── session.ts ───────────────────────────────────────────────
export type {
  AgentInstance,
  AgentInstanceStatus,
  AgentRequestMode,
  ApprovalMode,
  ArchitectRole,
  ArchitectState,
  AutoMemorySuggestion,
  BookmarkLabel,
  BoomerangTask,
  BoomerangTaskStatus,
  BreadcrumbContext,
  Checkpoint,
  CompactionEvent,
  CompletionSettings,
  CompletionStats,
  ContextPressureLevel,
  IndexStatus,
  MemoryRule,
  MemoryRuleSource,
  MissionControlAgent,
  MissionControlAgentStatus,
  ModelInfo,
  ModelRoute,
  PatchSimulationResult,
  PlanChecklistItem,
  PlanChecklistItemStatus,
  ProjectTodo,
  ProjectTodoPriority,
  ProjectTodoStatus,
  RemoteCommand,
  RemoteConnectionStatus,
  ReviewComment,
  ReviewCommentStatus,
  ReviewSeverity,
  SemanticSearchResult,
  SessionListEntry,
  SessionMeta,
  SessionMetaConfig,
  SessionMetaCore,
  SessionMetaScope,
  SessionMetaUsage,
  SessionStats,
  SessionStatus,
  SymbolKind,
  SymbolMention,
  TimelineEvent,
  TimelineEventType,
  Turn,
  TurnPhase,
  TurnPhaseEntry,
  TurnStatus,
} from "./session";

// ── terminal.ts ──────────────────────────────────────────────
export type {
  TerminalAgentAction,
  TerminalOutput,
  TerminalSession,
} from "./terminal";

// ── tool.ts ──────────────────────────────────────────────────
export type {
  DiffHunk,
  DiffLineKind,
  DiffResult,
  DiffResultLine,
  FileChange,
  FileChangeStatus,
  FileChangeSummary,
  ToolCall,
  ToolCallGroup,
  ToolCallOutput,
  ToolCallStatus,
  ToolCategory,
} from "./tool";

// ── ui.ts ────────────────────────────────────────────────────
export type {
  ConfigChoice,
  ContextSpace,
  ElementMapping,
  ExportOptions,
  GanttEntry,
  GanttEntryStatus,
  GanttToolType,
  IntegrationConnection,
  IntegrationPlatform,
  IntegrationStatus,
  LinkedTicket,
  MachineSnapshot,
  MachineSnapshotStatus,
  ModeEntry,
  ModelRoleState,
  ModelRoleStatus,
  Notepad,
  PlaybookEntry,
  PreviewState,
  PreviewStatus,
  PrivacyState,
  PromptSuggestion,
  PromptTemplate,
  PromptTemplateScope,
  PRSummary,
  ShareLink,
  SurfaceId,
  TeamConfig,
  TeamConfigStatus,
  ThreeModelState,
  ThreeWayConflictRegion,
  ThreeWayDiffData,
  ThreeWayDiffResolution,
  ThreeWayDiffStatus,
  TicketPlatform,
  TodoFilterStatus,
  TodoSortKey,
  UsageModelBreakdown,
  UsageStats,
  UserInputChoice,
  UserInputRequest,
  UserInputRequestStatus,
  UserInputResponseType,
  VoiceInputState,
  VoiceInputStatus,
  WikiPage,
} from "./ui";

// ── system-intelligence.ts ───────────────────────────────
export type {
  AnalysisRiskLevel,
  AnalysisSymbolKind,
  ArchViolation,
  CausalChainEdge,
  CausalChainNode,
  CausalRole,
  CauseConfidence,
  CommitRef,
  DataflowEdge,
  EvidenceItem,
  EvidenceKind,
  ImpactCategory,
  ImpactDirection,
  ImpactSeverity,
  IntentCategory,
  IntentSessionStatus,
  LensKind,
  SymbolRef,
  TaintLabel,
  TestRef,
  ViolationKind,
} from "./system-intelligence";

// ── workspace-graph.ts ───────────────────────────────────────
export type {
  GraphEdge,
  GraphNode,
  GraphNodeKind,
  WorkspaceGraphSnapshot,
} from "./workspace-graph";
