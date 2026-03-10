import { describe, expect, it } from "vitest";
import { IntegrationKernelImpl } from "../IntegrationKernel.js";
import type { KernelTransport } from "../factory.js";

// ---------------------------------------------------------------------------
// Mock transport
// ---------------------------------------------------------------------------

function createMockTransport() {
  const handlers = new Map<string, Set<(data: unknown) => void>>();
  const sent: Array<{ channel: string; data: unknown }> = [];
  return {
    handlers,
    sent,
    async send(channel: string, data: unknown) {
      sent.push({ channel, data });
    },
    on(channel: string, handler: (data: unknown) => void) {
      let set = handlers.get(channel);
      if (!set) {
        set = new Set();
        handlers.set(channel, set);
      }
      set.add(handler);
      return () => {
        set!.delete(handler);
      };
    },
  } satisfies KernelTransport & {
    handlers: Map<string, Set<(data: unknown) => void>>;
    sent: Array<{ channel: string; data: unknown }>;
  };
}

/** Simulate the backend pushing a domain event through the transport layer. */
function emitTransportEvent(
  transport: ReturnType<typeof createMockTransport>,
  event: unknown,
) {
  transport.handlers.get("event")?.forEach((h) => h(event));
}

// ---------------------------------------------------------------------------
// MCP event fixtures
// ---------------------------------------------------------------------------

function mcpServerStatusEvent(ts = Date.now()) {
  return {
    domain: "mcp",
    type: "server_status",
    payload: { serverId: "mcp-github", status: "connected", tools: 5 },
    timestamp: ts,
  };
}

function mcpToolCatalogEvent(ts = Date.now()) {
  return {
    domain: "mcp",
    type: "tool_catalog",
    payload: {
      serverId: "mcp-github",
      tools: [
        { name: "create_issue", description: "Create GitHub issue" },
      ],
    },
    timestamp: ts,
  };
}

function mcpToolCallEvent(ts = Date.now()) {
  return {
    domain: "mcp",
    type: "tool_call_result",
    payload: {
      toolCallId: "tc-1",
      toolName: "create_issue",
      status: "ok",
      result: { issueId: 42 },
    },
    timestamp: ts,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP passthrough – transport → EventBridge", () => {
  // ── Transport → EventBridge passthrough ──────────────────────

  describe("transport → EventBridge passthrough", () => {
    it("MCP server_status events reach domain subscribers", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];

      kernel.events.subscribe("mcp", (e) => received.push(e));
      emitTransportEvent(transport, mcpServerStatusEvent());

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({
        domain: "mcp",
        type: "server_status",
      });
      kernel.dispose();
    });

    it("MCP tool_catalog events reach domain subscribers", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];

      kernel.events.subscribe("mcp", (e) => received.push(e));
      emitTransportEvent(transport, mcpToolCatalogEvent());

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({
        domain: "mcp",
        type: "tool_catalog",
        payload: {
          serverId: "mcp-github",
          tools: [{ name: "create_issue" }],
        },
      });
      kernel.dispose();
    });

    it("MCP tool_call_result events reach domain subscribers", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];

      kernel.events.subscribe("mcp", (e) => received.push(e));
      emitTransportEvent(transport, mcpToolCallEvent());

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({
        domain: "mcp",
        type: "tool_call_result",
        payload: { toolCallId: "tc-1", status: "ok" },
      });
      kernel.dispose();
    });
  });

  // ── Domain scoping ──────────────────────────────────────────

  describe("domain scoping", () => {
    it("MCP events only reach 'mcp' domain subscribers", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const mcpReceived: unknown[] = [];
      const lspReceived: unknown[] = [];
      const policyReceived: unknown[] = [];

      kernel.events.subscribe("mcp", (e) => mcpReceived.push(e));
      kernel.events.subscribe("lsp", (e) => lspReceived.push(e));
      kernel.events.subscribe("policy", (e) => policyReceived.push(e));

      emitTransportEvent(transport, mcpServerStatusEvent());

      expect(mcpReceived).toHaveLength(1);
      expect(lspReceived).toHaveLength(0);
      expect(policyReceived).toHaveLength(0);
      kernel.dispose();
    });

    it("global subscribers receive MCP events", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const globalReceived: unknown[] = [];

      kernel.events.subscribeAll((e) => globalReceived.push(e));
      emitTransportEvent(transport, mcpToolCatalogEvent());

      expect(globalReceived).toHaveLength(1);
      expect(globalReceived[0]).toMatchObject({ domain: "mcp" });
      kernel.dispose();
    });

    it("MCP events reach both domain and global subscribers", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const domainReceived: unknown[] = [];
      const globalReceived: unknown[] = [];

      kernel.events.subscribe("mcp", (e) => domainReceived.push(e));
      kernel.events.subscribeAll((e) => globalReceived.push(e));
      emitTransportEvent(transport, mcpToolCallEvent());

      expect(domainReceived).toHaveLength(1);
      expect(globalReceived).toHaveLength(1);
      kernel.dispose();
    });
  });

  // ── Event shape preservation ────────────────────────────────

  describe("event shape preservation", () => {
    it("event payload is not mutated during passthrough", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];

      const original = mcpToolCallEvent();
      const payloadSnapshot = JSON.parse(JSON.stringify(original.payload));

      kernel.events.subscribe("mcp", (e) => received.push(e));
      emitTransportEvent(transport, original);

      const delivered = received[0] as Record<string, unknown>;
      expect(delivered.payload).toEqual(payloadSnapshot);
      kernel.dispose();
    });

    it("event timestamp is preserved", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];
      const fixedTs = 1700000000000;

      kernel.events.subscribe("mcp", (e) => received.push(e));
      emitTransportEvent(transport, mcpServerStatusEvent(fixedTs));

      const delivered = received[0] as Record<string, unknown>;
      expect(delivered.timestamp).toBe(fixedTs);
      kernel.dispose();
    });

    it("event domain and type fields are preserved", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];

      kernel.events.subscribe("mcp", (e) => received.push(e));
      emitTransportEvent(transport, mcpToolCatalogEvent());

      const delivered = received[0] as Record<string, unknown>;
      expect(delivered.domain).toBe("mcp");
      expect(delivered.type).toBe("tool_catalog");
      kernel.dispose();
    });
  });

  // ── SDK protocol compatibility ──────────────────────────────

  describe("SDK protocol compatibility", () => {
    it("multiple MCP server events can be emitted sequentially", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];

      kernel.events.subscribe("mcp", (e) => received.push(e));

      const ts = Date.now();
      emitTransportEvent(transport, {
        domain: "mcp",
        type: "server_status",
        payload: { serverId: "mcp-github", status: "connected", tools: 5 },
        timestamp: ts,
      });
      emitTransportEvent(transport, {
        domain: "mcp",
        type: "server_status",
        payload: { serverId: "mcp-slack", status: "connected", tools: 3 },
        timestamp: ts + 1,
      });
      emitTransportEvent(transport, {
        domain: "mcp",
        type: "server_status",
        payload: { serverId: "mcp-jira", status: "disconnected", tools: 0 },
        timestamp: ts + 2,
      });

      expect(received).toHaveLength(3);

      const payloads = received.map(
        (e) => (e as Record<string, unknown>).payload,
      ) as Array<Record<string, unknown>>;
      expect(payloads[0].serverId).toBe("mcp-github");
      expect(payloads[1].serverId).toBe("mcp-slack");
      expect(payloads[2].serverId).toBe("mcp-jira");
      kernel.dispose();
    });

    it("rapid-fire MCP tool call events don't lose data", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];
      const count = 100;

      kernel.events.subscribe("mcp", (e) => received.push(e));

      const ts = Date.now();
      for (let i = 0; i < count; i++) {
        emitTransportEvent(transport, {
          domain: "mcp",
          type: "tool_call_result",
          payload: {
            toolCallId: `tc-${i}`,
            toolName: "create_issue",
            status: "ok",
            result: { issueId: i },
          },
          timestamp: ts + i,
        });
      }

      expect(received).toHaveLength(count);

      // Verify ordering and no data loss
      for (let i = 0; i < count; i++) {
        const evt = received[i] as Record<string, unknown>;
        const payload = evt.payload as Record<string, unknown>;
        expect(payload.toolCallId).toBe(`tc-${i}`);
        expect((payload.result as Record<string, unknown>).issueId).toBe(i);
      }
      kernel.dispose();
    });

    it("EventBridge snapshot updates correctly for MCP domain", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);

      // No snapshot before any event
      expect(kernel.events.getSnapshot("mcp")).toBeUndefined();

      const ts = Date.now();
      emitTransportEvent(transport, mcpServerStatusEvent(ts));

      const snap1 = kernel.events.getSnapshot("mcp") as Record<string, unknown>;
      expect(snap1).toBeDefined();
      expect(snap1.type).toBe("server_status");
      expect(snap1.timestamp).toBe(ts);

      // Snapshot updates to latest event
      emitTransportEvent(transport, mcpToolCatalogEvent(ts + 100));

      const snap2 = kernel.events.getSnapshot("mcp") as Record<string, unknown>;
      expect(snap2.type).toBe("tool_catalog");
      expect(snap2.timestamp).toBe(ts + 100);

      // Other domain snapshots remain unaffected
      expect(kernel.events.getSnapshot("lsp")).toBeUndefined();
      kernel.dispose();
    });
  });

  // ── Dispose cleanup ─────────────────────────────────────────

  describe("dispose cleanup", () => {
    it("after dispose, transport event handlers are cleaned up", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);

      // Before dispose, the "event" channel has a handler
      expect(transport.handlers.get("event")?.size).toBe(1);

      kernel.dispose();

      // After dispose, no handlers remain on the "event" channel
      const remaining = transport.handlers.get("event")?.size ?? 0;
      expect(remaining).toBe(0);
    });

    it("no events flow after dispose", () => {
      const transport = createMockTransport();
      const kernel = new IntegrationKernelImpl(transport);
      const received: unknown[] = [];

      kernel.events.subscribe("mcp", (e) => received.push(e));

      // Events work before dispose
      emitTransportEvent(transport, mcpServerStatusEvent());
      expect(received).toHaveLength(1);

      kernel.dispose();

      // Events after dispose should not reach subscribers via transport bridge
      emitTransportEvent(transport, mcpToolCatalogEvent());
      expect(received).toHaveLength(1);
    });
  });
});
