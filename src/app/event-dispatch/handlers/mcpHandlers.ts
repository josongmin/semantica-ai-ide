/**
 * MCP (Model Context Protocol) entity handlers.
 *
 * Covers: UPSERT_MCP_SERVER, SET_MCP_TOOLS, SET_MCP_SERVER_STATUS, UPSERT_MCP_TOOL_CALL
 */
import {
  setMcpServerStatusAtom,
  setMcpToolsAtom,
  upsertMcpServerAtom,
  upsertMcpToolCallAtom,
} from "~entities/mcp";

import type { ServerEvent } from "../../../shared/protocol";
import { registerHandler, type Store } from "./types";

// ── Self-registering handlers (side-effect at import time) ──

registerHandler("UPSERT_MCP_SERVER", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_MCP_SERVER") return;
  s.set(upsertMcpServerAtom, e.server);
});

registerHandler("SET_MCP_SERVER_STATUS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_MCP_SERVER_STATUS") return;
  s.set(setMcpServerStatusAtom, {
    id: e.id,
    status: e.status,
    error_message: e.error_message,
  });
});

registerHandler("SET_MCP_TOOLS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_MCP_TOOLS") return;
  s.set(setMcpToolsAtom, { server_id: e.server_id, tools: e.tools });
});

registerHandler("UPSERT_MCP_TOOL_CALL", (e: ServerEvent, s: Store) => {
  if (e.t !== "UPSERT_MCP_TOOL_CALL") return;
  s.set(upsertMcpToolCallAtom, e.call);
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupMcpHandlers(): void {
  // Handlers are now registered at module scope.
}
