// Review domain models (RFC-004 canonical)

export interface ReviewBundle {
  readonly id: string;
  readonly patchId: string;
  readonly timestamp: number;
  readonly impact: ImpactSummary;
  readonly security: SecuritySummary;
  readonly clone: CloneSummary;
  readonly metrics: MetricsSummary;
  readonly tests: TestImpactSummary;
}

export interface ImpactSummary {
  readonly affectedFiles: number;
  readonly affectedFunctions: number;
  readonly affectedModules: string[];
  readonly callChainDepth: number;
}

export interface SecuritySummary {
  readonly newVulnerabilities: number;
  readonly fixedVulnerabilities: number;
  readonly taintPathCount: number;
  readonly verdict: "clean" | "warning" | "critical";
}

export interface CloneSummary {
  readonly newClones: number;
  readonly removedClones: number;
  readonly totalClones: number;
}

export interface MetricsSummary {
  readonly complexityDelta: number;
  readonly linesDelta: number;
  readonly functionsDelta: number;
}

export interface TestImpactSummary {
  readonly affectedTests: number;
  readonly passingTests: number;
  readonly failingTests: number;
  readonly coverageDelta: number;
}
