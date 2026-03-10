/**
 * Doc-Drift → Agent Bridge Atoms
 *
 * When user clicks "Fix Doc" or "Fix Code" on a drift item,
 * the payload is stored here for the agent panel to pick up.
 */

import { atom } from "jotai";

import type { DriftItem } from "./docDriftAtoms";

// ─── Types ──────────────────────────────────────────────────

export type DriftFixIntent = "fix-doc" | "fix-code";

export interface DriftFixPayload {
  item: DriftItem;
  intent: DriftFixIntent;
  autoMessage: string;
}

// ─── Atoms ──────────────────────────────────────────────────

/** Current drift fix request for agent panel (null = none pending) */
export const driftAgentPayloadAtom = atom<DriftFixPayload | null>(null);

/** Dismiss the current drift fix attachment */
export const dismissDriftAgentPayloadAtom = atom(null, (_get, set) => {
  set(driftAgentPayloadAtom, null);
});

// ─── Helpers ────────────────────────────────────────────────

export function buildDriftFixMessage(item: DriftItem, intent: DriftFixIntent): string {
  const docFile = item.docPath.split("/").pop() ?? item.docPath;
  const codeFile = item.codePath.split("/").pop() ?? item.codePath;

  if (intent === "fix-doc") {
    return `${docFile}:${item.docLine} 문서가 코드와 불일치합니다. 문서에 "${item.docAssertion}"로 적혀 있지만, 실제 코드(${codeFile}:${item.codeLine})는 "${item.codeValue}"입니다. 문서를 코드에 맞게 수정해주세요.`;
  }
  return `${codeFile}:${item.codeLine}의 코드가 문서와 불일치합니다. 문서(${docFile}:${item.docLine})에는 "${item.docAssertion}"로 명시되어 있지만, 실제 값은 "${item.codeValue}"입니다. 코드를 문서에 맞게 수정해주세요.`;
}
