import type {
  McpRegistryEntry,
  McpServerId,
  McpTool,
} from "../../../shared/protocol";
import { postServerEvent, postServerEvents } from "../devUtils";

/**
 * Seeds MCP servers, tools, and the MCP registry.
 */
export function seedMcp() {
  const mcpId1 = "mcp-seed-1" as McpServerId;
  const mcpId2 = "mcp-seed-2" as McpServerId;
  postServerEvents([
    { t: "UPSERT_MCP_SERVER", server: { id: mcpId1, name: "filesystem", url: "stdio://localhost", status: "connected", enabled: true, tool_count: 4 } },
    { t: "UPSERT_MCP_SERVER", server: { id: mcpId2, name: "postgres", url: "stdio://pg", status: "error", enabled: true, tool_count: 0, error_message: "Connection refused" } },
  ]);
  const mcpTools: McpTool[] = [
    { server_id: mcpId1, tool_name: "read_file", description: "Read file contents", requires_approval: false, input_schema: {} },
    { server_id: mcpId1, tool_name: "write_file", description: "Write file contents", requires_approval: true, input_schema: {} },
    { server_id: mcpId1, tool_name: "list_dir", description: "List directory", requires_approval: false, input_schema: {} },
    { server_id: mcpId1, tool_name: "delete_file", description: "Delete a file", requires_approval: true, input_schema: {} },
  ];
  postServerEvent({ t: "SET_MCP_TOOLS", server_id: mcpId1, tools: mcpTools });

  // ── MCP Registry ────────────────────────────────────────
  const mcpRegistry: McpRegistryEntry[] = [
    { id: "reg-1", name: "filesystem", description: "File system operations", author: "anthropic", rating: 4.8, install_count: 15200, installed: true, categories: ["file", "core"], compatibility: ">=1.0" },
    { id: "reg-2", name: "postgres", description: "PostgreSQL database access", author: "community", rating: 4.2, install_count: 3400, installed: true, categories: ["database"], compatibility: ">=1.0" },
    { id: "reg-3", name: "github", description: "GitHub API integration", author: "anthropic", rating: 4.6, install_count: 8900, installed: false, categories: ["git", "api"], compatibility: ">=1.0" },
  ];
  postServerEvent({ t: "SET_MCP_REGISTRY", entries: mcpRegistry });

  // ── Semantic index ──────────────────────────────────────
  postServerEvent({ t: "SET_INDEX_STATUS", status: "ready", progress: 100, file_count: 1247 });
  postServerEvent({ t: "SET_SEARCH_RESULTS", query: "authentication", results: [
    { file_path: "src/routes/auth.ts", line_number: 15, snippet: "export async function authenticateUser(req, res) {", score: 0.95, symbol_name: "authenticateUser" },
    { file_path: "src/middleware/jwt.ts", line_number: 1, snippet: "import jwt from 'jsonwebtoken';", score: 0.82 },
    { file_path: "src/middleware/auth.ts", line_number: 8, snippet: "export function requireAuth(req, res, next) {", score: 0.78, symbol_name: "requireAuth" },
  ]});
}
