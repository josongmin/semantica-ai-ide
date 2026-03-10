import { atom } from "jotai";

import { turnOrderAtom } from "~entities/message/turns";
import { sessionMetaAtom } from "~entities/session/state";

/** Derived: estimated remaining turns (rough heuristic based on average tokens per turn) */
export const estimatedRemainingTurnsAtom = atom<number | null>((get) => {
  const meta = get(sessionMetaAtom);
  const turnOrder = get(turnOrderAtom);

  if (meta.max_context_tokens === undefined || meta.max_context_tokens === 0) return null;

  const used = (meta.tokens_in ?? 0) + (meta.tokens_out ?? 0);
  const turnCount = turnOrder.length;

  if (turnCount === 0 || used === 0) return null;

  const avgPerTurn = used / turnCount;
  const remaining = meta.max_context_tokens - used;

  if (remaining <= 0) return 0;
  return Math.floor(remaining / avgPerTurn);
});
