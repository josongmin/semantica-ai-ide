import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ReplaySession } from "../../../shared/protocol";

export const [replaySessionAtom, setReplaySessionAtom, resetReplaySessionAtom] =
  createStateAtomSet<ReplaySession | null>(null);

registerResetAtom(resetReplaySessionAtom);
