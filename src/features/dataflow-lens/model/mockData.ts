/**
 * Dataflow Lens Mock Data — RFC-SYSTEM-LENS-001 §4
 *
 * Deterministic mock data generators for development and testing.
 * Uses a simple hash on symbolId to pick scenarios.
 */

import type { TaintLabel } from "~shared/protocol/types";

import type { DataflowAnalysis, DataflowNode, DataflowPath } from "./types";

// ─── Hash utility ────────────────────────────────────────

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Node factory ────────────────────────────────────────

let nodeCounter = 0;

function node(
  symbolName: string,
  role: DataflowNode["role"],
  filePath: string,
  line: number,
  description: string,
  taintLabel?: TaintLabel,
): DataflowNode {
  return {
    id: `dfn-${++nodeCounter}`,
    symbolName,
    filePath,
    line,
    role,
    taintLabel,
    description,
  };
}

// ─── Scenario Definitions ────────────────────────────────

interface Scenario {
  readonly inbound: readonly DataflowPath[];
  readonly outbound: readonly DataflowPath[];
  readonly securityNotes: readonly string[];
}

function makeUserInputScenario(): Scenario {
  nodeCounter = 100;
  return {
    inbound: [
      {
        id: "path-user-input-safe",
        label: "User input (sanitized)",
        isTainted: true,
        hasSanitizer: true,
        riskLevel: "safe",
        nodes: [
          node("request.body", "source", "src/api/controller.ts", 24, "Raw user input from POST body", "user-input"),
          node("validate()", "transform", "src/validation/schema.ts", 18, "Schema validation — rejects malformed input"),
          node("sanitize()", "transform", "src/validation/sanitize.ts", 42, "Sanitizer — strips dangerous characters"),
          node("db.query()", "sink", "src/db/repository.ts", 67, "Parameterized database query"),
        ],
      },
    ],
    outbound: [
      {
        id: "path-user-output",
        label: "Response output",
        isTainted: false,
        hasSanitizer: false,
        riskLevel: "safe",
        nodes: [
          node("dbResult", "source", "src/db/repository.ts", 70, "Query result from database", "db-result"),
          node("transform()", "transform", "src/api/transform.ts", 15, "Shape data for API response"),
          node("serialize()", "transform", "src/api/serializer.ts", 33, "JSON serialization with schema"),
          node("response.json()", "sink", "src/api/controller.ts", 48, "HTTP response sent to client"),
        ],
      },
    ],
    securityNotes: ["All user input paths have sanitizers. No issues detected."],
  };
}

function makeAuthTokenScenario(): Scenario {
  nodeCounter = 200;
  return {
    inbound: [
      {
        id: "path-auth-token",
        label: "Auth token verification",
        isTainted: true,
        hasSanitizer: true,
        riskLevel: "safe",
        nodes: [
          node("request.headers.auth", "source", "src/middleware/auth.ts", 12, "Authorization header from request", "user-input"),
          node("jwt.verify()", "transform", "src/auth/jwt.ts", 28, "JWT signature verification and decode"),
          node("user.id", "transform", "src/auth/jwt.ts", 35, "Extract user ID from verified payload"),
          node("authorize()", "sink", "src/auth/rbac.ts", 44, "Role-based authorization check"),
        ],
      },
    ],
    outbound: [
      {
        id: "path-auth-session",
        label: "Session propagation",
        isTainted: false,
        hasSanitizer: false,
        riskLevel: "safe",
        nodes: [
          node("verifiedUser", "source", "src/auth/rbac.ts", 50, "Authenticated user context", "db-result"),
          node("enrichContext()", "transform", "src/middleware/context.ts", 18, "Attach user metadata to request context"),
          node("req.context.user", "sink", "src/middleware/context.ts", 25, "Request context consumed downstream"),
        ],
      },
    ],
    securityNotes: ["JWT verification present. Auth flow is secure."],
  };
}

function makeConfigFlowScenario(): Scenario {
  nodeCounter = 300;
  return {
    inbound: [
      {
        id: "path-config-db",
        label: "Database config",
        isTainted: false,
        hasSanitizer: false,
        riskLevel: "safe",
        nodes: [
          node("env.DATABASE_URL", "source", "src/config/env.ts", 8, "Environment variable — database connection string", "config"),
          node("parseConnectionString()", "transform", "src/config/parser.ts", 22, "Parse and validate connection parameters"),
          node("pool.connect()", "sink", "src/db/pool.ts", 15, "Establish database connection pool"),
        ],
      },
      {
        id: "path-config-cache",
        label: "Cache config",
        isTainted: false,
        hasSanitizer: false,
        riskLevel: "safe",
        nodes: [
          node("env.REDIS_URL", "source", "src/config/env.ts", 10, "Environment variable — Redis connection", "config"),
          node("parseRedisConfig()", "transform", "src/config/parser.ts", 38, "Parse Redis connection options"),
          node("redis.connect()", "sink", "src/cache/redis.ts", 12, "Establish Redis connection"),
        ],
      },
    ],
    outbound: [],
    securityNotes: ["Config values from trusted environment. No taint propagation."],
  };
}

function makeUnsafeFlowScenario(): Scenario {
  nodeCounter = 400;
  return {
    inbound: [
      {
        id: "path-unsafe-sql",
        label: "UNSAFE: Unsanitized query param",
        isTainted: true,
        hasSanitizer: false,
        riskLevel: "danger",
        nodes: [
          node("request.query.id", "source", "src/api/legacy.ts", 14, "Raw query parameter — user-controlled!", "user-input"),
          node("db.rawQuery()", "sink", "src/db/legacy.ts", 33, "String-interpolated SQL query — NO parameterization"),
        ],
      },
      {
        id: "path-safe-input",
        label: "Validated input",
        isTainted: true,
        hasSanitizer: true,
        riskLevel: "safe",
        nodes: [
          node("request.body.name", "source", "src/api/users.ts", 20, "User name from request body", "user-input"),
          node("validator.string()", "transform", "src/validation/validators.ts", 11, "String type and length validation"),
          node("db.users.update()", "sink", "src/db/users.ts", 45, "Parameterized ORM update"),
        ],
      },
    ],
    outbound: [
      {
        id: "path-unsafe-log",
        label: "Log output",
        isTainted: false,
        hasSanitizer: false,
        riskLevel: "caution",
        nodes: [
          node("queryResult", "source", "src/db/legacy.ts", 36, "Unvalidated query result", "db-result"),
          node("logger.info()", "sink", "src/logging/logger.ts", 22, "Logs may contain sensitive data"),
        ],
      },
    ],
    securityNotes: [
      "DANGER: 1 unsafe path detected — SQL injection risk via db.rawQuery()",
      "Recommendation: Replace string interpolation with parameterized queries",
      "Log output may contain sensitive user data — consider redaction",
    ],
  };
}

function makeOutputFlowScenario(): Scenario {
  nodeCounter = 500;
  return {
    inbound: [
      {
        id: "path-db-fetch",
        label: "Database fetch",
        isTainted: false,
        hasSanitizer: false,
        riskLevel: "safe",
        nodes: [
          node("db.users.findById()", "source", "src/db/users.ts", 28, "Parameterized user lookup", "db-result"),
          node("stripSensitiveFields()", "transform", "src/api/transform.ts", 42, "Remove password hash, internal IDs"),
          node("formatResponse()", "transform", "src/api/transform.ts", 58, "Apply API response schema"),
        ],
      },
    ],
    outbound: [
      {
        id: "path-api-response",
        label: "API response",
        isTainted: false,
        hasSanitizer: false,
        riskLevel: "safe",
        nodes: [
          node("formattedUser", "source", "src/api/transform.ts", 62, "Sanitized user object"),
          node("serialize()", "transform", "src/api/serializer.ts", 10, "JSON serialization"),
          node("response.json()", "sink", "src/api/controller.ts", 88, "HTTP 200 response"),
        ],
      },
      {
        id: "path-cache-write",
        label: "Cache write",
        isTainted: false,
        hasSanitizer: false,
        riskLevel: "safe",
        nodes: [
          node("formattedUser", "source", "src/api/transform.ts", 62, "Sanitized user object"),
          node("redis.setex()", "sink", "src/cache/redis.ts", 30, "Cache with TTL"),
        ],
      },
    ],
    securityNotes: ["Sensitive fields stripped before output. All paths clean."],
  };
}

// ─── Scenario Registry ───────────────────────────────────

const SCENARIOS = [
  makeUserInputScenario,
  makeAuthTokenScenario,
  makeConfigFlowScenario,
  makeUnsafeFlowScenario,
  makeOutputFlowScenario,
] as const;

// ─── Generator ───────────────────────────────────────────

export function generateMockDataflow(
  symbolId: string,
  symbolName: string,
  filePath: string,
  line: number,
): DataflowAnalysis {
  const h = simpleHash(symbolId);
  const scenarioIndex = h % SCENARIOS.length;
  const scenarioFactory = SCENARIOS[scenarioIndex];
  if (!scenarioFactory) {
    throw new Error(`Invalid scenario index: ${String(scenarioIndex)}`);
  }
  const scenario = scenarioFactory();

  return {
    symbolId,
    symbolName,
    filePath,
    line,
    inbound: scenario.inbound,
    outbound: scenario.outbound,
    securityNotes: scenario.securityNotes,
  };
}
