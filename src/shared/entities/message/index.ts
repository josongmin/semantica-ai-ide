/**
 * Full barrel export — backward-compatible, re-exports everything.
 *
 * Prefer narrower sub-barrels for new code to reduce coupling:
 *   - "./core"    — message read atoms (messageAtomFamily, messageOrderAtom, appendTextAtom)
 *   - "./turns"   — turn read atoms   (turnAtomFamily, turnOrderAtom, turnOrderSortedAtom)
 *   - "./writers" — write/mutate atoms (upsertMessageAtom, upsertTurnAtom, resetMessageStoreAtom)
 */

// ─── Types (re-exported from shared/protocol) ──────────────
export type {
  MessageId,
  MessageStatus,
  ServerEvent,
  ServerEventBatch,
  Turn,
  TurnId,
  TurnPhase,
  TurnPhaseEntry,
  TurnStatus,
  UiMessage,
} from "./model/types";

// ─── Core message atoms (read / streaming) ──────────────────
export {
  appendTextAtom,
  effectiveAgentRoleForMessageAtomFamily,
  messageAtomFamily,
  messageOrderAtom,
} from "./model/atoms";

// ─── Turn atoms (read / timeline) ───────────────────────────
export {
  sessionMetricsFromTurnsAtom,
  turnAtomFamily,
  turnIndexAtomFamily,
  turnOrderAtom,
  turnOrderSortedAtom,
  updateTurnPhaseAtom,
} from "./model/atoms";

// ─── Write atoms (dispatchers / event handlers) ─────────────
export {
  classifyErrorAtom,
  setDiffLoadedAtom,
  setMessageStatusAtom,
  upsertMessageAtom,
  upsertTurnAtom,
} from "./model/atoms";

// ─── Reset atoms (session lifecycle) ────────────────────────
export { resetMessageStoreAtom } from "./model/atoms";
