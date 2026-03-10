import { atom } from "jotai";

export type OrchestratorPane = "taskDag" | "agentFleet" | "convergence" | "approval";
export const activePaneAtom = atom<OrchestratorPane>("taskDag");
export const selectedTaskIdAtom = atom<string | null>(null);
export const selectedCandidateIdAtom = atom<string | null>(null);
