/**
 * Barrel re-export — preserves backward compatibility for all existing imports.
 *
 * Prefer importing from the narrower sub-modules for new code:
 *   - "./coreAtoms"   — message family, order, append, role inference
 *   - "./turnAtoms"   — turn family, ordering, metrics, phase updates
 *   - "./writerAtoms" — upsert, status, diff, error, reset
 */

// ─── Core message atoms ────────────────────────────────────
export {
  appendTextAtom,
  effectiveAgentRoleForMessageAtomFamily,
  messageAtomFamily,
  messageOrderAtom,
} from "./coreAtoms";

// ─── Turn atoms ────────────────────────────────────────────
export {
  activeTurnIdAtom,
  sessionMetricsFromTurnsAtom,
  turnAtomFamily,
  turnIndexAtomFamily,
  turnOrderAtom,
  turnOrderSortedAtom,
  updateTurnPhaseAtom,
  upsertTurnAtom,
} from "./turnAtoms";

// ─── Writer atoms ──────────────────────────────────────────
export {
  classifyErrorAtom,
  resetMessageStoreAtom,
  setDiffLoadedAtom,
  setMessageStatusAtom,
  upsertMessageAtom,
} from "./writerAtoms";
