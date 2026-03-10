import type { Unsubscribe } from "@semantica/protocol";

// ── Query types ──────────────────────────────────────────

export interface QueryContext {
  readonly workspaceId: string;
  readonly repoIds?: string[];
  readonly sessionId?: string;
  readonly agentId?: string;
}

export interface QueryIntent {
  readonly category:
    | "impact"
    | "slice"
    | "callGraph"
    | "typeHierarchy"
    | "symbolGraph"
    | "taintFindings"
    | "sourceSinkPaths"
    | "securitySummary"
    | "cloneResults"
    | "metrics"
    | "deadCode"
    | "reviewEvidence"
    | "impactDelta"
    | "securityDelta"
    | "complexityDelta"
    | "serviceGraph"
    | "dependencyGraph"
    | "architectureViolations"
    | "replayTimeline"
    | "checkpointDiff"
    | "executionTrace";
  readonly params: Record<string, unknown>;
  readonly context: QueryContext;
}

export interface QueryJob {
  readonly id: string;
  readonly status: "running" | "completed" | "failed";
  readonly progress?: number;
  readonly result?: unknown;
  readonly error?: string;
}

// ── LSP Session Manager ──────────────────────────────────

export interface LspSessionManager {
  openDocument(uri: string): Promise<void>;
  closeDocument(uri: string): Promise<void>;
  changeDocument(uri: string, changes: unknown): Promise<void>;
  getDefinition(uri: string, line: number, column: number): Promise<unknown>;
  getReferences(uri: string, line: number, column: number): Promise<unknown>;
  getHover(uri: string, line: number, column: number): Promise<unknown>;
  getCompletion(uri: string, line: number, column: number): Promise<unknown>;
}

// ── Query Gateway ────────────────────────────────────────

export interface QueryGateway {
  query(intent: QueryIntent): Promise<QueryJob>;
  cancel(jobId: string): Promise<void>;
  getJob(jobId: string): Promise<QueryJob>;
}

// ── Result Normalizer ────────────────────────────────────

export interface ResultNormalizer {
  normalize(category: QueryIntent["category"], raw: unknown): unknown;
}

// ── Event Bridge ─────────────────────────────────────────

export type EventHandler = (event: unknown) => void;

export interface EventBridge {
  subscribe(domain: string, handler: EventHandler): Unsubscribe;
  subscribeAll(handler: EventHandler): Unsubscribe;
  getSnapshot(domain: string): unknown;
  emit(event: unknown): void;
}

// ── Capability / Policy Translator ───────────────────────

export type PolicyOutcome = "allow" | "deny" | "require_approval";

export interface PolicyQuery {
  readonly action: string;
  readonly resource: string;
  readonly agentId?: string;
  readonly riskLevel?: "low" | "medium" | "high" | "critical";
}

export interface PolicyResult {
  readonly outcome: PolicyOutcome;
  readonly reason?: string;
  readonly approvalRequired?: boolean;
}

export interface CapabilityTranslator {
  checkCapability(action: string): Promise<boolean>;
  evaluatePolicy(query: PolicyQuery): Promise<PolicyResult>;
  getVerdict(patchId: string): Promise<unknown>;
}

// ── Integration Kernel (main facade) ─────────────────────

export interface IntegrationKernel {
  readonly lsp: LspSessionManager;
  readonly query: QueryGateway;
  readonly normalizer: ResultNormalizer;
  readonly events: EventBridge;
  readonly policy: CapabilityTranslator;

  initialize(): Promise<void>;
  dispose(): void;
}
