/**
 * Session entity handlers.
 *
 * Covers: SET_SESSION_META, ADD_CHECKPOINT, SET_CONTEXT_PRESSURE (UPDATE_SESSION_SUMMARY),
 *         SET_APPROVAL_MODE, FORK_SESSION
 */
import { approvalModeAtom } from "~entities/session/settings";
import {
  addCheckpointAtom,
  updateSessionMetaAtom,
} from "~entities/session/state";

import {
  currentPageAtom,
  persistSessionIdAtom,
} from "../../../shared/lib";
import type { ServerEvent } from "../../../shared/protocol";
import { registerHandler, type Store } from "./types";

// ── Self-registering handlers (side-effect at import time) ──

registerHandler("SET_SESSION_META", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SESSION_META") return;
  s.set(updateSessionMetaAtom, e.meta);
});

registerHandler("ADD_CHECKPOINT", (e: ServerEvent, s: Store) => {
  if (e.t !== "ADD_CHECKPOINT") return;
  s.set(addCheckpointAtom, e.checkpoint);
});

registerHandler("SET_APPROVAL_MODE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_APPROVAL_MODE") return;
  s.set(approvalModeAtom, e.mode);
});

registerHandler("UPDATE_SESSION_SUMMARY", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_SESSION_SUMMARY") return;
  // sessionMetaAtom always returns an object; update unconditionally
  s.set(updateSessionMetaAtom, {
    summary: e.summary,
    ...(e.stats && { stats: e.stats }),
  });
});

registerHandler("FORK_SESSION", (e: ServerEvent, s: Store) => {
  if (e.t !== "FORK_SESSION") return;
  s.set(updateSessionMetaAtom, {
    forked_from: {
      session_id: e.source_session_id,
      turn_id: e.source_turn_id,
    },
  });
  // Auto-navigate to the forked session
  if (e.new_session_id != null) {
    s.set(persistSessionIdAtom, e.new_session_id);
    s.set(currentPageAtom, "chat");
  }
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupSessionHandlers(): void {
  // Handlers are now registered at module scope.
}
