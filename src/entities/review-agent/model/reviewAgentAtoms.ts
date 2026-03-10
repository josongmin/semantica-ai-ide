import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

export interface ReviewAgent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "done" | "error";
  findings: number;
  summary?: string;
}

export const reviewAgentsAtom = atom<ReviewAgent[]>([]);

/** Reset all review-agent state */
export const resetReviewAgentStoreAtom = atom(null, (_get, set) => {
  set(reviewAgentsAtom, []);
});
registerResetAtom(resetReviewAgentStoreAtom);
