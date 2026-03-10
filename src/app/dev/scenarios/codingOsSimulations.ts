/**
 * Mock data simulations for AI Native Coding OS feature panels.
 * These features use window.postMessage({ type, payload }) format
 * (NOT the ServerEvent { t } pattern) — matching the sync hooks.
 */
import type {
  BackgroundAgentId,
  BackgroundAgentStatus,
  CostGovernorConfig,
  GraphEdge,
  GraphNode,
  IntentEntry,
  IntentId,
  ResourceMetrics,
  SemanticDiffResult,
  TerminalAgentAction,
  TerminalOutput,
  TerminalSession,
  TerminalSessionId,
  TransactionId,
  TransactionStatus,
  TurnId,
  WorkspaceGraphNodeId,
  WorkspaceGraphSnapshot,
} from "../../../shared/protocol";
import { sleep, STAGE_DELAY } from "../devUtils";

function post(type: string, payload: unknown) {
  window.postMessage({ type, payload }, window.location.origin);
}

// ─── Background Agents ──────────────────────────────────────

export function simulateBackgroundAgents() {
  const agents: BackgroundAgentStatus[] = [
    {
      agentId: "bg_lint_watch" as BackgroundAgentId,
      kind: "lint-watch",
      label: "Lint Watch",
      state: "running",
      progress: { current: 7, total: 10 },
      lastResult: { summary: "3 warnings fixed", issues: 3, fixesApplied: 3, timestamp: Date.now() - 30_000 },
      logs: ["Started lint-watch", "Scanning src/...", "Fixed 3 warnings in 2 files"],
      startedAt: Date.now() - 120_000,
      config: { autoFix: true },
    },
    {
      agentId: "bg_test_runner" as BackgroundAgentId,
      kind: "test-watch",
      label: "Test Runner",
      state: "paused",
      progress: { current: 42, total: 50 },
      lastResult: { summary: "42/50 passed, 8 skipped", issues: 0, fixesApplied: 0, timestamp: Date.now() - 60_000 },
      logs: ["Running vitest...", "42 tests passed", "Paused by user"],
      startedAt: Date.now() - 180_000,
      config: {},
    },
    {
      agentId: "bg_security_scan" as BackgroundAgentId,
      kind: "dependency-audit",
      label: "Security Scanner",
      state: "completed",
      progress: { current: 10, total: 10 },
      lastResult: { summary: "1 medium vulnerability found", issues: 1, fixesApplied: 0, timestamp: Date.now() - 10_000 },
      logs: ["Scanning dependencies...", "Found CVE-2024-1234 in lodash", "Scan complete"],
      startedAt: Date.now() - 300_000,
      config: {},
    },
  ];

  for (const agent of agents) {
    post("bg-agent/status", agent);
  }
}

// ─── Intent Timeline ────────────────────────────────────────

export function simulateIntentTimeline() {
  const now = Date.now();
  const intents: IntentEntry[] = [
    {
      id: "intent_auth" as IntentId,
      summary: "Implement JWT authentication",
      status: "completed",
      turnIds: ["turn-seed-1" as TurnId],
      tags: ["auth", "security", "backend"],
      createdAt: now - 600_000,
      relatedFiles: ["src/routes/auth.ts", "src/middleware/jwt.ts", "src/types/auth.ts"],
      childIntents: ["intent_tests" as IntentId],
    },
    {
      id: "intent_tests" as IntentId,
      summary: "Write unit tests for auth module",
      status: "active",
      turnIds: ["turn-seed-4" as TurnId],
      tags: ["testing", "auth"],
      createdAt: now - 300_000,
      relatedFiles: ["src/__tests__/auth.test.ts"],
      childIntents: [],
    },
    {
      id: "intent_refactor" as IntentId,
      summary: "Refactor middleware pipeline",
      status: "active",
      turnIds: [],
      tags: ["refactor", "middleware"],
      createdAt: now - 120_000,
      relatedFiles: ["src/middleware/index.ts", "src/middleware/cors.ts"],
      childIntents: ["intent_perf" as IntentId],
    },
    {
      id: "intent_perf" as IntentId,
      summary: "Optimize request latency",
      status: "branched",
      turnIds: [],
      tags: ["performance"],
      createdAt: now - 60_000,
      relatedFiles: [],
      childIntents: [],
    },
  ];

  post("intent/sync", intents);
}

// ─── Terminal Bridge ────────────────────────────────────────

export function simulateTerminalBridge() {
  const sessionId1 = "term_main" as TerminalSessionId;
  const sessionId2 = "term_test" as TerminalSessionId;

  const sessions: TerminalSession[] = [
    { id: sessionId1, sessionId: sessionId1, name: "bash — /workspace", title: "bash", cwd: "/workspace", isActive: true, shellType: "bash", pid: 1001, createdAt: Date.now(), status: "running", provenance: { source: "user" }, mode: "interactive", markerSupport: true },
    { id: sessionId2, sessionId: sessionId2, name: "vitest watch", title: "vitest", cwd: "/workspace", isActive: false, shellType: "bash", pid: 1002, createdAt: Date.now(), status: "running", provenance: { source: "user" }, mode: "interactive", markerSupport: true },
  ];
  post("terminal/sessions", sessions);

  const outputs: TerminalOutput[] = [
    { sessionId: sessionId1, text: "$ npm run build", timestamp: Date.now() - 5000, isError: false },
    { sessionId: sessionId1, text: "vite v6.2.0 building for production...", timestamp: Date.now() - 4500, isError: false },
    { sessionId: sessionId1, text: "PASS 247 modules transformed.", timestamp: Date.now() - 3000, isError: false },
    { sessionId: sessionId1, text: "dist/index.js   748.2 kB │ gzip: 197.5 kB", timestamp: Date.now() - 2500, isError: false },
    { sessionId: sessionId1, text: "PASS built in 4.43s", timestamp: Date.now() - 2000, isError: false },
    { sessionId: sessionId1, text: "$ eslint src/ --fix", timestamp: Date.now() - 1500, isError: false },
    { sessionId: sessionId1, text: "[WARN] 2 warnings (0 errors)", timestamp: Date.now() - 1000, isError: false },
    { sessionId: sessionId1, text: "  src/utils/helpers.ts:42  no-console", timestamp: Date.now() - 900, isError: true },
    { sessionId: sessionId1, text: "  src/app/App.tsx:15       unused-import", timestamp: Date.now() - 800, isError: true },
  ];
  for (const output of outputs) {
    post("terminal/output", output);
  }

  const actions: TerminalAgentAction[] = [
    {
      id: "tact_1",
      sessionId: sessionId1,
      command: "rm -rf dist/ && npm run build",
      reason: "Clean rebuild after dependency update",
      requiresApproval: true,
      status: "pending",
    },
    {
      id: "tact_2",
      sessionId: sessionId2,
      command: "npx vitest run --coverage",
      reason: "Run full test suite with coverage report",
      requiresApproval: false,
      status: "approved",
    },
  ];
  for (const action of actions) {
    post("terminal/action", action);
  }
}

// ─── Workspace Graph ────────────────────────────────────────

export function simulateWorkspaceGraph() {
  const nodeIds = {
    app: "gn_app" as WorkspaceGraphNodeId,
    auth: "gn_auth" as WorkspaceGraphNodeId,
    jwt: "gn_jwt" as WorkspaceGraphNodeId,
    routes: "gn_routes" as WorkspaceGraphNodeId,
    db: "gn_db" as WorkspaceGraphNodeId,
    user: "gn_user" as WorkspaceGraphNodeId,
    config: "gn_config" as WorkspaceGraphNodeId,
    middleware: "gn_middleware" as WorkspaceGraphNodeId,
    types: "gn_types" as WorkspaceGraphNodeId,
    test: "gn_test" as WorkspaceGraphNodeId,
  };

  const now = Date.now();
  const nodes: GraphNode[] = [
    { id: nodeIds.app, name: "App", kind: "function", filePath: "src/app/App.tsx", line: 1, connections: [nodeIds.routes, nodeIds.middleware], metrics: { complexity: 5, changeFreq: 8, lastModified: now - 3600_000 } },
    { id: nodeIds.auth, name: "authHandler", kind: "function", filePath: "src/routes/auth.ts", line: 12, connections: [nodeIds.jwt, nodeIds.db], metrics: { complexity: 7, changeFreq: 3, lastModified: now - 60_000 } },
    { id: nodeIds.jwt, name: "verifyToken", kind: "function", filePath: "src/middleware/jwt.ts", line: 5, connections: [nodeIds.config], metrics: { complexity: 4, changeFreq: 2, lastModified: now - 60_000 } },
    { id: nodeIds.routes, name: "RouteIndex", kind: "module", filePath: "src/routes/index.ts", line: 1, connections: [nodeIds.auth], metrics: { complexity: 2, changeFreq: 5, lastModified: now - 120_000 } },
    { id: nodeIds.db, name: "Database", kind: "class", filePath: "src/db/index.ts", line: 8, connections: [nodeIds.user], metrics: { complexity: 6, changeFreq: 1, lastModified: now - 86400_000 } },
    { id: nodeIds.user, name: "UserModel", kind: "class", filePath: "src/models/user.ts", line: 1, connections: [], metrics: { complexity: 3, changeFreq: 2, lastModified: now - 86400_000 } },
    { id: nodeIds.config, name: "Config", kind: "module", filePath: "src/config.ts", line: 1, connections: [], metrics: { complexity: 1, changeFreq: 1, lastModified: now - 172800_000 } },
    { id: nodeIds.middleware, name: "MiddlewarePipeline", kind: "module", filePath: "src/middleware/index.ts", line: 1, connections: [nodeIds.jwt], metrics: { complexity: 3, changeFreq: 4, lastModified: now - 120_000 } },
    { id: nodeIds.types, name: "AuthTypes", kind: "interface", filePath: "src/types/auth.ts", line: 1, connections: [], metrics: { complexity: 1, changeFreq: 2, lastModified: now - 60_000 } },
    { id: nodeIds.test, name: "AuthTests", kind: "function", filePath: "src/__tests__/auth.test.ts", line: 1, connections: [nodeIds.auth, nodeIds.jwt], metrics: { complexity: 4, changeFreq: 1, lastModified: now } },
  ];

  const edges: GraphEdge[] = [
    { source: nodeIds.app, target: nodeIds.routes, kind: "imports" },
    { source: nodeIds.app, target: nodeIds.middleware, kind: "imports" },
    { source: nodeIds.routes, target: nodeIds.auth, kind: "imports" },
    { source: nodeIds.auth, target: nodeIds.jwt, kind: "calls" },
    { source: nodeIds.auth, target: nodeIds.db, kind: "calls" },
    { source: nodeIds.auth, target: nodeIds.types, kind: "imports" },
    { source: nodeIds.jwt, target: nodeIds.config, kind: "imports" },
    { source: nodeIds.middleware, target: nodeIds.jwt, kind: "imports" },
    { source: nodeIds.db, target: nodeIds.user, kind: "imports" },
    { source: nodeIds.test, target: nodeIds.auth, kind: "imports" },
    { source: nodeIds.test, target: nodeIds.jwt, kind: "imports" },
  ];

  const graph: WorkspaceGraphSnapshot = {
    nodes,
    edges,
    updatedAt: now,
  };

  post("workspace-graph/sync", graph);
}

// ─── Resource Monitor ───────────────────────────────────────

export function simulateResourceMonitor() {
  const metrics: ResourceMetrics = {
    timestamp: Date.now(),
    tokens: { input: 48200, output: 12800, cached: 22000, total: 61000 },
    cost: {
      session_usd: 0.187,
      today_usd: 1.42,
      month_usd: 18.75,
      budget_usd: 50.0,
      remaining_usd: 31.25,
    },
    models: [
      { model: "claude-opus-4-6", tokens: 38000, cost_usd: 0.142, percentage: 62 },
      { model: "claude-sonnet-4-6", tokens: 18000, cost_usd: 0.038, percentage: 30 },
      { model: "claude-haiku-4-5", tokens: 5000, cost_usd: 0.007, percentage: 8 },
    ],
    performance: {
      avg_latency_ms: 280,
      p95_latency_ms: 720,
      requests_per_min: 8,
      error_rate: 0.01,
    },
  };

  post("resource/metrics", metrics);

  // Also set the governor config via ServerEvent (this one uses the old pattern)
  const config: CostGovernorConfig = {
    enabled: true,
    budget_usd: 50.0,
    period: "monthly",
    alerts: [
      { threshold: 0.5, action: "warn", triggered: true },
      { threshold: 0.8, action: "warn", triggered: false },
      { threshold: 0.95, action: "stop", triggered: false },
    ],
    autoDowngrade: true,
    autoDowngradeModel: "claude-haiku-4-5-20251001",
  };
  post("resource/config", config);
}

// ─── Transaction ────────────────────────────────────────────

export function simulateTransaction() {
  const tx: TransactionStatus = {
    txId: "txn_auth_impl" as TransactionId,
    state: "preview",
    description: "JWT authentication module implementation",
    files: [
      {
        filePath: "src/routes/auth.ts",
        type: "create",
        hunks: [
          { startLine: 1, endLine: 45, content: "+import express from 'express';\n+import { verifyToken }...", type: "add" },
        ],
        insertions: 45,
        deletions: 0,
        included: true,
      },
      {
        filePath: "src/middleware/jwt.ts",
        type: "create",
        hunks: [
          { startLine: 1, endLine: 28, content: "+import jwt from 'jsonwebtoken';\n+export function verify...", type: "add" },
        ],
        insertions: 28,
        deletions: 0,
        included: true,
      },
      {
        filePath: "src/routes/index.ts",
        type: "modify",
        hunks: [
          { startLine: 5, endLine: 8, content: "-// routes\n+import { authRouter } from './auth';\n+router.use('/auth', authRouter);", type: "add" },
        ],
        insertions: 3,
        deletions: 1,
        included: true,
      },
      {
        filePath: "src/types/auth.ts",
        type: "create",
        hunks: [
          { startLine: 1, endLine: 12, content: "+export interface AuthPayload { ... }", type: "add" },
        ],
        insertions: 12,
        deletions: 0,
        included: false,
      },
    ],
    validationErrors: [
      "src/routes/auth.ts:42 — Missing input validation for email field",
    ],
    createdAt: Date.now() - 10_000,
  };

  post("transaction/update", tx);
}

// ─── Semantic Diff ──────────────────────────────────────────

export function simulateSemanticDiff() {
  const diff: SemanticDiffResult = {
    turnId: "turn-seed-1" as TurnId,
    overallNarrative: "Added JWT authentication with login/register endpoints, token middleware, and TypeScript interfaces",
    groups: [
      {
        id: "sg_auth_routes",
        title: "Authentication Routes",
        category: "feature",
        impact: "high",
        narrative: "New login and register API endpoints with request validation",
        files: [
          {
            filePath: "src/routes/auth.ts",
            hunks: [
              { startLine: 1, endLine: 45, content: "+export const authRouter = express.Router();\n+authRouter.post('/login', async (req, res) => { ... });", type: "add" },
            ],
          },
        ],
        relatedGroupIds: ["sg_jwt_middleware"],
      },
      {
        id: "sg_jwt_middleware",
        title: "JWT Token Middleware",
        category: "feature",
        impact: "high",
        narrative: "Token generation, verification, and refresh logic",
        files: [
          {
            filePath: "src/middleware/jwt.ts",
            hunks: [
              { startLine: 1, endLine: 28, content: "+export function verifyToken(token: string) { ... }", type: "add" },
            ],
          },
        ],
        relatedGroupIds: ["sg_auth_routes"],
      },
      {
        id: "sg_type_defs",
        title: "Type Definitions",
        category: "refactor",
        impact: "low",
        narrative: "TypeScript interfaces for auth payloads and tokens",
        files: [
          {
            filePath: "src/types/auth.ts",
            hunks: [
              { startLine: 1, endLine: 12, content: "+export interface AuthPayload { email: string; ... }", type: "add" },
            ],
          },
        ],
        relatedGroupIds: [],
      },
    ],
    riskAssessment: {
      level: "safe",
      reasons: ["Well-established JWT pattern", "Input validation present", "No breaking changes to existing APIs"],
    },
  };

  post("semantic-diff/result", diff);
}

// ─── Existing FeatureBar panels (ServerEvent pattern) ───────

function seedExistingPanels() {
  const now = Date.now();
  const se = (evt: unknown) => window.postMessage(evt, window.location.origin);

  // Agents
  se({ t: "UPSERT_AGENT_INSTANCE", instance: { id: "agent-os-1", label: "Code Review Agent", status: "running", progress: 65, model_id: "claude-opus-4-6", created_at_ms: now - 120_000 } });
  se({ t: "UPSERT_AGENT_INSTANCE", instance: { id: "agent-os-2", label: "Test Generator", status: "success", progress: 100, model_id: "claude-sonnet-4-6", created_at_ms: now - 300_000 } });

  // Semantic search
  se({ t: "SET_INDEX_STATUS", status: "ready", progress: 100, file_count: 1247 });
  se({ t: "SET_SEARCH_RESULTS", query: "authentication", results: [
    { file_path: "src/routes/auth.ts", line_number: 12, snippet: "export function authHandler(req, res) {", score: 0.97 },
    { file_path: "src/middleware/jwt.ts", line_number: 5, snippet: "export function verifyToken(token: string) {", score: 0.92 },
    { file_path: "src/types/auth.ts", line_number: 1, snippet: "export interface AuthPayload {", score: 0.85 },
    { file_path: "src/config.ts", line_number: 8, snippet: "JWT_SECRET: process.env.JWT_SECRET,", score: 0.78 },
  ] });

  // Browser preview
  se({ t: "SET_BROWSER_STATE", state: { url: "http://localhost:3000/api/docs", loading: false, title: "API Documentation" } });
  se({ t: "PUSH_BROWSER_CONSOLE", entry: { id: "cos-1", level: "log", message: "API server listening on port 3000", timestamp_ms: now - 10_000 } });
  se({ t: "PUSH_BROWSER_CONSOLE", entry: { id: "cos-2", level: "warn", message: "JWT_SECRET should be rotated (>90 days old)", timestamp_ms: now - 5_000 } });

  // Git history
  se({ t: "SET_AUTO_COMMIT_ENABLED", enabled: true });
  se({ t: "PUSH_GIT_COMMIT", commit: { id: "gc-os-1", sha: "a1b2c3d", message: "feat: add JWT authentication endpoint", timestamp_ms: now - 120_000, auto: true } });
  se({ t: "PUSH_GIT_COMMIT", commit: { id: "gc-os-2", sha: "e4f5g6h", message: "feat: add JWT middleware", timestamp_ms: now - 60_000, auto: true } });
  se({ t: "PUSH_GIT_COMMIT", commit: { id: "gc-os-3", sha: "i7j8k9l", message: "refactor: update route index", timestamp_ms: now - 30_000, auto: false } });

  // Compaction history
  se({ t: "LOG_COMPACTION", event: { id: "comp-os-1", timestamp_ms: now - 600_000, tokens_before: 185_000, tokens_after: 42_000, summary: "Compacted: removed 12 resolved turns, kept 3 active + working context" } });
  se({ t: "LOG_COMPACTION", event: { id: "comp-os-2", timestamp_ms: now - 120_000, tokens_before: 98_000, tokens_after: 35_000, summary: "Compacted: summarized analysis phase, preserved code changes" } });

  // Wiki / DeepWiki
  se({ t: "SET_WIKI_PAGES", pages: [
    { id: "wiki-os-1", title: "Architecture", content: "# Architecture\n\n## FSD Pattern\n\n```\napp → pages → widgets → features → entities → shared\n```\n\n## Key Decisions\n- Jotai for state management\n- Tokyo Night design tokens\n- Tailwind CSS v4", updated_at_ms: now - 300_000, source_turn_id: "turn-seed-1" },
    { id: "wiki-os-2", title: "Authentication", content: "# Auth Module\n\n## JWT Flow\n1. Client sends credentials\n2. Server validates + issues token\n3. Token sent in Authorization header\n\n## Endpoints\n- `POST /auth/login`\n- `POST /auth/register`\n- `POST /auth/refresh`", updated_at_ms: now - 60_000 },
    { id: "wiki-os-3", title: "Testing Strategy", content: "# Testing\n\n- Unit: Vitest + @testing-library/react\n- E2E: Playwright\n- Coverage target: 80%", updated_at_ms: now },
  ] });

  // Live Preview
  se({ t: "SET_PREVIEW_STATE", state: { url: "http://localhost:5173", status: "connected", last_update_ms: now } });

  // Machine Snapshots
  se({ t: "SET_MACHINE_SNAPSHOTS", snapshots: [
    { id: "snap-os-1", label: "Before auth refactor", created_at_ms: now - 600_000, size_mb: 245.2, status: "ready" },
    { id: "snap-os-2", label: "After JWT impl", created_at_ms: now - 60_000, size_mb: 248.7, status: "ready" },
  ] });

  // Scratchpad / Notes
  se({ t: "SET_NOTEPADS", notepads: [
    { id: "np-os-1", title: "Implementation Notes", content: "## JWT Auth\n- bcrypt for password hashing\n- RS256 algorithm\n- 15min access token, 7d refresh\n\n## TODO\n- [ ] Rate limiting\n- [ ] Email verification\n- [x] Token refresh endpoint", updated_at_ms: now - 30_000 },
    { id: "np-os-2", title: "API Design", content: "### Endpoints\n```\nPOST /auth/login     → { access_token, refresh_token }\nPOST /auth/register  → { user, access_token }\nPOST /auth/refresh   → { access_token }\nDELETE /auth/logout  → 204\n```", updated_at_ms: now },
  ] });
}

// ─── Instant seed (no delays) ────────────────────────────────

/** Instantly seed all 14 Coding OS feature panels (no async, no delays) */
export function seedCodingOSPanels() {
  simulateBackgroundAgents();
  simulateIntentTimeline();
  simulateTerminalBridge();
  simulateWorkspaceGraph();
  simulateResourceMonitor();
  simulateTransaction();
  simulateSemanticDiff();
  seedExistingPanels();
  // eslint-disable-next-line no-console
  console.log("[seed]  All 14 Coding OS feature panels seeded");
}

// ─── Animated scenario (with stage delays) ───────────────────

export async function simulateCodingOS() {
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting Coding OS scenario...");

  simulateBackgroundAgents();
  await sleep(STAGE_DELAY / 2);

  simulateIntentTimeline();
  await sleep(STAGE_DELAY / 2);

  simulateTerminalBridge();
  await sleep(STAGE_DELAY / 2);

  simulateWorkspaceGraph();
  await sleep(STAGE_DELAY / 2);

  simulateResourceMonitor();
  await sleep(STAGE_DELAY / 2);

  simulateTransaction();
  await sleep(STAGE_DELAY / 2);

  simulateSemanticDiff();
  await sleep(STAGE_DELAY / 2);

  seedExistingPanels();

  // eslint-disable-next-line no-console
  console.log("[sim]  Coding OS scenario complete — all 14 feature panels seeded");
}
