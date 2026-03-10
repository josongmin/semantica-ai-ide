/**
 * Self-Explaining Code Types — RFC-SYSTEM-LENS-001 §5
 */

import type { AnalysisSymbolKind, CommitRef } from "~shared/protocol/types";

export interface SelfExplanation {
  readonly symbolId: string;
  readonly symbolName: string;
  readonly symbolKind: AnalysisSymbolKind;
  readonly filePath: string;
  readonly line: number;

  readonly purpose: string;

  readonly usage: {
    readonly callerCount: number;
    readonly topCallers: readonly { readonly name: string; readonly filePath: string; readonly line: number }[];
    readonly exposedVia: readonly string[];
  };

  readonly impact: {
    readonly modules: number;
    readonly tests: number;
    readonly apis: number;
    readonly services: number;
    readonly riskLevel: string;
  };

  readonly history: {
    readonly createdCommit: string;
    readonly createdBy: string;
    readonly createdDaysAgo: number;
    readonly totalChanges: number;
    readonly significantChanges: readonly CommitRef[];
  };

  readonly runtime: {
    readonly callsPerHour: number | null;
    readonly avgLatencyMs: number | null;
    readonly errorRate: number | null;
    readonly lastIncident: string | null;
    readonly criticalPath: boolean;
  };

  readonly whyChain: readonly string[];
}
