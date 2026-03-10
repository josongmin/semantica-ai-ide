import { atom } from "jotai";

export const replayPositionAtom = atom(0);
export const replayPlayingAtom = atom(false);
export const replaySpeedAtom = atom<1 | 2 | 4 | 8>(1);
export const replayFilterDomainAtom = atom<string | null>(null);
