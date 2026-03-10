import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

import { generateMockLensData } from "./mockCodeLensData";

// ─── Types ─────────────────────────────────────────────────

export interface CodeLensTarget {
  readonly filePath: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly code: string;
  readonly language?: string;
}

export interface CodeLensData {
  readonly summary: string;
  readonly flow: readonly { name: string; filePath: string; line: number }[];
  readonly sideEffects: readonly string[];
  readonly throws: readonly string[];
  readonly complexity: "low" | "medium" | "high";
}

// ─── State atoms ───────────────────────────────────────────

export const codeLensVisibleAtom = atom<boolean>(false);
export const codeLensTargetAtom = atom<CodeLensTarget | null>(null);
export const codeLensDataAtom = atom<CodeLensData | null>(null);
export const codeLensLoadingAtom = atom<boolean>(false);

// ─── Write atoms ───────────────────────────────────────────

/** Open the code lens overlay for a given target. Sets loading, generates mock data. */
export const openCodeLensAtom = atom(null, (_get, set, target: CodeLensTarget) => {
  set(codeLensTargetAtom, target);
  set(codeLensVisibleAtom, true);
  set(codeLensLoadingAtom, true);
  set(codeLensDataAtom, null);

  // Simulate async data fetch with a short delay
  setTimeout(() => {
    const data = generateMockLensData(target);
    set(codeLensDataAtom, data);
    set(codeLensLoadingAtom, false);
  }, 300);
});

/** Close the code lens overlay and clear all state. */
export const closeCodeLensAtom = atom(null, (_get, set) => {
  set(codeLensVisibleAtom, false);
  set(codeLensTargetAtom, null);
  set(codeLensDataAtom, null);
  set(codeLensLoadingAtom, false);
});

/** Toggle the code lens overlay. If visible, close; otherwise requires a target. */
export const toggleCodeLensAtom = atom(null, (get, set, target?: CodeLensTarget) => {
  const visible = get(codeLensVisibleAtom);
  if (visible) {
    set(closeCodeLensAtom);
  } else if (target) {
    set(openCodeLensAtom, target);
  }
});

// ─── Reset ─────────────────────────────────────────────────

const resetCodeLensAtom = atom(null, (_get, set) => {
  set(codeLensVisibleAtom, false);
  set(codeLensTargetAtom, null);
  set(codeLensDataAtom, null);
  set(codeLensLoadingAtom, false);
});

registerResetAtom(resetCodeLensAtom);
