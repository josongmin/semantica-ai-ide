import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { Step } from "../../../shared/ui";

export interface IssuePipeline {
  issueUrl: string;
  issueTitle: string;
  status: "running" | "completed" | "failed";
  steps: Step[];
}

export const issuePipelineAtom = atom<IssuePipeline | null>(null);

/** Reset all issue-pipeline state */
export const resetIssuePipelineStoreAtom = atom(null, (_get, set) => {
  set(issuePipelineAtom, null);
});
registerResetAtom(resetIssuePipelineStoreAtom);
