import { atom } from "jotai";

export type AgentViewMode = "board" | "dag" | "detail";
export const agentViewModeAtom = atom<AgentViewMode>("board");
export const selectedAgentIdAtom = atom<string | null>(null);
