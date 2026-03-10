import { atom } from "jotai";

export interface WatchTrigger {
  timestamp: string;
  pattern: string;
  filePath: string;
}

export const watchPatternsAtom = atom<string[]>([]);
export const watchTriggersAtom = atom<WatchTrigger[]>([]);
export const watchActiveAtom = atom(false);
