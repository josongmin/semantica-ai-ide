import { atom } from "jotai";

import type { AgentRequestMode } from "../../../shared/protocol";

export const agentRequestModeAtom = atom<AgentRequestMode>("ask");

/** Custom user-defined modes */
export interface CustomMode {
  id: string;
  label: string;
  color: string;
  systemPrompt?: string;
}

export const customModesAtom = atom<CustomMode[]>([]);
export const activeCustomModeAtom = atom<string | null>(null);
