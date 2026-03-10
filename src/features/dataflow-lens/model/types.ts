/**
 * Dataflow Lens Types — RFC-SYSTEM-LENS-001 §4
 */

import type { TaintLabel } from "~shared/protocol/types";

export interface DataflowNode {
  readonly id: string;
  readonly symbolName: string;
  readonly filePath: string;
  readonly line: number;
  readonly role: "source" | "transform" | "sink";
  readonly taintLabel?: TaintLabel;
  readonly description: string;
}

export interface DataflowPath {
  readonly id: string;
  readonly label: string;
  readonly nodes: readonly DataflowNode[];
  readonly isTainted: boolean;
  readonly hasSanitizer: boolean;
  readonly riskLevel: "safe" | "caution" | "danger";
}

export interface DataflowAnalysis {
  readonly symbolId: string;
  readonly symbolName: string;
  readonly filePath: string;
  readonly line: number;
  readonly inbound: readonly DataflowPath[];
  readonly outbound: readonly DataflowPath[];
  readonly securityNotes: readonly string[];
}
