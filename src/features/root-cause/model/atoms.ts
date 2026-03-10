/**
 * Root Cause Atoms — RFC-SYSTEM-LENS-001 §4.2
 */

import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import { pushToastAtom } from "~shared/lib/atoms/toastAtoms";

import type { RootCauseAnalysis } from "./types";

export const rootCauseVisibleAtom = atom<boolean>(false);
export const rootCauseAnalysisAtom = atom<RootCauseAnalysis | null>(null);
export const rootCauseLoadingAtom = atom<boolean>(false);

// ─── Derived ─────────────────────────────────────────────

export const topCauseAtom = atom((get) => {
  const analysis = get(rootCauseAnalysisAtom);
  if (!analysis || analysis.candidates.length === 0) return null;
  return analysis.candidates[0];
});

export const causalChainAtom = atom((get) => {
  return get(rootCauseAnalysisAtom)?.causalChain ?? null;
});

// ─── Write Atoms ─────────────────────────────────────────

export const startRootCauseAtom = atom(
  null,
  async (
    _get,
    set,
    params: { symptom: string; filePath: string; line: number },
  ) => {
    set(rootCauseVisibleAtom, true);
    set(rootCauseLoadingAtom, true);

    const { generateMockRootCause } = await import("./mockData");

    // Step 1: show analyzing state
    const partial = generateMockRootCause(params, "analyzing");
    set(rootCauseAnalysisAtom, partial);

    // Step 2: full results after delay (simulating 2s target)
    await new Promise<void>((r) => setTimeout(r, 1500));
    const full = generateMockRootCause(params, "complete");
    set(rootCauseAnalysisAtom, full);
    set(rootCauseLoadingAtom, false);
    set(pushToastAtom, {
      id: `root-cause-${Date.now()}`,
      variant: "success",
      message: `Root cause analysis complete — ${full.candidates.length} candidates found`,
    });
  },
);

export const closeRootCauseAtom = atom(null, (_get, set) => {
  set(rootCauseVisibleAtom, false);
});

export const clearRootCauseAtom = atom(null, (_get, set) => {
  set(rootCauseVisibleAtom, false);
  set(rootCauseAnalysisAtom, null);
  set(rootCauseLoadingAtom, false);
});

// ─── Reset ───────────────────────────────────────────────
const resetRootCauseAtom = atom(null, (_get, set) => {
  set(rootCauseVisibleAtom, false);
  set(rootCauseAnalysisAtom, null);
  set(rootCauseLoadingAtom, false);
});
registerResetAtom(resetRootCauseAtom);
