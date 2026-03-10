import type { McpServerId, McpToolCallId } from "../../../../shared/protocol";
import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitThinking,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  nextId,
  postServerEvent,
  type TurnId,
} from "./types";

export async function runSearchWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(turnId, `${persona.name} here. Building search index and performing semantic search...`, "Searching codebase...", signal, 600);

  // Index status
  postServerEvent({ t: "SET_INDEX_STATUS", status: "indexing", progress: 0, file_count: 0 });
  await abortableSleep(400, signal);
  postServerEvent({ t: "SET_INDEX_STATUS", status: "indexing", progress: 60, file_count: 89 });
  await abortableSleep(400, signal);
  postServerEvent({ t: "SET_INDEX_STATUS", status: "ready", progress: 100, file_count: 156 });
  await abortableSleep(200, signal);

  // MCP tool call for semantic search
  postServerEvent({
    t: "UPSERT_MCP_TOOL_CALL",
    call: {
      id: nextId("mcp-tc") as McpToolCallId,
      turn_id: turnId as string,
      server_id: nextId("mcp-srv") as McpServerId,
      tool_name: "semantic_search",
      args_summary: `query: "${text.slice(0, 50)}"`,
      status: "running",
    },
  });
  await abortableSleep(300, signal);
  postServerEvent({
    t: "UPSERT_MCP_TOOL_CALL",
    call: {
      id: nextId("mcp-tc") as McpToolCallId,
      turn_id: turnId as string,
      server_id: nextId("mcp-srv") as McpServerId,
      tool_name: "semantic_search",
      args_summary: `query: "${text.slice(0, 50)}"`,
      status: "success",
      result_summary: "4 results found",
      duration_ms: 320,
    },
  });

  // MCP registry (available tools)
  postServerEvent({
    t: "SET_MCP_REGISTRY",
    entries: [
      { id: "mcp-1", name: "semantic-search", description: "Full-text semantic code search", author: "semantica", rating: 4.8, install_count: 12400, installed: true, categories: ["search", "code"], compatibility: ">=1.0.0" },
      { id: "mcp-2", name: "code-graph", description: "Dependency graph analysis", author: "semantica", rating: 4.5, install_count: 8200, installed: true, categories: ["analysis", "graph"], compatibility: ">=1.0.0" },
      { id: "mcp-3", name: "browser-preview", description: "Live browser preview and interaction", author: "community", rating: 4.2, install_count: 5600, installed: false, categories: ["browser", "preview"], compatibility: ">=1.1.0" },
    ],
  });

  // Element mappings (UI -> code)
  postServerEvent({
    t: "SET_ELEMENT_MAPPINGS",
    mappings: [
      { selector: "button.login-btn", file_path: "src/components/LoginForm.tsx", line: 42, column: 8 },
      { selector: "div.auth-container", file_path: "src/pages/AuthPage.tsx", line: 15, column: 4 },
      { selector: "input#email", file_path: "src/components/LoginForm.tsx", line: 28, column: 10 },
    ],
  });

  // Search results
  const query = text.replace(/search|find|locate|where|검색|찾아|어디/gi, "").trim() || "auth handler";
  postServerEvent({
    t: "SET_SEARCH_RESULTS",
    query,
    results: [
      { file_path: "src/auth/handler.ts", line_number: 1, snippet: "export async function handleAuth(req: Request) {\n  const token = req.headers.authorization;\n  if (!token) throw new UnauthorizedError();", score: 0.95, symbol_name: "handleAuth" },
      { file_path: "src/middleware/auth.ts", line_number: 15, snippet: "export const authMiddleware = (req, res, next) => {\n  try { verifyToken(req); next(); }\n  catch { res.status(401).json({ error: 'Unauthorized' }); }", score: 0.82, symbol_name: "authMiddleware" },
      { file_path: "src/routes/api.ts", line_number: 42, snippet: "router.post('/login', authMiddleware, loginController);\nrouter.get('/profile', authMiddleware, profileController);", score: 0.71, symbol_name: "router" },
      { file_path: "src/types/auth.ts", line_number: 1, snippet: "export type AuthToken = { userId: string; exp: number; iat: number };\nexport type AuthResult = { success: boolean; token?: AuthToken };", score: 0.65, symbol_name: "AuthToken" },
    ],
  });

  await emitSummary(
    turnId,
    `## Search Results for "${query}"\n\n**4 matches found** across 156 indexed files:\n\n1. **\`src/auth/handler.ts\`** — \`handleAuth()\` (95% match)\n   Main auth handler, validates bearer tokens\n\n2. **\`src/middleware/auth.ts\`** — \`authMiddleware\` (82% match)\n   Express middleware wrapper around token verification\n\n3. **\`src/routes/api.ts\`** — Route definitions (71% match)\n   Login and profile routes using auth middleware\n\n4. **\`src/types/auth.ts\`** — Type definitions (65% match)\n   AuthToken and AuthResult types\n\nThe main handler is in \`src/auth/handler.ts\`. The middleware in \`src/middleware/auth.ts\` wraps it for Express.`,
    signal, 1200,
  );

  finalizeTurn(turnId, ctx);
}
