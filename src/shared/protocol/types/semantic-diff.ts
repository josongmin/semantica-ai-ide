/**
 * Semantic Diff Protocol Types
 *
 * Grouped change analysis with narrative and risk assessment.
 */

import type { TurnId } from "./core";
import type { DiffHunk } from "./tool";

// ─── Semantic Diff ──────────────────────────────────────
export interface SemanticChangeGroup {
  readonly id: string;
  readonly title: string;
  readonly narrative: string;
  readonly impact: "low" | "medium" | "high" | "critical";
  readonly category: "feature" | "bugfix" | "refactor" | "style" | "perf" | "docs" | "test";
  readonly files: readonly {
    readonly filePath: string;
    readonly hunks: readonly DiffHunk[];
  }[];
  readonly relatedGroupIds: readonly string[];
}

export interface SemanticDiffResult {
  readonly turnId: TurnId;
  readonly groups: readonly SemanticChangeGroup[];
  readonly overallNarrative: string;
  readonly riskAssessment?: {
    readonly level: "safe" | "review" | "risky";
    readonly reasons: readonly string[];
  };
}
