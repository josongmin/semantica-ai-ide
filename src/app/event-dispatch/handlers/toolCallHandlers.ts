/**
 * Tool-call entity handlers.
 *
 * Covers: UPSERT_TOOL_CALL, UPDATE_TOOL_CALL_STATUS, REQUEST_TOOL_APPROVAL, SET_TOOL_OUTPUT
 */
import {
  requestToolApprovalAtom,
  setToolOutputAtom,
  updateToolCallStatusAtom,
  upsertToolCallAtom,
} from "~entities/tool-call";

import type { ServerEvent } from "../../../shared/protocol";
import { registerHandler, type Store } from "./types";

// ── Self-registering handlers (side-effect at import time) ──

registerHandler("UPSERT_TOOL_CALL", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_TOOL_CALL") return;
  s.set(upsertToolCallAtom, e.tool_call);
});

registerHandler("UPDATE_TOOL_CALL_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPDATE_TOOL_CALL_STATUS") return;
  s.set(updateToolCallStatusAtom, {
    id: e.id,
    status: e.status,
    result_summary: e.result_summary,
    duration_ms: e.duration_ms,
    diff_text: e.diff_text,
  });
});

registerHandler("REQUEST_TOOL_APPROVAL", (e: ServerEvent, s: Store) => {
  if (e.t !== "REQUEST_TOOL_APPROVAL") return;
  s.set(requestToolApprovalAtom, {
    tool_call_id: e.tool_call_id,
    action_id: e.action_id,
    risk_level: e.risk_level,
    description: e.description,
    supports_sandbox: e.supports_sandbox,
  });
});

registerHandler("SET_TOOL_OUTPUT", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_TOOL_OUTPUT") return;
  s.set(setToolOutputAtom, { id: e.id, output: e.output });
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupToolCallHandlers(): void {
  // Handlers are now registered at module scope.
}
