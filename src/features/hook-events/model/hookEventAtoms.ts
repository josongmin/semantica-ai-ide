import { createPushAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { HookEvent } from "../../../shared/protocol";

export const [hookEventsAtom, pushHookEventAtom, resetHookEventsAtom] =
  createPushAtomSet<HookEvent>();

registerResetAtom(resetHookEventsAtom);
