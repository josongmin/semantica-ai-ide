/**
 * Global reset-atom registry.
 *
 * Each entity / feature calls `registerResetAtom(myResetAtom)` at module scope.
 * On RESET_STORES the dispatcher iterates the registry instead of maintaining
 * a gigantic hand-maintained array.
 *
 * Usage (in any entity or feature):
 *   import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
 *   export const resetFooAtom = atom(null, (_g, s) => { ... });
 *   registerResetAtom(resetFooAtom);
 */
import type { WritableAtom } from "jotai";

// WritableAtom<null, [], void> is the canonical reset-atom shape (write-only, no args).
type ResetAtom = WritableAtom<null, [], void>;

const registry: ResetAtom[] = [];

/** Register a write-only atom to be invoked on global store reset. */
export function registerResetAtom(atom: ResetAtom): void {
  registry.push(atom);
}

/** Get all registered reset atoms. */
export function getResetAtoms(): readonly ResetAtom[] {
  return registry;
}
