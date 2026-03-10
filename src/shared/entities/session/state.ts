/**
 * Session / state — core session state atoms, checkpoints, and lifecycle.
 *
 * Prefer this narrower import when you only need session metadata or
 * checkpoint data:
 *
 *   import { sessionMetaAtom, checkpointsAtom } from "@entities/session/state";
 *
 * The root barrel (`@entities/session`) still re-exports everything for
 * backward compatibility.
 */

// --- Core state atoms ---
export {
  addCheckpointAtom,
  checkpointsAtom,
  resetSessionStoreAtom,
  sessionMetaAtom,
  updateSessionMetaAtom,
} from "./model/atoms";

// --- Derived context-pressure atoms ---
export {
  CONTEXT_THRESHOLDS,
  contextPressureLevelAtom,
  contextUsagePctAtom,
} from "./model/contextPressureAtoms";

// --- Related types ---
export type {
  Checkpoint,
  SessionId,
  SessionMeta,
  SessionStatus,
} from "./model/types";
