import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

export type HookEvent = "pre-tool-use" | "post-tool-use" | "notification" | "stop";

export interface HookConfig {
  id: string;
  event: HookEvent;
  matcher?: string;
  command: string;
  enabled: boolean;
}

export interface HookExecution {
  id: string;
  hookId: string;
  timestamp: string;
  event: HookEvent;
  exitCode: number;
  durationMs: number;
}

export const hookConfigsAtom = atom<HookConfig[]>([]);
export const hookExecutionLogAtom = atom<HookExecution[]>([]);

/** Reset all hook-config state */
export const resetHookConfigStoreAtom = atom(null, (_get, set) => {
  set(hookConfigsAtom, []);
  set(hookExecutionLogAtom, []);
});
registerResetAtom(resetHookConfigStoreAtom);
