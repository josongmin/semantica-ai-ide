/**
 * Impact Radar Types — RFC-SYSTEM-LENS-001 §3
 */

import type {
  ImpactCategory,
  ImpactDirection,
  ImpactSeverity,
} from "~shared/protocol/types";

export interface ImpactNode {
  readonly id: string;
  readonly name: string;
  readonly category: ImpactCategory;
  readonly severity: ImpactSeverity;
  readonly direction: ImpactDirection;
  readonly filePath: string;
  readonly line: number;
  readonly description: string;
  readonly confidence: number;
}

export interface ImpactSummary {
  readonly totalAffected: number;
  readonly breaking: number;
  readonly major: number;
  readonly minor: number;
  readonly testsPredictedFailing: number;
  readonly testsPredictedPassing: number;
  readonly apisAffected: number;
  readonly servicesAffected: number;
}

export interface ImpactAnalysisResult {
  readonly triggerSymbol: string;
  readonly triggerFile: string;
  readonly triggerLine: number;
  readonly timestamp: number;
  readonly nodes: readonly ImpactNode[];
  readonly summary: ImpactSummary;
  readonly graphEdges: readonly { readonly from: string; readonly to: string; readonly kind: string }[];
}

export interface ChangeEvent {
  readonly filePath: string;
  readonly line: number;
  readonly symbolName: string;
  readonly changeType: "edit" | "delete" | "add" | "rename";
}
