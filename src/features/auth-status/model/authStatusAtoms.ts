import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { AuthStatus } from "../../../shared/protocol";

const DEFAULT_AUTH_STATUS: AuthStatus = {
  state: "unauthenticated",
};

export const [authStatusAtom, setAuthStatusAtom, resetAuthStatusAtom] =
  createStateAtomSet<AuthStatus>(DEFAULT_AUTH_STATUS);

registerResetAtom(resetAuthStatusAtom);
