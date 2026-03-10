/**
 * Dataflow Lens Atoms — RFC-SYSTEM-LENS-001 §4
 */

import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

import type { DataflowAnalysis } from "./types";

// ─── State ──────────────────────────────────────────────

export const dataflowVisibleAtom = atom<boolean>(false);
export const dataflowAnalysisAtom = atom<DataflowAnalysis | null>(null);
export const dataflowLoadingAtom = atom<boolean>(false);
export const highlightedPathIdAtom = atom<string | null>(null);

// ─── Write Atoms ────────────────────────────────────────

export const openDataflowAtom = atom(
  null,
  async (
    _get,
    set,
    params: { symbolId: string; filePath: string; line: number },
  ) => {
    set(dataflowVisibleAtom, true);
    set(dataflowLoadingAtom, true);
    set(highlightedPathIdAtom, null);

    const { generateMockDataflow } = await import("./mockData");
    await new Promise<void>((r) => setTimeout(r, 60));

    const symbolName = params.symbolId.split(":")[1] ?? params.symbolId;
    const analysis = generateMockDataflow(
      params.symbolId,
      symbolName,
      params.filePath,
      params.line,
    );

    set(dataflowAnalysisAtom, analysis);
    set(dataflowLoadingAtom, false);
  },
);

export const closeDataflowAtom = atom(null, (_get, set) => {
  set(dataflowVisibleAtom, false);
  set(dataflowAnalysisAtom, null);
  set(dataflowLoadingAtom, false);
  set(highlightedPathIdAtom, null);
});

export const highlightPathAtom = atom(
  null,
  (_get, set, pathId: string) => {
    set(highlightedPathIdAtom, pathId);
  },
);

export const clearHighlightAtom = atom(null, (_get, set) => {
  set(highlightedPathIdAtom, null);
});

// ─── Reset ──────────────────────────────────────────────

const resetDataflowLensAtom = atom(null, (_get, set) => {
  set(dataflowVisibleAtom, false);
  set(dataflowAnalysisAtom, null);
  set(dataflowLoadingAtom, false);
  set(highlightedPathIdAtom, null);
});
registerResetAtom(resetDataflowLensAtom);
