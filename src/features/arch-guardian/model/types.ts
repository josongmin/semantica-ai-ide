/**
 * Architecture Guardian Types — RFC-SYSTEM-LENS-001 §5
 */

import type { ViolationKind } from "~shared/protocol/types";

export interface ArchRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly kind: ViolationKind;
  readonly enabled: boolean;
}

export interface ArchViolationItem {
  readonly id: string;
  readonly ruleId: string;
  readonly ruleName: string;
  readonly kind: ViolationKind;
  readonly filePath: string;
  readonly line: number;
  readonly column: number;
  readonly sourceModule: string;
  readonly targetModule: string;
  readonly message: string;
  readonly severity: "error" | "warning" | "info";
  readonly autoFixable: boolean;
  readonly suggestedFix?: string;
}

export interface ArchLayer {
  readonly id: string;
  readonly name: string;
  readonly modules: readonly string[];
  readonly allowedDependencies: readonly string[];
  readonly color: string;
}

export interface ArchAnalysis {
  readonly violations: readonly ArchViolationItem[];
  readonly layers: readonly ArchLayer[];
  readonly totalModules: number;
  readonly healthScore: number; // 0-100
  readonly lastScanned: number;
}
