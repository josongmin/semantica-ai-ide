import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { BugbotStatus } from "../../../shared/protocol";

const DEFAULT_BUGBOT_STATUS: BugbotStatus = {
  phase: "idle",
  issues: [],
};

export const [bugbotStatusAtom, setBugbotStatusAtom, resetBugbotStatusAtom] =
  createStateAtomSet<BugbotStatus>(DEFAULT_BUGBOT_STATUS);

registerResetAtom(resetBugbotStatusAtom);
