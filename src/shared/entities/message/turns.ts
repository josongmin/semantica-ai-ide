/**
 * Turn-specific atoms — for turn management & timeline consumers.
 *
 * Import from here when you only need turn-level state,
 * e.g. `import { turnAtomFamily, turnOrderSortedAtom } from "@/entities/message/turns";`
 */
export {
  sessionMetricsFromTurnsAtom,
  turnAtomFamily,
  turnIndexAtomFamily,
  turnOrderAtom,
  turnOrderSortedAtom,
  updateTurnPhaseAtom,
} from "./model/turnAtoms";
export type { Turn, TurnId, TurnPhase, TurnPhaseEntry, TurnStatus } from "./model/types";
