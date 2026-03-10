import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

import { simulateImpactAnalysis } from "./mockImpactData";

// ─── Types ──────────────────────────────────────────────

export type ImpactPhase = "static-analysis" | "call-graph" | "data-flow" | "security" | "performance";

export type ImpactPhaseStatus = "pending" | "running" | "done";

export type ImpactSeverity = "safe" | "low" | "moderate" | "high";

export interface ImpactScoreCard {
  label: string;
  value: number;
  severity: ImpactSeverity;
  detail: string;
}

export interface AffectedPath {
  symbolName: string;
  filePath: string;
  line: number;
  relationship: "direct" | "transitive";
  description?: string;
}

export interface ImpactResult {
  targetSymbol: string;
  targetFile: string;
  scoreCards: ImpactScoreCard[];
  affectedPaths: AffectedPath[];
  testCoverage: { covered: number; total: number; percentage: number };
  overallRisk: ImpactSeverity;
  confidence: number;
}

// ─── Phase Order ────────────────────────────────────────

export const IMPACT_PHASES: readonly ImpactPhase[] = [
  "static-analysis",
  "call-graph",
  "data-flow",
  "security",
  "performance",
] as const;

export const PHASE_LABELS: Record<ImpactPhase, string> = {
  "static-analysis": "Static analysis",
  "call-graph": "Call graph",
  "data-flow": "Data flow",
  security: "Security scan",
  performance: "Performance",
};

// ─── Atoms ──────────────────────────────────────────────

const defaultPhases: Record<ImpactPhase, ImpactPhaseStatus> = {
  "static-analysis": "pending",
  "call-graph": "pending",
  "data-flow": "pending",
  security: "pending",
  performance: "pending",
};

export const impactPreviewVisibleAtom = atom<boolean>(false);

/** Holds an error message when analysis fails */
export const impactErrorAtom = atom<string | null>(null);

export const impactPhasesAtom = atom<Record<ImpactPhase, ImpactPhaseStatus>>({ ...defaultPhases });

export const impactResultAtom = atom<ImpactResult | null>(null);

/** True if any phase is currently running */
export const impactLoadingAtom = atom<boolean>((get) => {
  const phases = get(impactPhasesAtom);
  return Object.values(phases).some((s) => s === "running");
});

/** Progress percentage: (done phases / total) * 100 */
export const impactProgressAtom = atom<number>((get) => {
  const phases = get(impactPhasesAtom);
  const total = IMPACT_PHASES.length;
  const done = Object.values(phases).filter((s) => s === "done").length;
  return Math.round((done / total) * 100);
});

/** Count of completed phases */
export const impactPhasesDoneAtom = atom<number>((get) => {
  const phases = get(impactPhasesAtom);
  return Object.values(phases).filter((s) => s === "done").length;
});

/** Write atom — kicks off simulated phased analysis */
export const runImpactAnalysisAtom = atom(null, (_get, set) => {
  // Reset before starting
  set(impactPhasesAtom, { ...defaultPhases });
  set(impactResultAtom, null);
  set(impactErrorAtom, null);
  set(impactPreviewVisibleAtom, true);

  simulateImpactAnalysis({
    setPhases: (phases) => set(impactPhasesAtom, phases),
    setResult: (result) => set(impactResultAtom, result),
  });
});

/** Write atom — resets all impact preview state */
export const clearImpactAtom = atom(null, (_get, set) => {
  set(impactPreviewVisibleAtom, false);
  set(impactPhasesAtom, { ...defaultPhases });
  set(impactResultAtom, null);
  set(impactErrorAtom, null);
});

/** Reset all impact preview state */
export const resetImpactPreviewStoreAtom = atom(null, (_get, set) => {
  set(impactPreviewVisibleAtom, false);
  set(impactPhasesAtom, { ...defaultPhases });
  set(impactResultAtom, null);
  set(impactErrorAtom, null);
});
registerResetAtom(resetImpactPreviewStoreAtom);
