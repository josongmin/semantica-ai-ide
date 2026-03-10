/**
 * Session entity — root barrel (backward-compatible).
 *
 * For narrower imports that reduce fan-in, prefer the sub-barrels:
 *   - "./state"    — core session state, checkpoints, lifecycle, context pressure
 *   - "./settings" — approval mode and other config/preference atoms
 */

// ── Core state & lifecycle ───────────────────────────────────────────
export {
  addCheckpointAtom,
  checkpointsAtom,
  resetSessionStoreAtom,
  sessionMetaAtom,
  updateSessionMetaAtom,
} from "./model/atoms";

// ── Settings / config ────────────────────────────────────────────────
export { approvalModeAtom } from "./model/atoms";

// ── Derived: context pressure ────────────────────────────────────────
export {
  CONTEXT_THRESHOLDS,
  contextPressureLevelAtom,
  contextUsagePctAtom,
} from "./model/contextPressureAtoms";

// ── Types ────────────────────────────────────────────────────────────
export type {
  ApprovalMode,
  Checkpoint,
  SessionId,
  SessionMeta,
  SessionStatus,
} from "./model/types";
