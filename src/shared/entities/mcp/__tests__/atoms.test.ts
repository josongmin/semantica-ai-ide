import { createStore } from "jotai";

import type {
  McpServer,
  McpServerId,
  McpTool,
  McpToolCall,
  McpToolCallId,
} from "~shared/protocol";

import {
  allMcpToolsAtom,
  connectedServerCountAtom,
  mcpServerAtomFamily,
  mcpServerIdsAtom,
  mcpToolCallAtomFamily,
  mcpToolCallIdsByTurnAtom,
  mcpToolsByServerAtom,
  resetMcpStoreAtom,
  setMcpServerStatusAtom,
  setMcpToolsAtom,
  upsertMcpServerAtom,
  upsertMcpToolCallAtom,
} from "../model/atoms";

let serverCounter = 0;
let callCounter = 0;

function createMcpServer(overrides: Partial<McpServer> = {}): McpServer {
  return {
    id: `server_${++serverCounter}` as McpServerId,
    name: "Test Server",
    url: "http://localhost:3000",
    status: "connected",
    enabled: true,
    tool_count: 0,
    ...overrides,
  };
}

function createMcpToolCall(overrides: Partial<McpToolCall> = {}): McpToolCall {
  return {
    id: `call_${++callCounter}` as McpToolCallId,
    turn_id: "turn_1",
    server_id: "server_1" as McpServerId,
    tool_name: "test_tool",
    args_summary: "{}",
    status: "pending",
    ...overrides,
  };
}

function createMcpTool(overrides: Partial<McpTool> = {}): McpTool {
  return {
    server_id: "server_1" as McpServerId,
    tool_name: "test_tool",
    description: "A test tool",
    requires_approval: false,
    input_schema: {},
    ...overrides,
  };
}

beforeEach(() => {
  serverCounter = 0;
  callCounter = 0;
});

describe("upsertMcpServerAtom", () => {
  it("saves server to family and adds id to index", () => {
    const store = createStore();
    const server = createMcpServer({ id: "server_1" as McpServerId });

    store.set(upsertMcpServerAtom, server);

    expect(store.get(mcpServerAtomFamily("server_1"))).toEqual(server);
    expect(store.get(mcpServerIdsAtom)).toEqual(["server_1"]);
  });

  it("updates existing server without creating duplicate in index", () => {
    const store = createStore();
    const server = createMcpServer({ id: "server_1" as McpServerId, tool_count: 0 });
    store.set(upsertMcpServerAtom, server);

    const updated = { ...server, tool_count: 5 };
    store.set(upsertMcpServerAtom, updated);

    expect(store.get(mcpServerAtomFamily("server_1"))?.tool_count).toBe(5);
    expect(store.get(mcpServerIdsAtom)).toHaveLength(1);
  });
});

describe("setMcpServerStatusAtom", () => {
  it("updates server status", () => {
    const store = createStore();
    const server = createMcpServer({ id: "server_1" as McpServerId, status: "connecting" });
    store.set(upsertMcpServerAtom, server);

    store.set(setMcpServerStatusAtom, {
      id: "server_1" as McpServerId,
      status: "connected",
    });

    expect(store.get(mcpServerAtomFamily("server_1"))?.status).toBe("connected");
  });

  it("sets error_message on error status", () => {
    const store = createStore();
    const server = createMcpServer({ id: "server_1" as McpServerId, status: "connecting" });
    store.set(upsertMcpServerAtom, server);

    store.set(setMcpServerStatusAtom, {
      id: "server_1" as McpServerId,
      status: "error",
      error_message: "connection refused",
    });

    const result = store.get(mcpServerAtomFamily("server_1"));
    expect(result?.status).toBe("error");
    expect(result?.error_message).toBe("connection refused");
  });

  it("does nothing when server id does not exist", () => {
    const store = createStore();
    store.set(setMcpServerStatusAtom, {
      id: "nonexistent" as McpServerId,
      status: "connected",
    });
    expect(store.get(mcpServerAtomFamily("nonexistent"))).toBeNull();
  });
});

describe("setMcpToolsAtom", () => {
  it("stores tools for a server", () => {
    const store = createStore();
    const tools = [
      createMcpTool({ server_id: "server_1" as McpServerId, tool_name: "tool_a" }),
      createMcpTool({ server_id: "server_1" as McpServerId, tool_name: "tool_b" }),
    ];

    store.set(setMcpToolsAtom, { server_id: "server_1" as McpServerId, tools });

    const result = store.get(mcpToolsByServerAtom);
    expect(result.server_1).toHaveLength(2);
  });

  it("replaces tools for a server on subsequent call", () => {
    const store = createStore();
    const first = [createMcpTool({ server_id: "server_1" as McpServerId, tool_name: "old" })];
    const second = [
      createMcpTool({ server_id: "server_1" as McpServerId, tool_name: "new_a" }),
      createMcpTool({ server_id: "server_1" as McpServerId, tool_name: "new_b" }),
    ];

    store.set(setMcpToolsAtom, { server_id: "server_1" as McpServerId, tools: first });
    store.set(setMcpToolsAtom, { server_id: "server_1" as McpServerId, tools: second });

    expect(store.get(mcpToolsByServerAtom).server_1).toHaveLength(2);
    expect(store.get(mcpToolsByServerAtom).server_1?.[0]?.tool_name).toBe("new_a");
  });
});

describe("upsertMcpToolCallAtom", () => {
  it("saves tool call to family and indexes by turn_id", () => {
    const store = createStore();
    const call = createMcpToolCall({ id: "call_1" as McpToolCallId, turn_id: "turn_1" });

    store.set(upsertMcpToolCallAtom, call);

    expect(store.get(mcpToolCallAtomFamily("call_1"))).toEqual(call);
    expect(store.get(mcpToolCallIdsByTurnAtom).turn_1).toEqual(["call_1"]);
  });

  it("indexes multiple tool calls under the same turn", () => {
    const store = createStore();
    store.set(
      upsertMcpToolCallAtom,
      createMcpToolCall({ id: "call_1" as McpToolCallId, turn_id: "turn_1" }),
    );
    store.set(
      upsertMcpToolCallAtom,
      createMcpToolCall({ id: "call_2" as McpToolCallId, turn_id: "turn_1" }),
    );

    expect(store.get(mcpToolCallIdsByTurnAtom).turn_1).toEqual(["call_1", "call_2"]);
  });

  it("does not create duplicate index entry on upsert", () => {
    const store = createStore();
    const call = createMcpToolCall({ id: "call_1" as McpToolCallId, turn_id: "turn_1" });
    store.set(upsertMcpToolCallAtom, call);
    store.set(upsertMcpToolCallAtom, { ...call, status: "success" });

    expect(store.get(mcpToolCallAtomFamily("call_1"))?.status).toBe("success");
    expect(store.get(mcpToolCallIdsByTurnAtom).turn_1).toHaveLength(1);
  });
});

describe("resetMcpStoreAtom", () => {
  it("clears all state", () => {
    const store = createStore();
    store.set(upsertMcpServerAtom, createMcpServer({ id: "server_1" as McpServerId }));
    store.set(upsertMcpToolCallAtom, createMcpToolCall({ id: "call_1" as McpToolCallId }));
    store.set(setMcpToolsAtom, {
      server_id: "server_1" as McpServerId,
      tools: [createMcpTool()],
    });

    store.set(resetMcpStoreAtom);

    expect(store.get(mcpServerIdsAtom)).toEqual([]);
    expect(store.get(mcpToolsByServerAtom)).toEqual({});
    expect(store.get(mcpToolCallIdsByTurnAtom)).toEqual({});
  });
});

describe("connectedServerCountAtom", () => {
  it("counts only connected servers", () => {
    const store = createStore();
    store.set(
      upsertMcpServerAtom,
      createMcpServer({ id: "s1" as McpServerId, status: "connected" }),
    );
    store.set(
      upsertMcpServerAtom,
      createMcpServer({ id: "s2" as McpServerId, status: "connected" }),
    );
    store.set(upsertMcpServerAtom, createMcpServer({ id: "s3" as McpServerId, status: "error" }));

    expect(store.get(connectedServerCountAtom)).toBe(2);
  });

  it("returns 0 when no servers exist", () => {
    const store = createStore();
    expect(store.get(connectedServerCountAtom)).toBe(0);
  });
});

describe("allMcpToolsAtom", () => {
  it("returns flat list of tools from all servers", () => {
    const store = createStore();
    store.set(setMcpToolsAtom, {
      server_id: "s1" as McpServerId,
      tools: [
        createMcpTool({ server_id: "s1" as McpServerId, tool_name: "tool_a" }),
        createMcpTool({ server_id: "s1" as McpServerId, tool_name: "tool_b" }),
      ],
    });
    store.set(setMcpToolsAtom, {
      server_id: "s2" as McpServerId,
      tools: [createMcpTool({ server_id: "s2" as McpServerId, tool_name: "tool_c" })],
    });

    const tools = store.get(allMcpToolsAtom);
    expect(tools).toHaveLength(3);
    const names = tools.map((t) => t.tool_name);
    expect(names).toContain("tool_a");
    expect(names).toContain("tool_b");
    expect(names).toContain("tool_c");
  });

  it("returns empty array when no tools are set", () => {
    const store = createStore();
    expect(store.get(allMcpToolsAtom)).toEqual([]);
  });
});
