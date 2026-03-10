/**
 * Resource Monitor / Cost Governor Protocol Types
 *
 * Token usage metrics, budget alerts, and cost governance.
 */

// ─── Resource Monitor / Cost Governor ───────────────────

// ─── ResourceMetrics Sub-interfaces (ISP) ──────────────
export interface TokenMetrics {
  readonly input: number;
  readonly output: number;
  readonly cached: number;
  readonly total: number;
}

export interface CostMetrics {
  readonly session_usd: number;
  readonly today_usd: number;
  readonly month_usd: number;
  readonly budget_usd: number;
  readonly remaining_usd: number;
}

export interface ModelUsageEntry {
  readonly model: string;
  readonly tokens: number;
  readonly cost_usd: number;
  readonly percentage: number;
}

export interface PerformanceMetrics {
  readonly avg_latency_ms: number;
  readonly p95_latency_ms: number;
  readonly requests_per_min: number;
  readonly error_rate: number;
}

export interface ResourceMetrics {
  readonly timestamp: number;
  readonly tokens: TokenMetrics;
  readonly cost: CostMetrics;
  readonly models: readonly ModelUsageEntry[];
  readonly performance: PerformanceMetrics;
}

export interface BudgetAlert {
  readonly threshold: number;
  readonly action: "warn" | "slow" | "stop";
  readonly triggered: boolean;
}

export interface CostGovernorConfig {
  readonly enabled: boolean;
  readonly budget_usd: number;
  readonly period: "session" | "daily" | "monthly";
  readonly alerts: readonly BudgetAlert[];
  readonly autoDowngrade: boolean;
  readonly autoDowngradeModel?: string;
}
