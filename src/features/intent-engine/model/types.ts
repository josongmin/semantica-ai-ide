/**
 * Intent Engine Types — RFC-SYSTEM-LENS-001 §6
 */

import type { AnalysisRiskLevel, IntentCategory, IntentSessionStatus } from "~shared/protocol/types";

export interface Intent {
  readonly id: string;
  readonly text: string;
  readonly category: IntentCategory;
  readonly detectedAt: number;
}

export interface IntentTarget {
  readonly name: string;
  readonly kind: string;
  readonly filePath: string;
  readonly line: number;
  readonly relevance: number;
}

export interface IntentRisk {
  readonly description: string;
  readonly severity: AnalysisRiskLevel;
  readonly mitigation: string;
}

export interface IntentAnalysis {
  readonly intent: Intent;
  readonly targets: readonly IntentTarget[];
  readonly affectedScope: {
    readonly files: number;
    readonly modules: number;
    readonly tests: number;
    readonly apis: number;
  };
  readonly risks: readonly IntentRisk[];
  readonly archConcerns: readonly string[];
  readonly runtimeContext: readonly {
    readonly metric: string;
    readonly value: string;
    readonly relevance: string;
  }[];
}

export interface IntentPlanStep {
  readonly id: string;
  readonly action: "locate" | "analyze" | "modify" | "test" | "verify";
  readonly description: string;
  readonly targetFile?: string;
  readonly targetLine?: number;
  readonly status: "pending" | "running" | "done" | "skipped";
  readonly substeps?: readonly string[];
}

export interface IntentPlan {
  readonly intentId: string;
  readonly steps: readonly IntentPlanStep[];
  readonly estimatedImpact: {
    readonly newFiles: number;
    readonly modifiedFiles: number;
    readonly deletedFiles: number;
    readonly testsNeeded: number;
  };
}

export interface IntentSession {
  readonly id: string;
  readonly intent: Intent;
  readonly analysis: IntentAnalysis | null;
  readonly plan: IntentPlan | null;
  readonly status: IntentSessionStatus;
  readonly startedAt: number;
  readonly completedAt: number | null;
}
