/**
 * Intent Engine Mock Data
 *
 * Generates realistic analysis and plan data for development and demo purposes.
 * Covers 6+ intent scenarios with targets, risks, arch concerns, and runtime context.
 */

import type { Intent, IntentAnalysis, IntentPlan, IntentPlanStep } from "./types";

// ─── Helpers ─────────────────────────────────────────────

let stepIdCounter = 0;

function makeStep(
  action: IntentPlanStep["action"],
  description: string,
  targetFile?: string,
  targetLine?: number,
  substeps?: readonly string[],
): IntentPlanStep {
  return {
    id: `step-${++stepIdCounter}`,
    action,
    description,
    targetFile,
    targetLine,
    status: "pending",
    substeps,
  };
}

// ─── Scenario Matchers ──────────────────────────────────

interface ScenarioMatcher {
  readonly keywords: readonly string[];
  readonly analysis: Omit<IntentAnalysis, "intent">;
  readonly plan: Omit<IntentPlan, "intentId">;
}

const SCENARIOS: readonly ScenarioMatcher[] = [
  // 1. Add rate limiting to login API
  {
    keywords: ["rate", "limit", "throttle", "login api"],
    analysis: {
      targets: [
        { name: "AuthController.login", kind: "method", filePath: "src/api/routes/AuthController.ts", line: 34, relevance: 0.95 },
        { name: "RateLimiter", kind: "class", filePath: "src/api/middleware/RateLimiter.ts", line: 1, relevance: 0.88 },
        { name: "RedisClient", kind: "class", filePath: "src/infra/cache/RedisClient.ts", line: 12, relevance: 0.72 },
        { name: "AuthRouter", kind: "module", filePath: "src/api/routes/AuthRouter.ts", line: 1, relevance: 0.65 },
      ],
      affectedScope: { files: 6, modules: 3, tests: 4, apis: 2 },
      risks: [
        { description: "Redis dependency required for distributed rate limiting", severity: "medium", mitigation: "Add in-memory fallback with token bucket when Redis is unavailable" },
        { description: "Existing auth tests may fail with new middleware", severity: "low", mitigation: "Update test fixtures to mock RateLimiter middleware" },
        { description: "Rate limit headers must conform to RFC 6585", severity: "low", mitigation: "Use standardized X-RateLimit-* headers in response" },
      ],
      archConcerns: [
        "Rate limiter should be a reusable middleware, not coupled to AuthController",
        "Consider sliding window vs fixed window algorithm trade-offs",
        "Config values (max requests, window size) should be externalized",
      ],
      runtimeContext: [
        { metric: "Login requests/min", value: "~2,400", relevance: "Determines initial rate limit threshold" },
        { metric: "P99 auth latency", value: "180ms", relevance: "Rate limiter adds ~2ms overhead per check" },
        { metric: "Redis connection pool", value: "12/20 used", relevance: "New rate limiter needs 2-3 additional connections" },
      ],
    },
    plan: {
      steps: [
        makeStep("locate", "Find existing rate limiter middleware and auth routes", "src/api/middleware/RateLimiter.ts", 1, [
          "Scan middleware directory for existing rate limiting",
          "Map auth route handler chain",
        ]),
        makeStep("analyze", "Determine rate limiting strategy and configuration", undefined, undefined, [
          "Evaluate sliding window vs token bucket",
          "Define per-endpoint limits from traffic data",
        ]),
        makeStep("modify", "Implement rate limiter middleware with Redis backend", "src/api/middleware/RateLimiter.ts", 18, [
          "Add sliding window counter using Redis MULTI/EXEC",
          "Implement in-memory fallback",
          "Add standard rate limit response headers",
        ]),
        makeStep("modify", "Wire rate limiter into auth routes", "src/api/routes/AuthRouter.ts", 12),
        makeStep("test", "Add rate limiter unit and integration tests", "src/__tests__/middleware/RateLimiter.test.ts", 1, [
          "Test rate limit enforcement",
          "Test Redis fallback behavior",
          "Test header correctness",
        ]),
        makeStep("verify", "Validate rate limiting under load simulation"),
      ],
      estimatedImpact: { newFiles: 1, modifiedFiles: 3, deletedFiles: 0, testsNeeded: 4 },
    },
  },

  // 2. Fix login bug
  {
    keywords: ["fix", "bug", "login", "auth"],
    analysis: {
      targets: [
        { name: "AuthService.authenticate", kind: "method", filePath: "src/services/auth/AuthService.ts", line: 24, relevance: 0.92 },
        { name: "SessionStore.create", kind: "method", filePath: "src/services/auth/SessionStore.ts", line: 45, relevance: 0.85 },
        { name: "TokenManager.issue", kind: "method", filePath: "src/services/auth/TokenManager.ts", line: 31, relevance: 0.78 },
      ],
      affectedScope: { files: 4, modules: 2, tests: 3, apis: 1 },
      risks: [
        { description: "Session invalidation race condition under concurrent logins", severity: "high", mitigation: "Add optimistic locking on session creation with retry" },
        { description: "Token replay possible if fix changes token structure", severity: "medium", mitigation: "Ensure backward-compatible token format or force re-auth" },
      ],
      archConcerns: [
        "AuthService has grown to 400+ lines -- consider extracting SessionManager",
        "Error codes are not standardized across auth endpoints",
      ],
      runtimeContext: [
        { metric: "Failed logins/hour", value: "~340", relevance: "Indicates scope of the bug impact" },
        { metric: "Session creation P50", value: "45ms", relevance: "Baseline for regression testing" },
      ],
    },
    plan: {
      steps: [
        makeStep("locate", "Reproduce bug with failing test case", "src/services/auth/AuthService.ts", 24),
        makeStep("analyze", "Trace authentication flow for race condition", undefined, undefined, [
          "Check concurrent session creation path",
          "Inspect token issuance timing",
        ]),
        makeStep("modify", "Fix session creation race condition", "src/services/auth/SessionStore.ts", 45, [
          "Add optimistic locking to session create",
          "Implement retry on conflict",
        ]),
        makeStep("test", "Add regression tests for concurrent login", "src/__tests__/auth/AuthService.test.ts", 1),
        makeStep("verify", "Confirm fix with load test at 100 concurrent logins"),
      ],
      estimatedImpact: { newFiles: 0, modifiedFiles: 2, deletedFiles: 0, testsNeeded: 3 },
    },
  },

  // 3. Refactor payment module
  {
    keywords: ["refactor", "payment", "billing", "charge"],
    analysis: {
      targets: [
        { name: "PaymentGateway", kind: "class", filePath: "src/services/payment/PaymentGateway.ts", line: 1, relevance: 0.94 },
        { name: "SubscriptionManager", kind: "class", filePath: "src/services/payment/SubscriptionManager.ts", line: 1, relevance: 0.88 },
        { name: "InvoiceGenerator", kind: "class", filePath: "src/services/payment/InvoiceGenerator.ts", line: 1, relevance: 0.82 },
        { name: "PaymentRouter", kind: "module", filePath: "src/api/routes/PaymentRouter.ts", line: 1, relevance: 0.70 },
        { name: "WebhookHandler", kind: "class", filePath: "src/services/payment/WebhookHandler.ts", line: 1, relevance: 0.65 },
      ],
      affectedScope: { files: 8, modules: 4, tests: 6, apis: 3 },
      risks: [
        { description: "API contract changes may break mobile clients", severity: "high", mitigation: "Version the payment API endpoints and maintain backward compatibility" },
        { description: "Webhook signature verification must not regress", severity: "critical", mitigation: "Add dedicated webhook verification integration test" },
        { description: "Idempotency keys may be invalidated during migration", severity: "medium", mitigation: "Preserve existing idempotency key format in new abstraction" },
      ],
      archConcerns: [
        "PaymentGateway is a 600-line God class -- split into ChargeService, RefundService, WebhookService",
        "Direct Stripe SDK calls are scattered -- introduce PaymentProvider interface",
        "Missing event sourcing for payment state transitions",
      ],
      runtimeContext: [
        { metric: "Payments/day", value: "~12,500", relevance: "Zero-downtime refactor required" },
        { metric: "Webhook processing P95", value: "320ms", relevance: "Refactored handlers should maintain latency" },
        { metric: "Failed charges/week", value: "~180", relevance: "Current retry logic must be preserved" },
      ],
    },
    plan: {
      steps: [
        makeStep("locate", "Map all payment module dependencies", "src/services/payment/", undefined, [
          "Identify all direct Stripe SDK usages",
          "Catalog internal consumers of PaymentGateway",
        ]),
        makeStep("analyze", "Design PaymentProvider abstraction layer", undefined, undefined, [
          "Define ChargeService, RefundService, WebhookService interfaces",
          "Plan migration path for existing callers",
        ]),
        makeStep("modify", "Extract ChargeService from PaymentGateway", "src/services/payment/ChargeService.ts", 1),
        makeStep("modify", "Extract RefundService from PaymentGateway", "src/services/payment/RefundService.ts", 1),
        makeStep("modify", "Extract WebhookService from PaymentGateway", "src/services/payment/WebhookService.ts", 1),
        makeStep("modify", "Update PaymentRouter to use new services", "src/api/routes/PaymentRouter.ts", 1),
        makeStep("test", "Add comprehensive tests for extracted services", "src/__tests__/payment/", 1),
        makeStep("verify", "Run full payment integration test suite"),
      ],
      estimatedImpact: { newFiles: 3, modifiedFiles: 5, deletedFiles: 0, testsNeeded: 6 },
    },
  },

  // 4. Investigate performance regression
  {
    keywords: ["performance", "slow", "regression", "investigate", "latency"],
    analysis: {
      targets: [
        { name: "QueryBuilder.where", kind: "method", filePath: "src/data/QueryBuilder.ts", line: 88, relevance: 0.90 },
        { name: "ConnectionPool.acquire", kind: "method", filePath: "src/data/ConnectionPool.ts", line: 33, relevance: 0.85 },
        { name: "UserRouter.getProfile", kind: "method", filePath: "src/api/routes/UserRouter.ts", line: 27, relevance: 0.72 },
        { name: "MetricsCollector.histogram", kind: "method", filePath: "src/telemetry/MetricsCollector.ts", line: 47, relevance: 0.60 },
      ],
      affectedScope: { files: 5, modules: 3, tests: 2, apis: 4 },
      risks: [
        { description: "Index changes on production DB require migration window", severity: "medium", mitigation: "Use CREATE INDEX CONCURRENTLY for zero-downtime migration" },
        { description: "Connection pool tuning may affect other services", severity: "low", mitigation: "Monitor pool saturation metrics after change" },
      ],
      archConcerns: [
        "QueryBuilder lacks query plan caching -- repeated identical queries reparse",
        "N+1 query pattern detected in UserRouter.getProfile with role expansion",
        "Missing database query logging makes regression hard to trace",
      ],
      runtimeContext: [
        { metric: "API P99 latency", value: "1,240ms (+340%)", relevance: "Primary regression indicator" },
        { metric: "DB query count/request", value: "~14 avg", relevance: "Suggests N+1 pattern" },
        { metric: "Connection pool wait", value: "85ms avg", relevance: "Pool near saturation" },
        { metric: "Slow query count (>500ms)", value: "~420/hr", relevance: "Up from ~30/hr baseline" },
      ],
    },
    plan: {
      steps: [
        makeStep("locate", "Identify top slow queries from metrics", undefined, undefined, [
          "Query application logs for P99 outliers",
          "Correlate with recent deployment changes",
        ]),
        makeStep("analyze", "Profile database query patterns", "src/data/QueryBuilder.ts", 88, [
          "Run EXPLAIN ANALYZE on identified slow queries",
          "Check for missing indexes",
          "Detect N+1 patterns",
        ]),
        makeStep("modify", "Add eager loading to eliminate N+1 queries", "src/api/routes/UserRouter.ts", 27),
        makeStep("modify", "Add query plan caching to QueryBuilder", "src/data/QueryBuilder.ts", 88),
        makeStep("test", "Add performance benchmark tests", "src/__tests__/perf/QueryPerformance.test.ts", 1),
        makeStep("verify", "Validate P99 latency returns to baseline under load"),
      ],
      estimatedImpact: { newFiles: 1, modifiedFiles: 2, deletedFiles: 0, testsNeeded: 2 },
    },
  },

  // 5. Security audit auth flow
  {
    keywords: ["security", "audit", "vulnerability", "auth flow", "xss", "csrf"],
    analysis: {
      targets: [
        { name: "AuthMiddleware.verify", kind: "method", filePath: "src/api/middleware/AuthMiddleware.ts", line: 11, relevance: 0.95 },
        { name: "OAuthProvider.handleCallback", kind: "method", filePath: "src/services/auth/OAuthProvider.ts", line: 103, relevance: 0.92 },
        { name: "TokenManager.refresh", kind: "method", filePath: "src/services/auth/TokenManager.ts", line: 56, relevance: 0.88 },
        { name: "SessionStore.create", kind: "method", filePath: "src/services/auth/SessionStore.ts", line: 45, relevance: 0.80 },
        { name: "AuthService.authenticate", kind: "method", filePath: "src/services/auth/AuthService.ts", line: 24, relevance: 0.75 },
      ],
      affectedScope: { files: 7, modules: 3, tests: 5, apis: 4 },
      risks: [
        { description: "JWT secret rotation requires coordinated deployment", severity: "critical", mitigation: "Implement dual-key validation during rotation window" },
        { description: "OAuth state parameter not validated against CSRF", severity: "high", mitigation: "Add cryptographic state parameter with HMAC verification" },
        { description: "Refresh tokens stored without encryption at rest", severity: "high", mitigation: "Encrypt refresh tokens using AES-256-GCM before storage" },
        { description: "Missing rate limiting on token refresh endpoint", severity: "medium", mitigation: "Add per-user rate limit of 10 refreshes per minute" },
      ],
      archConcerns: [
        "Auth middleware does not validate token audience/issuer claims",
        "CORS configuration allows wildcard origin in non-development mode",
        "Session fixation possible -- session ID not rotated on privilege escalation",
      ],
      runtimeContext: [
        { metric: "Token refresh requests/hr", value: "~8,200", relevance: "High volume target for abuse" },
        { metric: "Failed auth attempts/hr", value: "~1,400", relevance: "Potential brute force indicator" },
        { metric: "Average session duration", value: "4.2 hrs", relevance: "Determines refresh token exposure window" },
      ],
    },
    plan: {
      steps: [
        makeStep("locate", "Catalog all auth-related endpoints and middleware", undefined, undefined, [
          "Map authentication flow from login to session creation",
          "Identify all token validation points",
        ]),
        makeStep("analyze", "Run static security analysis on auth modules", undefined, undefined, [
          "Check JWT validation completeness",
          "Verify CSRF protection on state-changing endpoints",
          "Audit token storage encryption",
        ]),
        makeStep("modify", "Add audience/issuer validation to JWT middleware", "src/api/middleware/AuthMiddleware.ts", 11),
        makeStep("modify", "Encrypt refresh tokens at rest", "src/services/auth/TokenManager.ts", 56),
        makeStep("modify", "Add CSRF state parameter to OAuth flow", "src/services/auth/OAuthProvider.ts", 103),
        makeStep("modify", "Rotate session ID on privilege escalation", "src/services/auth/SessionStore.ts", 45),
        makeStep("test", "Add security-focused test cases", "src/__tests__/security/AuthSecurity.test.ts", 1),
        makeStep("verify", "Run OWASP ZAP scan against auth endpoints"),
      ],
      estimatedImpact: { newFiles: 1, modifiedFiles: 4, deletedFiles: 0, testsNeeded: 5 },
    },
  },

  // 6. Add unit tests for UserService
  {
    keywords: ["test", "unit test", "coverage", "userservice", "user service"],
    analysis: {
      targets: [
        { name: "UserService", kind: "class", filePath: "src/services/user/UserService.ts", line: 1, relevance: 0.96 },
        { name: "UserRepository", kind: "class", filePath: "src/data/repositories/UserRepository.ts", line: 1, relevance: 0.82 },
        { name: "UserValidator", kind: "class", filePath: "src/services/user/UserValidator.ts", line: 1, relevance: 0.75 },
        { name: "TestFactory.createUser", kind: "function", filePath: "src/__tests__/factories/TestFactory.ts", line: 14, relevance: 0.70 },
      ],
      affectedScope: { files: 3, modules: 2, tests: 8, apis: 0 },
      risks: [
        { description: "Mock setup for UserRepository may drift from actual implementation", severity: "low", mitigation: "Use contract tests alongside unit tests to detect drift" },
        { description: "External email service calls in UserService need careful mocking", severity: "low", mitigation: "Extract email notifications behind an interface for easy mocking" },
      ],
      archConcerns: [
        "UserService has 0% test coverage -- high-risk code path",
        "Direct database calls mixed with business logic makes testing difficult",
        "Consider extracting UserNotificationService for better testability",
      ],
      runtimeContext: [
        { metric: "Current test coverage", value: "0%", relevance: "Starting from zero -- all paths need coverage" },
        { metric: "UserService methods", value: "12 public", relevance: "Minimum 12 test cases needed" },
        { metric: "Cyclomatic complexity", value: "8.4 avg", relevance: "Higher complexity needs more edge case tests" },
      ],
    },
    plan: {
      steps: [
        makeStep("locate", "Enumerate all public methods of UserService", "src/services/user/UserService.ts", 1, [
          "List method signatures and return types",
          "Identify external dependencies to mock",
        ]),
        makeStep("analyze", "Determine test strategy and mock boundaries", undefined, undefined, [
          "Map dependency injection points",
          "Identify happy path vs error path test cases",
        ]),
        makeStep("modify", "Create test fixtures and factory helpers", "src/__tests__/factories/UserTestFactory.ts", 1),
        makeStep("modify", "Write unit tests for CRUD operations", "src/__tests__/services/UserService.test.ts", 1, [
          "Test createUser with valid input",
          "Test createUser with duplicate email",
          "Test getUser by ID (found and not found)",
          "Test updateUser with partial data",
          "Test deleteUser with cascade check",
        ]),
        makeStep("modify", "Write unit tests for business logic", "src/__tests__/services/UserService.test.ts", 100, [
          "Test role assignment and validation",
          "Test email verification flow",
          "Test account deactivation rules",
        ]),
        makeStep("test", "Run tests and check coverage report"),
        makeStep("verify", "Ensure coverage exceeds 80% threshold"),
      ],
      estimatedImpact: { newFiles: 2, modifiedFiles: 1, deletedFiles: 0, testsNeeded: 8 },
    },
  },
];

// ─── Default Fallback ───────────────────────────────────

const DEFAULT_ANALYSIS: Omit<IntentAnalysis, "intent"> = {
  targets: [
    { name: "App.entrypoint", kind: "module", filePath: "src/index.ts", line: 1, relevance: 0.60 },
  ],
  affectedScope: { files: 2, modules: 1, tests: 1, apis: 0 },
  risks: [
    { description: "Scope unclear -- intent may need refinement", severity: "low", mitigation: "Clarify intent with specific file or module references" },
  ],
  archConcerns: ["Consider narrowing the intent scope for more precise analysis"],
  runtimeContext: [],
};

const DEFAULT_PLAN: Omit<IntentPlan, "intentId"> = {
  steps: [
    makeStep("locate", "Identify relevant files and modules"),
    makeStep("analyze", "Understand current implementation"),
    makeStep("modify", "Apply changes based on intent"),
    makeStep("test", "Add or update tests"),
    makeStep("verify", "Validate changes work as expected"),
  ],
  estimatedImpact: { newFiles: 0, modifiedFiles: 1, deletedFiles: 0, testsNeeded: 1 },
};

// ─── Scenario Matching ──────────────────────────────────

function findScenario(text: string): ScenarioMatcher | null {
  const lower = text.toLowerCase();
  let bestMatch: ScenarioMatcher | null = null;
  let bestScore = 0;

  for (const scenario of SCENARIOS) {
    let score = 0;
    for (const keyword of scenario.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length; // longer keyword matches are stronger
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = scenario;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// ─── Public API ─────────────────────────────────────────

/**
 * Generates a mock analysis for the given intent.
 * Matches against known scenarios or returns a generic fallback.
 */
export function generateMockAnalysis(intent: Intent): IntentAnalysis {
  const scenario = findScenario(intent.text);
  const data = scenario?.analysis ?? DEFAULT_ANALYSIS;
  return { ...data, intent };
}

/**
 * Generates a mock execution plan for the given intent.
 * Matches against known scenarios or returns a generic fallback.
 */
export function generateMockPlan(intent: Intent): IntentPlan {
  const scenario = findScenario(intent.text);
  const data = scenario?.plan ?? DEFAULT_PLAN;
  return { ...data, intentId: intent.id };
}
