import { atom } from "jotai";

export type ShadowWorkspaceState = "idle" | "validating" | "error" | "ready";

export const shadowWorkspaceStateAtom = atom<ShadowWorkspaceState>("idle");
export const shadowWorkspaceErrorCountAtom = atom(0);
