import type { ImpactSummary, SecuritySummary, CloneSummary, MetricsSummary, TestImpactSummary } from "../models/review.js";

export interface ReviewEvidenceViewModel {
  readonly patchId: string;
  readonly summary: string;
  readonly impact: ImpactSummary;
  readonly security: SecuritySummary;
  readonly clone: CloneSummary;
  readonly metrics: MetricsSummary;
  readonly tests: TestImpactSummary;
  readonly proofVerdict?: ProofVerdictView;
  readonly overallRisk: "low" | "medium" | "high" | "critical";
}

export interface ProofVerdictView {
  readonly outcome: "safe" | "warning" | "unsafe" | "unknown";
  readonly confidence: number;
  readonly recommendation: "auto_approve" | "human_review" | "auto_reject";
  readonly reasons: { category: string; level: string; message: string }[];
}
