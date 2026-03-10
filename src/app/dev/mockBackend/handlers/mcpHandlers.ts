/**
 * MCP (Model Context Protocol) Handlers
 *
 * Covers: ADD_MCP_SERVER, INSTALL_MCP_SERVER, REMOVE_MCP_SERVER,
 *         UNINSTALL_MCP_SERVER, TOGGLE_MCP_SERVER
 */
import type { McpServerId } from "../../../../shared/protocol";
import { nextId, postServerEvent } from "../MockBackendCore";
import type { Handler } from "./index";

// ── Registration ──────────────────────────────────────────────

export function registerMcpHandlers(registry: Map<string, Handler>): void {
  registry.set("ADD_MCP_SERVER", (msg) => {
    const mcpId = nextId("mcp") as McpServerId;
    postServerEvent({
      t: "UPSERT_MCP_SERVER",
      server: {
        id: mcpId,
        name: msg.name,
        url: msg.url,
        status: "connecting",
        enabled: true,
        tool_count: 0,
      },
    });
    setTimeout(() => {
      postServerEvent({ t: "SET_MCP_SERVER_STATUS", id: mcpId, status: "connected" });
      postServerEvent({
        t: "SET_MCP_TOOLS",
        server_id: mcpId,
        tools: [
          { server_id: mcpId, tool_name: "default_tool", description: "Default mock tool", requires_approval: false, input_schema: {} },
        ],
      });
    }, 800);
  });

  registry.set("INSTALL_MCP_SERVER", (msg) => {
    const mcpId2 = nextId("mcp") as McpServerId;
    postServerEvent({
      t: "UPSERT_MCP_SERVER",
      server: {
        id: mcpId2,
        name: `server-${msg.server_id}`,
        url: "stdio://localhost",
        status: "connecting",
        enabled: true,
        tool_count: 0,
      },
    });
    setTimeout(() => {
      postServerEvent({ t: "SET_MCP_SERVER_STATUS", id: mcpId2, status: "connected" });
    }, 800);
  });

  registry.set("REMOVE_MCP_SERVER", (msg) => {
    postServerEvent({
      t: "SET_MCP_SERVER_STATUS",
      id: msg.server_id as McpServerId,
      status: "disconnected",
    });
  });

  registry.set("UNINSTALL_MCP_SERVER", (msg) => {
    postServerEvent({
      t: "SET_MCP_SERVER_STATUS",
      id: msg.server_id as McpServerId,
      status: "disconnected",
    });
  });

  registry.set("TOGGLE_MCP_SERVER", (msg) => {
    postServerEvent({
      t: "SET_MCP_SERVER_STATUS",
      id: msg.server_id as McpServerId,
      status: msg.enabled ? "connected" : "disconnected",
    });
  });
}
