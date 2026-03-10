// Verdict & proof domain models (RFC-011 canonical)

export type SecurityVerdict = "clean" | "warning" | "critical";
export type VerdictOutcome = "safe" | "warning" | "unsafe" | "unknown";
export type VerdictCategory = "impact" | "security" | "clone" | "metrics" | "tests";
export type VerdictLevel = "pass" | "warning" | "fail";
export type PolicyRecommendation = "auto_approve" | "human_review" | "auto_reject";

export interface ProofBundle {
  readonly id: string;
  readonly patchId: string;
  readonly timestamp: number;
  readonly impact: ImpactProof;
  readonly security: SecurityProof;
  readonly clone: CloneProof;
  readonly metrics: MetricsProof;
  readonly tests: TestProof;
}

export interface ImpactProof {
  readonly affectedFiles: number;
  readonly affectedFunctions: number;
  readonly affectedModules: string[];
  readonly callChainDepth: number;
}

export interface SecurityProof {
  readonly newVulnerabilities: number;
  readonly fixedVulnerabilities: number;
  readonly taintPaths: TaintPath[];
  readonly verdict: SecurityVerdict;
}

export interface TaintPath {
  readonly source: string;
  readonly sink: string;
  readonly path: string[];
  readonly severity: "low" | "medium" | "high" | "critical";
}

export interface CloneProof {
  readonly newClones: number;
  readonly removedClones: number;
  readonly cloneFragments: CloneFragment[];
}

export interface CloneFragment {
  readonly fileA: string;
  readonly fileB: string;
  readonly lineRangeA: [number, number];
  readonly lineRangeB: [number, number];
  readonly similarity: number;
}

export interface MetricsProof {
  readonly complexityDelta: number;
  readonly linesDelta: number;
  readonly maintainabilityDelta: number;
}

export interface TestProof {
  readonly affectedTests: number;
  readonly passingTests: number;
  readonly failingTests: number;
  readonly coverageDelta: number;
  readonly newUncoveredLines: number;
}

export interface PatchVerdict {
  readonly id: string;
  readonly proofBundleId: string;
  readonly patchId: string;
  readonly outcome: VerdictOutcome;
  readonly confidence: number;
  readonly reasons: VerdictReason[];
  readonly recommendation: PolicyRecommendation;
}

export interface VerdictReason {
  readonly category: VerdictCategory;
  readonly level: VerdictLevel;
  readonly message: string;
}
