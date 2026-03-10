/**
 * System Intelligence Protocol Types
 *
 * Shared types for System Lens, Impact Radar, Root Cause, Dataflow,
 * Architecture Guardian, Self-Explain, and Intent Engine features.
 *
 * Reuses existing types: SymbolKind (session.ts), RiskLevel (core.ts),
 * GraphNodeKind/GraphEdge (workspace-graph.ts).
 */

// ─── Symbol Reference ────────────────────────────────────
// Extends SymbolKind from session.ts with analysis-specific kinds

export type AnalysisSymbolKind =
  | "function"
  | "method"
  | "class"
  | "interface"
  | "variable"
  | "module"
  | "type"
  | "hook"
  | "enum"
  | "namespace";

// ─── Risk & Severity ────────────────────────────────────

export type AnalysisRiskLevel = "none" | "low" | "medium" | "high" | "critical";

export type ImpactSeverity = "breaking" | "major" | "minor" | "cosmetic";

export type ImpactDirection = "direct" | "transitive-1" | "transitive-2+";

export type ImpactCategory = "module" | "test" | "api" | "service" | "config" | "type";

export type CauseConfidence = number; // 0–1

// ─── Common Refs ─────────────────────────────────────────

export interface CommitRef {
  readonly hash: string;
  readonly message: string;
  readonly author: string;
  readonly daysAgo: number;
}

export interface TestRef {
  readonly id: string;
  readonly name: string;
  readonly filePath: string;
  readonly status: "pass" | "fail" | "skip";
  readonly lastRun: number;
}

export interface SymbolRef {
  readonly id: string;
  readonly name: string;
  readonly kind: AnalysisSymbolKind;
  readonly filePath: string;
  readonly line: number;
  readonly module: string;
}

// ─── Dataflow ────────────────────────────────────────────

export type TaintLabel = "user-input" | "db-result" | "config" | "env" | "network" | "file-io";

export interface DataflowEdge {
  readonly fromSymbol: string;
  readonly toSymbol: string;
  readonly transformations: readonly string[];
  readonly taintLabel?: TaintLabel;
}

// ─── Evidence ────────────────────────────────────────────

export type EvidenceKind =
  | "call-path"
  | "dataflow-path"
  | "recent-commit"
  | "runtime-trace"
  | "test-failure"
  | "stack-trace"
  | "config-change"
  | "layer-violation";

export interface EvidenceItem {
  readonly id: string;
  readonly kind: EvidenceKind;
  readonly title: string;
  readonly detail: string;
  readonly relevance: number; // 0–1
  readonly filePath?: string;
  readonly line?: number;
  readonly commitHash?: string;
}

// ─── Causal Chain ────────────────────────────────────────

export type CausalRole = "root-cause" | "propagator" | "symptom";

export interface CausalChainNode {
  readonly id: string;
  readonly symbolName: string;
  readonly filePath: string;
  readonly line: number;
  readonly role: CausalRole;
  readonly description: string;
}

export interface CausalChainEdge {
  readonly from: string;
  readonly to: string;
  readonly label: string;
}

// ─── Intent ──────────────────────────────────────────────

export type IntentCategory =
  | "feature"
  | "bugfix"
  | "refactor"
  | "investigate"
  | "security"
  | "performance"
  | "test"
  | "explore";

export type IntentSessionStatus =
  | "input"
  | "analyzing"
  | "planned"
  | "executing"
  | "completed";

// ─── Lens Kinds ──────────────────────────────────────────

export type LensKind = "call" | "impact" | "dataflow" | "change" | "runtime";

// ─── Architecture ────────────────────────────────────────

export type ViolationKind =
  | "layer-skip"
  | "circular-dependency"
  | "forbidden-import"
  | "coupling-threshold";

export interface ArchViolation {
  readonly id: string;
  readonly kind: ViolationKind;
  readonly sourceFile: string;
  readonly sourceLine: number;
  readonly targetFile: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}
