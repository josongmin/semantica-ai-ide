// ─── Integration Kernel Types ─────────────────────────────
// Local type definitions mirroring @semantica/kernel interfaces.
// These will be replaced by the actual package types once wired up.

/** Transport layer for kernel communication */
export interface KernelTransport {
  send(channel: string, data: unknown): void;
  on(channel: string, handler: (data: unknown) => void): () => void;
}

/** Query intent describing what to search/analyze */
export interface QueryIntent {
  readonly category: string;
  readonly params: Record<string, unknown>;
  readonly context: QueryContext;
}

/** Context for a query execution */
export interface QueryContext {
  readonly workspaceId: string;
  readonly repoIds?: string[];
  readonly sessionId?: string;
  readonly agentId?: string;
}

/** A running or completed query job */
export interface QueryJob {
  readonly id: string;
  readonly status: "running" | "completed" | "failed";
  readonly progress?: number;
  readonly result?: unknown;
  readonly error?: string;
}

/** Gateway for executing semantic queries */
export interface QueryGateway {
  query(intent: QueryIntent): Promise<QueryJob>;
  cancel(jobId: string): Promise<void>;
  getJob(jobId: string): Promise<QueryJob>;
}

/** Bridge for domain event pub/sub */
export interface EventBridge {
  subscribe(domain: string, handler: (event: unknown) => void): () => void;
  subscribeAll(handler: (event: unknown) => void): () => void;
  getSnapshot(domain: string): unknown;
  emit(event: unknown): void;
}

/** Policy evaluation request */
export interface PolicyRequest {
  readonly action: string;
  readonly resource: string;
  readonly riskLevel?: "low" | "medium" | "high" | "critical";
}

/** Policy evaluation result */
export interface PolicyResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

/** Policy engine for capability and access checks */
export interface PolicyEngine {
  checkCapability(action: string): Promise<boolean>;
  evaluatePolicy(request: PolicyRequest): Promise<PolicyResult>;
}

/** The main Integration Kernel interface */
export interface IntegrationKernel {
  readonly lsp: unknown;
  readonly query: QueryGateway;
  readonly events: EventBridge;
  readonly policy: PolicyEngine;
  readonly normalizer: unknown;
  initialize(): Promise<void>;
  dispose(): void;
}

/** Kernel initialization status */
export type KernelStatus = "uninitialized" | "initializing" | "ready" | "error";

/**
 * Factory function to create a kernel instance.
 * Placeholder signature -- the real implementation lives in @semantica/kernel.
 */
export type CreateKernelFn = (transport: KernelTransport) => IntegrationKernel;
