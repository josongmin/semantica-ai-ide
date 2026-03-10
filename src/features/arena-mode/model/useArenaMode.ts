import { useCallback } from "react";
import { useAtomValue } from "jotai";

import {
  arenaIsStreamingAtom,
  arenaModelAAtom,
  arenaModelBAtom,
  arenaWinnerAtom,
  slotAResponseAtom,
  slotBResponseAtom,
} from "~entities/arena";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { ArenaResponse, ArenaWinner } from "../../../shared/protocol";

/**
 * Provides read-only arena state and actions to configure models,
 * send prompts and record the winner via the extension host.
 */
export function useArenaMode(): {
  slotA: ArenaResponse | null;
  slotB: ArenaResponse | null;
  winner: ArenaWinner | null;
  modelA: string;
  modelB: string;
  isStreaming: boolean;
  setModels: (a: string, b: string) => void;
  sendPrompt: (text: string) => void;
  selectWinner: (w: ArenaWinner) => void;
} {
  const slotA = useAtomValue(slotAResponseAtom);
  const slotB = useAtomValue(slotBResponseAtom);
  const winner = useAtomValue(arenaWinnerAtom);
  const modelA = useAtomValue(arenaModelAAtom);
  const modelB = useAtomValue(arenaModelBAtom);
  const isStreaming = useAtomValue(arenaIsStreamingAtom);

  const setModels = useCallback((a: string, b: string) => {
    getVscodeApi().postMessage({ type: "ARENA_SET_MODELS", model_a: a, model_b: b });
  }, []);

  const sendPrompt = useCallback((text: string) => {
    getVscodeApi().postMessage({ type: "ARENA_SEND_PROMPT", text });
  }, []);

  const selectWinner = useCallback((w: ArenaWinner) => {
    getVscodeApi().postMessage({ type: "ARENA_SELECT_WINNER", winner: w });
  }, []);

  return { slotA, slotB, winner, modelA, modelB, isStreaming, setModels, sendPrompt, selectWinner };
}
