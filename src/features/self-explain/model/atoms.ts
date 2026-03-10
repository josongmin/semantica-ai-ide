/**
 * Self-Explaining Code Atoms
 *
 * Jotai state management for the self-explain panel.
 * Loads mock data with a short delay to simulate analysis latency.
 */

import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

import type { SelfExplanation } from "./types";

// ─── Core Atoms ─────────────────────────────────────────────

export const selfExplainVisibleAtom = atom(false);
export const selfExplainDataAtom = atom<SelfExplanation | null>(null);
export const selfExplainLoadingAtom = atom(false);

// ─── Write Atoms ────────────────────────────────────────────

let explainTimer: ReturnType<typeof setTimeout> | null = null;

/** Open the self-explain panel for a given symbol. */
export const openSelfExplainAtom = atom(
  null,
  (_get, set, params: { symbolId: string; filePath: string; line: number }) => {
    if (explainTimer !== null) clearTimeout(explainTimer);

    set(selfExplainVisibleAtom, true);
    set(selfExplainLoadingAtom, true);
    set(selfExplainDataAtom, null);

    explainTimer = setTimeout(async () => {
      const { generateMockExplanation } = await import("./mockData");
      const explanation = generateMockExplanation(params);
      set(selfExplainDataAtom, explanation);
      set(selfExplainLoadingAtom, false);
    }, 150);
  },
);

/** Close the self-explain panel and reset all state. */
export const closeSelfExplainAtom = atom(null, (_get, set) => {
  if (explainTimer !== null) clearTimeout(explainTimer);
  set(selfExplainVisibleAtom, false);
  set(selfExplainDataAtom, null);
  set(selfExplainLoadingAtom, false);
});

// ─── Reset ──────────────────────────────────────────────────

const resetSelfExplainAtomsAtom = atom(null, (_get, set) => {
  if (explainTimer !== null) clearTimeout(explainTimer);
  set(selfExplainVisibleAtom, false);
  set(selfExplainDataAtom, null);
  set(selfExplainLoadingAtom, false);
});

registerResetAtom(resetSelfExplainAtomsAtom);
