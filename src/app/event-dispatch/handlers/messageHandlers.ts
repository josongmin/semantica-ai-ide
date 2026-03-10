/**
 * Message & turn entity handlers.
 *
 * Covers: UPSERT_MESSAGE, APPEND_TEXT, SET_MESSAGE_STATUS, SET_DIFF_LOADED,
 *         CLASSIFY_ERROR, UPSERT_TURN, UPDATE_TURN_PHASE, UPDATE_TURN_METRICS,
 *         TOGGLE_TURN_BOOKMARK, NOP
 */
import { appendTextAtom } from "~entities/message/core";
import { turnAtomFamily, updateTurnPhaseAtom } from "~entities/message/turns";
import {
  classifyErrorAtom,
  setDiffLoadedAtom,
  setMessageStatusAtom,
  upsertMessageAtom,
  upsertTurnAtom,
} from "~entities/message/writers";

import { toggleBookmarkAtom } from "../../../features/turn-bookmark";
import type { ServerEvent } from "../../../shared/protocol";
import { registerHandler, type Store } from "./types";

// ── Self-registering handlers (side-effect at import time) ──

registerHandler("UPSERT_MESSAGE", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_MESSAGE") return;
  s.set(upsertMessageAtom, e.msg);
});

registerHandler("APPEND_TEXT", (e: ServerEvent, s: Store) => {
  if (e.t !== "APPEND_TEXT") return;
  s.set(appendTextAtom, { id: e.id, chunk: e.chunk });
});

registerHandler("SET_DIFF_LOADED", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_DIFF_LOADED") return;
  s.set(setDiffLoadedAtom, { id: e.id, diff_text: e.diff_text });
});

registerHandler("SET_MESSAGE_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_MESSAGE_STATUS") return;
  s.set(setMessageStatusAtom, { id: e.id, status: e.status });
});

registerHandler("UPSERT_TURN", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_TURN") return;
  s.set(upsertTurnAtom, e.turn);
});

registerHandler("UPDATE_TURN_PHASE", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_TURN_PHASE") return;
  s.set(updateTurnPhaseAtom, {
    turn_id: e.turn_id,
    phase: e.phase,
    entry: e.entry,
  });
});

registerHandler("CLASSIFY_ERROR", (e: ServerEvent, s: Store) => {
  if (e.t !== "CLASSIFY_ERROR") return;
  s.set(classifyErrorAtom, { id: e.id, error: e.error });
});

registerHandler("UPDATE_TURN_METRICS", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_TURN_METRICS") return;
  const existing = s.get(turnAtomFamily(e.turn_id));
  if (existing) {
    s.set(turnAtomFamily(e.turn_id), {
      ...existing,
      ...(e.ttft_ms !== undefined && { ttft_ms: e.ttft_ms }),
      ...(e.latency_ms !== undefined && { latency_ms: e.latency_ms }),
      ...(e.token_usage !== undefined && { token_usage: e.token_usage }),
      ...(e.estimated_cost_usd !== undefined && {
        estimated_cost_usd: e.estimated_cost_usd,
      }),
    });
  }
});

registerHandler("TOGGLE_TURN_BOOKMARK", (e: ServerEvent, s: Store) => {
  if (e.t !== "TOGGLE_TURN_BOOKMARK") return;
  const existingTurn = s.get(turnAtomFamily(e.turn_id));
  if (existingTurn) {
    s.set(turnAtomFamily(e.turn_id), {
      ...existingTurn,
      bookmarked: e.bookmarked,
      bookmark_label: e.bookmark_label,
    });
  }
  s.set(toggleBookmarkAtom, {
    turn_id: e.turn_id,
    bookmarked: e.bookmarked,
    bookmark_label: e.bookmark_label,
  });
});

registerHandler("NOP", () => {
  // no-op
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupMessageHandlers(): void {
  // Handlers are now registered at module scope.
  // This function is a no-op retained for backward compatibility.
}
