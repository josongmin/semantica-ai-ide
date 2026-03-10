/**
 * Root Cause Mock Data — RFC-SYSTEM-LENS-001 §4.3
 */

import type {
  CausalChainEdge,
  CausalChainNode,
  EvidenceItem,
  EvidenceKind,
} from "~shared/protocol/types";

import type { CauseCandidate, RootCauseAnalysis } from "./types";

// ─── Helpers ─────────────────────────────────────────────

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ─── Scenario Definitions ────────────────────────────────

interface CauseScenario {
  readonly symptomPattern: string;
  readonly candidates: readonly CauseCandidate[];
  readonly evidence: readonly EvidenceItem[];
  readonly chain: {
    readonly nodes: readonly CausalChainNode[];
    readonly edges: readonly CausalChainEdge[];
  };
}

const CAUSE_SCENARIOS: readonly CauseScenario[] = [
  // Scenario 0: JWT secret missing
  {
    symptomPattern: "Authentication failure in middleware",
    candidates: [
      {
        id: "cause-jwt-1",
        rank: 1,
        symbolName: "loadJwtSecret",
        filePath: "src/auth/config.ts",
        line: 42,
        confidence: 0.92,
        description:
          "JWT_SECRET environment variable is not set in the deployment config. The loadJwtSecret function falls back to an empty string, causing all token verifications to fail with an invalid signature error.",
        evidenceIds: ["ev-jwt-1", "ev-jwt-2", "ev-jwt-3"],
      },
      {
        id: "cause-jwt-2",
        rank: 2,
        symbolName: "verifyToken",
        filePath: "src/auth/jwt.ts",
        line: 18,
        confidence: 0.78,
        description:
          "The verifyToken function does not validate that the secret is non-empty before calling jwt.verify, allowing silent failures to propagate as generic 401 responses instead of a clear config error.",
        evidenceIds: ["ev-jwt-1", "ev-jwt-4"],
      },
      {
        id: "cause-jwt-3",
        rank: 3,
        symbolName: "authMiddleware",
        filePath: "src/middleware/auth.ts",
        line: 55,
        confidence: 0.55,
        description:
          "The auth middleware catches JsonWebTokenError but treats it identically to an expired token, masking the real cause and making debugging harder.",
        evidenceIds: ["ev-jwt-4", "ev-jwt-5"],
      },
    ],
    evidence: [
      {
        id: "ev-jwt-1",
        kind: "config-change" as EvidenceKind,
        title: "Missing JWT_SECRET in .env.production",
        detail:
          "The environment variable JWT_SECRET was removed in deployment config 3 days ago during a secrets rotation.",
        relevance: 0.95,
        filePath: ".env.production",
        line: 12,
      },
      {
        id: "ev-jwt-2",
        kind: "recent-commit" as EvidenceKind,
        title: "Secrets rotation commit",
        detail:
          "Commit abc1234 rotated API keys but omitted JWT_SECRET from the new config template.",
        relevance: 0.88,
        commitHash: "abc1234",
      },
      {
        id: "ev-jwt-3",
        kind: "call-path" as EvidenceKind,
        title: "Call path: request -> authMiddleware -> verifyToken -> loadJwtSecret",
        detail:
          "Every authenticated request flows through this call path, and loadJwtSecret returns an empty string when the env var is missing.",
        relevance: 0.91,
        filePath: "src/auth/config.ts",
        line: 42,
      },
      {
        id: "ev-jwt-4",
        kind: "stack-trace" as EvidenceKind,
        title: "JsonWebTokenError: invalid signature",
        detail:
          "Stack trace shows jwt.verify throwing due to secret mismatch at auth/jwt.ts:18 -> middleware/auth.ts:55.",
        relevance: 0.85,
        filePath: "src/auth/jwt.ts",
        line: 18,
      },
      {
        id: "ev-jwt-5",
        kind: "runtime-trace" as EvidenceKind,
        title: "401 responses spike after deploy",
        detail:
          "Runtime metrics show a 40x increase in 401 responses starting immediately after the latest deploy.",
        relevance: 0.72,
      },
    ],
    chain: {
      nodes: [
        {
          id: "cn-jwt-1",
          symbolName: "loadJwtSecret",
          filePath: "src/auth/config.ts",
          line: 42,
          role: "root-cause",
          description: "Returns empty string when JWT_SECRET env var is missing",
        },
        {
          id: "cn-jwt-2",
          symbolName: "verifyToken",
          filePath: "src/auth/jwt.ts",
          line: 18,
          role: "propagator",
          description: "Passes empty secret to jwt.verify without validation",
        },
        {
          id: "cn-jwt-3",
          symbolName: "authMiddleware",
          filePath: "src/middleware/auth.ts",
          line: 55,
          role: "symptom",
          description: "Returns 401 for all requests due to signature mismatch",
        },
      ],
      edges: [
        { from: "cn-jwt-1", to: "cn-jwt-2", label: "empty secret passed" },
        { from: "cn-jwt-2", to: "cn-jwt-3", label: "throws JsonWebTokenError" },
      ],
    },
  },

  // Scenario 1: Null pointer in user lookup
  {
    symptomPattern: "TypeError: Cannot read properties of null",
    candidates: [
      {
        id: "cause-null-1",
        rank: 1,
        symbolName: "findUserById",
        filePath: "src/services/userService.ts",
        line: 87,
        confidence: 0.92,
        description:
          "findUserById returns null when the user has been soft-deleted, but the caller assumes a non-null return. The soft-delete flag was added recently without updating downstream consumers.",
        evidenceIds: ["ev-null-1", "ev-null-2", "ev-null-3"],
      },
      {
        id: "cause-null-2",
        rank: 2,
        symbolName: "getUserProfile",
        filePath: "src/controllers/profileController.ts",
        line: 34,
        confidence: 0.78,
        description:
          "getUserProfile destructures the result of findUserById without a null check, causing the TypeError when the user record is missing.",
        evidenceIds: ["ev-null-2", "ev-null-4"],
      },
      {
        id: "cause-null-3",
        rank: 3,
        symbolName: "UserRepository.findOne",
        filePath: "src/repositories/userRepo.ts",
        line: 22,
        confidence: 0.55,
        description:
          "The repository query does not filter out soft-deleted records by default, returning null after the ORM applies the soft-delete scope inconsistently.",
        evidenceIds: ["ev-null-3", "ev-null-5"],
      },
    ],
    evidence: [
      {
        id: "ev-null-1",
        kind: "recent-commit" as EvidenceKind,
        title: "Soft-delete feature added to User model",
        detail:
          "Commit def5678 added a deletedAt column and soft-delete logic, but findUserById was not updated to handle the new null case.",
        relevance: 0.93,
        commitHash: "def5678",
      },
      {
        id: "ev-null-2",
        kind: "call-path" as EvidenceKind,
        title: "Call path: profileController -> userService.findUserById",
        detail:
          "The profile endpoint calls findUserById and immediately accesses .email without null guard.",
        relevance: 0.9,
        filePath: "src/controllers/profileController.ts",
        line: 34,
      },
      {
        id: "ev-null-3",
        kind: "dataflow-path" as EvidenceKind,
        title: "Data flow: DB query -> ORM -> findUserById -> controller",
        detail:
          "Null propagates from the DB layer through the ORM scope filter up to the controller without any intermediate guard.",
        relevance: 0.87,
        filePath: "src/services/userService.ts",
        line: 87,
      },
      {
        id: "ev-null-4",
        kind: "stack-trace" as EvidenceKind,
        title: "TypeError at profileController.ts:34",
        detail:
          "Stack trace: profileController.getUserProfile:34 -> Cannot read properties of null (reading 'email').",
        relevance: 0.82,
        filePath: "src/controllers/profileController.ts",
        line: 34,
      },
      {
        id: "ev-null-5",
        kind: "test-failure" as EvidenceKind,
        title: "Failing test: getUserProfile with deleted user",
        detail:
          "Test 'should handle deleted user gracefully' was added but marked as .skip, never passing in CI.",
        relevance: 0.65,
        filePath: "src/__tests__/profileController.test.ts",
        line: 112,
      },
    ],
    chain: {
      nodes: [
        {
          id: "cn-null-1",
          symbolName: "findUserById",
          filePath: "src/services/userService.ts",
          line: 87,
          role: "root-cause",
          description: "Returns null for soft-deleted users without signaling the change",
        },
        {
          id: "cn-null-2",
          symbolName: "getUserProfile",
          filePath: "src/controllers/profileController.ts",
          line: 34,
          role: "propagator",
          description: "Destructures null result without guard",
        },
        {
          id: "cn-null-3",
          symbolName: "GET /api/profile/:id",
          filePath: "src/routes/profile.ts",
          line: 15,
          role: "symptom",
          description: "Returns 500 Internal Server Error to the client",
        },
      ],
      edges: [
        { from: "cn-null-1", to: "cn-null-2", label: "returns null" },
        { from: "cn-null-2", to: "cn-null-3", label: "throws TypeError" },
      ],
    },
  },

  // Scenario 2: Race condition in session
  {
    symptomPattern: "Session data inconsistency under load",
    candidates: [
      {
        id: "cause-race-1",
        rank: 1,
        symbolName: "refreshSession",
        filePath: "src/session/sessionManager.ts",
        line: 112,
        confidence: 0.92,
        description:
          "refreshSession performs a read-modify-write on the session store without locking. Under concurrent requests, two refreshes can overwrite each other, causing the session to revert to stale data.",
        evidenceIds: ["ev-race-1", "ev-race-2", "ev-race-3"],
      },
      {
        id: "cause-race-2",
        rank: 2,
        symbolName: "SessionStore.set",
        filePath: "src/session/store.ts",
        line: 45,
        confidence: 0.78,
        description:
          "SessionStore.set uses a non-atomic Redis SET without CAS (check-and-set), allowing concurrent writes to silently overwrite each other.",
        evidenceIds: ["ev-race-1", "ev-race-4"],
      },
      {
        id: "cause-race-3",
        rank: 3,
        symbolName: "authMiddleware",
        filePath: "src/middleware/auth.ts",
        line: 30,
        confidence: 0.55,
        description:
          "The auth middleware calls refreshSession on every request instead of using a debounced or conditional refresh, dramatically increasing the window for race conditions.",
        evidenceIds: ["ev-race-3", "ev-race-5"],
      },
    ],
    evidence: [
      {
        id: "ev-race-1",
        kind: "runtime-trace" as EvidenceKind,
        title: "Concurrent Redis WRITE operations on same session key",
        detail:
          "Runtime traces show overlapping SET commands for the same session key within 2ms windows during peak traffic.",
        relevance: 0.94,
      },
      {
        id: "ev-race-2",
        kind: "dataflow-path" as EvidenceKind,
        title: "Data flow: GET session -> modify -> SET session (no lock)",
        detail:
          "The read-modify-write cycle in refreshSession spans ~8ms with no mutex or optimistic concurrency control.",
        relevance: 0.91,
        filePath: "src/session/sessionManager.ts",
        line: 112,
      },
      {
        id: "ev-race-3",
        kind: "call-path" as EvidenceKind,
        title: "Call path: every request -> authMiddleware -> refreshSession",
        detail:
          "Each authenticated request triggers a full session refresh, multiplying the race window by request concurrency.",
        relevance: 0.86,
        filePath: "src/middleware/auth.ts",
        line: 30,
      },
      {
        id: "ev-race-4",
        kind: "recent-commit" as EvidenceKind,
        title: "Redis client upgraded without CAS migration",
        detail:
          "Commit ghi9012 upgraded the Redis client library but did not migrate from SET to SET NX/XX with version checks.",
        relevance: 0.79,
        commitHash: "ghi9012",
      },
      {
        id: "ev-race-5",
        kind: "runtime-trace" as EvidenceKind,
        title: "Session version rollback events",
        detail:
          "Monitoring shows session version counters decreasing 12 times per hour, indicating stale writes winning the race.",
        relevance: 0.7,
      },
    ],
    chain: {
      nodes: [
        {
          id: "cn-race-1",
          symbolName: "refreshSession",
          filePath: "src/session/sessionManager.ts",
          line: 112,
          role: "root-cause",
          description: "Non-atomic read-modify-write on session data",
        },
        {
          id: "cn-race-2",
          symbolName: "SessionStore.set",
          filePath: "src/session/store.ts",
          line: 45,
          role: "propagator",
          description: "Blind SET overwrites concurrent updates",
        },
        {
          id: "cn-race-3",
          symbolName: "getUserSession",
          filePath: "src/session/sessionManager.ts",
          line: 78,
          role: "symptom",
          description: "Returns stale or inconsistent session data to the caller",
        },
      ],
      edges: [
        { from: "cn-race-1", to: "cn-race-2", label: "concurrent write without lock" },
        { from: "cn-race-2", to: "cn-race-3", label: "stale data persisted" },
      ],
    },
  },

  // Scenario 3: SQL injection in query builder
  {
    symptomPattern: "Unexpected query results or DB error",
    candidates: [
      {
        id: "cause-sqli-1",
        rank: 1,
        symbolName: "buildSearchQuery",
        filePath: "src/db/queryBuilder.ts",
        line: 66,
        confidence: 0.92,
        description:
          "buildSearchQuery concatenates user-supplied search terms directly into the SQL WHERE clause using string interpolation instead of parameterized queries, enabling SQL injection.",
        evidenceIds: ["ev-sqli-1", "ev-sqli-2", "ev-sqli-3"],
      },
      {
        id: "cause-sqli-2",
        rank: 2,
        symbolName: "SearchController.search",
        filePath: "src/controllers/searchController.ts",
        line: 28,
        confidence: 0.78,
        description:
          "SearchController.search passes the raw request query parameter to buildSearchQuery without any sanitization or validation, trusting the input implicitly.",
        evidenceIds: ["ev-sqli-2", "ev-sqli-4"],
      },
      {
        id: "cause-sqli-3",
        rank: 3,
        symbolName: "validateSearchInput",
        filePath: "src/validators/searchValidator.ts",
        line: 15,
        confidence: 0.55,
        description:
          "The validateSearchInput function checks string length but does not escape or reject SQL metacharacters, providing a false sense of security.",
        evidenceIds: ["ev-sqli-3", "ev-sqli-5"],
      },
    ],
    evidence: [
      {
        id: "ev-sqli-1",
        kind: "dataflow-path" as EvidenceKind,
        title: "Tainted data flow: req.query.q -> buildSearchQuery -> SQL",
        detail:
          "User input flows from the HTTP query parameter directly into a SQL string template without parameterization.",
        relevance: 0.96,
        filePath: "src/db/queryBuilder.ts",
        line: 66,
      },
      {
        id: "ev-sqli-2",
        kind: "call-path" as EvidenceKind,
        title: "Call path: searchController -> buildSearchQuery -> db.raw",
        detail:
          "The search endpoint calls buildSearchQuery which invokes db.raw with the interpolated string.",
        relevance: 0.89,
        filePath: "src/controllers/searchController.ts",
        line: 28,
      },
      {
        id: "ev-sqli-3",
        kind: "recent-commit" as EvidenceKind,
        title: "Query builder refactored from ORM to raw SQL",
        detail:
          "Commit jkl3456 replaced the ORM-based query with raw SQL for performance, but dropped the automatic parameterization the ORM provided.",
        relevance: 0.88,
        commitHash: "jkl3456",
      },
      {
        id: "ev-sqli-4",
        kind: "stack-trace" as EvidenceKind,
        title: "PG error: syntax error at or near \"DROP\"",
        detail:
          "Database logs show a syntax error triggered by a malformed search query containing SQL keywords.",
        relevance: 0.83,
        filePath: "src/db/queryBuilder.ts",
        line: 66,
      },
      {
        id: "ev-sqli-5",
        kind: "test-failure" as EvidenceKind,
        title: "Failing test: search with special characters",
        detail:
          "Test 'should handle special characters in search query' fails with a SQL syntax error.",
        relevance: 0.68,
        filePath: "src/__tests__/searchController.test.ts",
        line: 45,
      },
    ],
    chain: {
      nodes: [
        {
          id: "cn-sqli-1",
          symbolName: "buildSearchQuery",
          filePath: "src/db/queryBuilder.ts",
          line: 66,
          role: "root-cause",
          description: "String-interpolates user input into raw SQL",
        },
        {
          id: "cn-sqli-2",
          symbolName: "SearchController.search",
          filePath: "src/controllers/searchController.ts",
          line: 28,
          role: "propagator",
          description: "Passes unsanitized input to query builder",
        },
        {
          id: "cn-sqli-3",
          symbolName: "GET /api/search",
          filePath: "src/routes/search.ts",
          line: 8,
          role: "symptom",
          description: "Returns unexpected results or database errors to the client",
        },
      ],
      edges: [
        { from: "cn-sqli-1", to: "cn-sqli-2", label: "raw input interpolated" },
        { from: "cn-sqli-2", to: "cn-sqli-3", label: "malformed SQL executed" },
      ],
    },
  },
];

// ─── Generator ───────────────────────────────────────────

export function generateMockRootCause(
  params: { symptom: string; filePath: string; line: number },
  status: "analyzing" | "complete",
): RootCauseAnalysis {
  const key = `${params.symptom}:${params.filePath}:${params.line}`;
  const idx = simpleHash(key) % CAUSE_SCENARIOS.length;
  const scenario = CAUSE_SCENARIOS[idx];

  const id = `rca-${simpleHash(key).toString(36)}`;

  if (status === "analyzing") {
    return {
      id,
      symptom: params.symptom,
      symptomFile: params.filePath,
      symptomLine: params.line,
      analyzedAt: Date.now(),
      candidates: [],
      evidence: [],
      causalChain: { nodes: [], edges: [] },
      status: "analyzing",
    };
  }

  return {
    id,
    symptom: params.symptom,
    symptomFile: params.filePath,
    symptomLine: params.line,
    analyzedAt: Date.now(),
    candidates: scenario?.candidates ?? [],
    evidence: scenario?.evidence ?? [],
    causalChain: scenario?.chain ?? { nodes: [], edges: [] },
    status: "complete",
  };
}
