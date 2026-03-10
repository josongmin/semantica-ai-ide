import { atom } from "jotai";

import type { MemoryRuleId } from "../../../shared/protocol";

/** Which rule is currently being edited, or "new" when creating a new rule. */
export const editingRuleIdAtom = atom<MemoryRuleId | "new" | null>(null);
