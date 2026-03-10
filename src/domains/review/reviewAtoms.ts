import { atom } from "jotai";

export type ReviewTab =
  | "impact"
  | "security"
  | "clone"
  | "metrics"
  | "tests"
  | "proof";

export const activeReviewTabAtom = atom<ReviewTab>("impact");
export const selectedPatchIdAtom = atom<string | null>(null);
