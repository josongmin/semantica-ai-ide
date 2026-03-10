/**
 * Impact Radar Atoms — RFC-SYSTEM-LENS-001 §3.2
 */

import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import { pushToastAtom } from "~shared/lib/atoms/toastAtoms";

import type { ChangeEvent, ImpactAnalysisResult } from "./types";

export const impactRadarEnabledAtom = atom<boolean>(true);
export const impactRadarVisibleAtom = atom<boolean>(false);
export const impactAnalysisResultAtom = atom<ImpactAnalysisResult | null>(null);
export const impactRadarLoadingAtom = atom<boolean>(false);
export const pendingChangeAtom = atom<ChangeEvent | null>(null);

// ─── Derived ─────────────────────────────────────────────

export const impactSummaryAtom = atom((get) => {
  return get(impactAnalysisResultAtom)?.summary ?? null;
});

export const impactBreakingNodesAtom = atom((get) => {
  const result = get(impactAnalysisResultAtom);
  if (!result) return [];
  return result.nodes.filter((n) => n.severity === "breaking");
});

// ─── Write Atoms ─────────────────────────────────────────

export const analyzeImpactAtom = atom(
  null,
  async (_get, set, change: ChangeEvent) => {
    set(pendingChangeAtom, change);
    set(impactRadarLoadingAtom, true);
    set(impactRadarVisibleAtom, true);

    const { generateMockImpact } = await import("./mockData");
    await new Promise<void>((r) => setTimeout(r, 180));
    const result = generateMockImpact(change);
    set(impactAnalysisResultAtom, result);
    set(impactRadarLoadingAtom, false);
    set(pushToastAtom, {
      id: `impact-radar-${Date.now()}`,
      variant: "success",
      message: `Impact analysis complete — ${result.nodes.length} nodes affected`,
    });
  },
);

export const closeImpactRadarAtom = atom(null, (_get, set) => {
  set(impactRadarVisibleAtom, false);
});

export const clearImpactResultAtom = atom(null, (_get, set) => {
  set(impactAnalysisResultAtom, null);
  set(pendingChangeAtom, null);
  set(impactRadarVisibleAtom, false);
});

// ─── Reset ───────────────────────────────────────────────
const resetImpactRadarAtom = atom(null, (_get, set) => {
  set(impactRadarEnabledAtom, true);
  set(impactRadarVisibleAtom, false);
  set(impactAnalysisResultAtom, null);
  set(impactRadarLoadingAtom, false);
  set(pendingChangeAtom, null);
});
registerResetAtom(resetImpactRadarAtom);
