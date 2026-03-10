/**
 * System Lens Types — RFC-SYSTEM-LENS-001 §2.1
 *
 * Feature-local types for Live System Lens.
 * Shared types imported from protocol.
 */

import type {
  AnalysisRiskLevel,
  AnalysisSymbolKind,
  CommitRef,
  DataflowEdge,
  SymbolRef,
  TestRef,
} from "~shared/protocol/types";

// ─── Badge Data (gutter) ─────────────────────────────────

export interface LensBadgeData {
  readonly symbolId: string;
  readonly symbolName: string;
  readonly symbolKind: AnalysisSymbolKind;
  readonly filePath: string;
  readonly line: number;
  readonly endLine: number;
  readonly callerCount: number;
  readonly calleeCount: number;
  readonly impactedModules: number;
  readonly impactedTests: number;
  readonly impactedApis: number;
  readonly callFrequency: number | null;
  readonly avgLatency: number | null;
  readonly lastModifiedCommit: string | null;
  readonly lastModifiedDaysAgo: number | null;
  readonly changeFrequency: number;
  readonly riskLevel: AnalysisRiskLevel;
}

// ─── Detail Data (hover) ─────────────────────────────────

export interface ImpactItem {
  readonly id: string;
  readonly name: string;
  readonly kind: "module" | "test" | "api" | "service";
  readonly severity: "direct" | "transitive";
  readonly filePath: string;
  readonly line: number;
}

export interface LensDetailData extends LensBadgeData {
  readonly callers: readonly SymbolRef[];
  readonly callees: readonly SymbolRef[];
  readonly impactedItems: readonly ImpactItem[];
  readonly dataflowIn: readonly DataflowEdge[];
  readonly dataflowOut: readonly DataflowEdge[];
  readonly recentCommits: readonly CommitRef[];
  readonly relatedTests: readonly TestRef[];
}
