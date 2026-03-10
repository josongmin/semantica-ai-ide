import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { createBoundedAtomFamily } from "~shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "~shared/lib/atoms/debugLabel";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type {
  McpServer,
  McpServerId,
  McpServerStatus,
  McpTool,
  McpToolCall,
} from "~shared/protocol";

/** Per-MCP-server atom family */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- atomFamily migration to jotai-family tracked separately
export const mcpServerAtomFamily = atomFamily(
  (_id: string) => atom<McpServer | null>(null),
  (a: string, b: string) => a === b,
);
setDebugLabel(mcpServerAtomFamily, "mcpServerAtomFamily");

/** Ordered list of MCP server IDs (preserves insertion order for rendering) */
export const mcpServerIdsAtom = atom<readonly string[]>([]);

/** Set for O(1) membership checks when upserting */
const mcpServerSetAtom = atom<ReadonlySet<string>>(new Set<string>());

/** Tools keyed by server_id */
export const mcpToolsByServerAtom = atom<Readonly<Record<string, readonly McpTool[]>>>({});

/** Per-MCP-tool-call atom family */
export const mcpToolCallAtomFamily = createBoundedAtomFamily(
  (_id: string) => atom<McpToolCall | null>(null),
  { maxSize: 2000 },
  (a: string, b: string) => a === b,
);
setDebugLabel(mcpToolCallAtomFamily, "mcpToolCallAtomFamily");

/** Tool call IDs indexed by turn_id (preserves insertion order) */
export const mcpToolCallIdsByTurnAtom = atom<Readonly<Record<string, readonly string[]>>>({});

/** Set for O(1) tool call dedup keyed by turn_id */
const mcpToolCallIdSetByTurnAtom = atom<Readonly<Record<string, ReadonlySet<string>>>>({});

/** Write-only: upsert an MCP server into the store */
export const upsertMcpServerAtom = atom(null, (get, set, server: McpServer) => {
  set(mcpServerAtomFamily(server.id), server);

  const idSet = get(mcpServerSetAtom);
  if (!idSet.has(server.id)) {
    const nextSet = new Set(idSet);
    nextSet.add(server.id);
    set(mcpServerSetAtom, nextSet);
    set(mcpServerIdsAtom, [...get(mcpServerIdsAtom), server.id]);
  }
});

/** Write-only: update MCP server status */
export const setMcpServerStatusAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      id: McpServerId;
      status: McpServerStatus;
      error_message?: string;
    },
  ) => {
    const server = get(mcpServerAtomFamily(payload.id));
    if (!server) return;
    set(mcpServerAtomFamily(payload.id), {
      ...server,
      status: payload.status,
      error_message: payload.error_message ?? server.error_message,
    });
  },
);

/** Write-only: replace tools for a given server_id */
export const setMcpToolsAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      server_id: McpServerId;
      tools: readonly McpTool[];
    },
  ) => {
    const current = get(mcpToolsByServerAtom);
    set(mcpToolsByServerAtom, { ...current, [payload.server_id]: payload.tools });
  },
);

/** Write-only: upsert an MCP tool call, indexed by turn_id */
export const upsertMcpToolCallAtom = atom(null, (get, set, call: McpToolCall) => {
  set(mcpToolCallAtomFamily(call.id), call);

  const setByTurn = get(mcpToolCallIdSetByTurnAtom);
  const turnSet = setByTurn[call.turn_id] ?? new Set<string>();
  if (!turnSet.has(call.id)) {
    const nextSet = new Set(turnSet);
    nextSet.add(call.id);
    set(mcpToolCallIdSetByTurnAtom, { ...setByTurn, [call.turn_id]: nextSet });

    const byTurn = get(mcpToolCallIdsByTurnAtom);
    const turnIds = byTurn[call.turn_id] ?? [];
    set(mcpToolCallIdsByTurnAtom, { ...byTurn, [call.turn_id]: [...turnIds, call.id] });
  }
});

/** Write-only: reset all MCP state */
export const resetMcpStoreAtom = atom(null, (get, set) => {
  const ids = get(mcpServerSetAtom);
  for (const id of ids) {
    mcpServerAtomFamily.remove(id);
  }

  const callSetByTurn = get(mcpToolCallIdSetByTurnAtom);
  for (const callIds of Object.values(callSetByTurn)) {
    for (const id of callIds) {
      mcpToolCallAtomFamily.remove(id);
    }
  }

  set(mcpServerIdsAtom, []);
  set(mcpServerSetAtom, new Set());
  set(mcpToolsByServerAtom, {});
  set(mcpToolCallIdsByTurnAtom, {});
  set(mcpToolCallIdSetByTurnAtom, {});
});

/** Derived: count of MCP servers with status "connected" */
export const connectedServerCountAtom = atom((get) => {
  const ids = get(mcpServerIdsAtom);
  let count = 0;
  for (const id of ids) {
    const server = get(mcpServerAtomFamily(id));
    if (server?.status === "connected") count++;
  }
  return count;
});

/** Derived: flat list of all MCP tools from all servers */
export const allMcpToolsAtom = atom((get) => {
  const toolsByServer = get(mcpToolsByServerAtom);
  const result: McpTool[] = [];
  for (const tools of Object.values(toolsByServer)) {
    for (const tool of tools) {
      result.push(tool);
    }
  }
  return result;
});

registerResetAtom(resetMcpStoreAtom);
