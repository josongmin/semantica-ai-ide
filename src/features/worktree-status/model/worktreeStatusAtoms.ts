import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { WorktreeStatus } from "../../../shared/protocol";

export const [worktreeStatusAtom, setWorktreeStatusAtom, resetWorktreeStatusAtom] =
  createStateAtomSet<WorktreeStatus | null>(null);

registerResetAtom(resetWorktreeStatusAtom);
