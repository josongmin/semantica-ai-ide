/**
 * Root Cause Types — RFC-SYSTEM-LENS-001 §4
 */

import type {
  CausalChainEdge,
  CausalChainNode,
  CauseConfidence,
  EvidenceItem,
} from "~shared/protocol/types";

export interface CauseCandidate {
  readonly id: string;
  readonly rank: number;
  readonly symbolName: string;
  readonly filePath: string;
  readonly line: number;
  readonly confidence: CauseConfidence;
  readonly description: string;
  readonly evidenceIds: readonly string[];
}

export interface RootCauseAnalysis {
  readonly id: string;
  readonly symptom: string;
  readonly symptomFile: string;
  readonly symptomLine: number;
  readonly analyzedAt: number;
  readonly candidates: readonly CauseCandidate[];
  readonly evidence: readonly EvidenceItem[];
  readonly causalChain: {
    readonly nodes: readonly CausalChainNode[];
    readonly edges: readonly CausalChainEdge[];
  };
  readonly status: "analyzing" | "complete" | "partial";
}
