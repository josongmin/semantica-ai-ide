/**
 * Mock Semantic Search Data
 *
 * Generates realistic search results for development and demo purposes.
 * Covers retry logic, auth, payments, error handling, DB, API, React patterns, etc.
 */

import type { SearchMode, SemanticSearchGroup, SemanticSearchResult } from "./semanticSearchAtoms";

// ─── Mock Code Entries ──────────────────────────────────────

interface MockEntry {
  readonly symbolName: string;
  readonly filePath: string;
  readonly line: number;
  readonly summary: string;
  readonly category: string;
  readonly keywords: readonly string[];
}

const MOCK_ENTRIES: readonly MockEntry[] = [
  // Core Logic
  {
    symbolName: "RetryPolicy.shouldRetry()",
    filePath: "src/core/retry/RetryPolicy.ts",
    line: 42,
    summary: "Determines whether a failed operation should be retried based on error type, attempt count, and backoff strategy.",
    category: "Core Logic",
    keywords: ["retry", "backoff", "error", "attempt", "policy", "resilience"],
  },
  {
    symbolName: "CircuitBreaker.execute()",
    filePath: "src/core/resilience/CircuitBreaker.ts",
    line: 67,
    summary: "Wraps an async operation with circuit breaker protection. Opens circuit after consecutive failures.",
    category: "Core Logic",
    keywords: ["circuit", "breaker", "fault", "tolerance", "execute", "resilience"],
  },
  {
    symbolName: "EventBus.publish()",
    filePath: "src/core/events/EventBus.ts",
    line: 31,
    summary: "Publishes a typed domain event to all registered subscribers with optional priority ordering.",
    category: "Core Logic",
    keywords: ["event", "publish", "subscribe", "bus", "domain", "message"],
  },
  {
    symbolName: "TaskScheduler.enqueue()",
    filePath: "src/core/scheduler/TaskScheduler.ts",
    line: 89,
    summary: "Enqueues a task with priority and deadline into the work-stealing scheduler pool.",
    category: "Core Logic",
    keywords: ["task", "scheduler", "queue", "priority", "worker", "pool"],
  },

  // Authentication
  {
    symbolName: "AuthService.authenticate()",
    filePath: "src/services/auth/AuthService.ts",
    line: 24,
    summary: "Authenticates user credentials against the identity provider and returns a JWT access token.",
    category: "Authentication",
    keywords: ["auth", "login", "token", "jwt", "authenticate", "credentials", "user"],
  },
  {
    symbolName: "TokenManager.refresh()",
    filePath: "src/services/auth/TokenManager.ts",
    line: 56,
    summary: "Refreshes an expired access token using the stored refresh token with PKCE validation.",
    category: "Authentication",
    keywords: ["token", "refresh", "jwt", "pkce", "expiry", "renew"],
  },
  {
    symbolName: "OAuthProvider.handleCallback()",
    filePath: "src/services/auth/OAuthProvider.ts",
    line: 103,
    summary: "Processes the OAuth2 redirect callback, exchanges authorization code for tokens.",
    category: "Authentication",
    keywords: ["oauth", "callback", "redirect", "authorization", "code", "exchange"],
  },

  // Payment Processing
  {
    symbolName: "PaymentGateway.charge()",
    filePath: "src/services/payment/PaymentGateway.ts",
    line: 38,
    summary: "Initiates a payment charge through the configured gateway with idempotency key support.",
    category: "Payment Processing",
    keywords: ["payment", "charge", "gateway", "stripe", "billing", "transaction"],
  },
  {
    symbolName: "SubscriptionManager.upgrade()",
    filePath: "src/services/payment/SubscriptionManager.ts",
    line: 71,
    summary: "Upgrades a subscription plan with prorated billing and sends confirmation webhook.",
    category: "Payment Processing",
    keywords: ["subscription", "upgrade", "plan", "billing", "prorate", "webhook"],
  },
  {
    symbolName: "InvoiceGenerator.create()",
    filePath: "src/services/payment/InvoiceGenerator.ts",
    line: 15,
    summary: "Generates a PDF invoice from order line items with tax calculation and currency formatting.",
    category: "Payment Processing",
    keywords: ["invoice", "generate", "pdf", "tax", "billing", "order"],
  },

  // Error Handling
  {
    symbolName: "ErrorBoundary.handleError()",
    filePath: "src/shared/errors/ErrorBoundary.tsx",
    line: 19,
    summary: "React error boundary that catches render errors, logs to telemetry, and shows fallback UI.",
    category: "Error Handling",
    keywords: ["error", "boundary", "catch", "fallback", "react", "render"],
  },
  {
    symbolName: "GlobalErrorHandler.capture()",
    filePath: "src/shared/errors/GlobalErrorHandler.ts",
    line: 44,
    summary: "Captures unhandled exceptions and promise rejections, enriches with context, reports to Sentry.",
    category: "Error Handling",
    keywords: ["error", "handler", "exception", "sentry", "capture", "unhandled"],
  },
  {
    symbolName: "ValidationError.fromZod()",
    filePath: "src/shared/errors/ValidationError.ts",
    line: 12,
    summary: "Converts Zod validation errors into user-friendly error messages with field-level detail.",
    category: "Error Handling",
    keywords: ["validation", "error", "zod", "schema", "parse", "field"],
  },

  // Database
  {
    symbolName: "QueryBuilder.where()",
    filePath: "src/data/QueryBuilder.ts",
    line: 88,
    summary: "Appends a type-safe WHERE clause with parameterized values to prevent SQL injection.",
    category: "Database",
    keywords: ["query", "where", "sql", "database", "filter", "builder", "param"],
  },
  {
    symbolName: "ConnectionPool.acquire()",
    filePath: "src/data/ConnectionPool.ts",
    line: 33,
    summary: "Acquires a database connection from the pool with configurable timeout and health check.",
    category: "Database",
    keywords: ["connection", "pool", "database", "acquire", "timeout", "health"],
  },
  {
    symbolName: "MigrationRunner.up()",
    filePath: "src/data/migrations/MigrationRunner.ts",
    line: 52,
    summary: "Runs pending database migrations in order with transaction wrapping and rollback support.",
    category: "Database",
    keywords: ["migration", "database", "schema", "up", "transaction", "rollback"],
  },

  // API Endpoints
  {
    symbolName: "UserRouter.getProfile()",
    filePath: "src/api/routes/UserRouter.ts",
    line: 27,
    summary: "GET /api/users/:id — Returns user profile with role expansion and avatar URL resolution.",
    category: "API Endpoints",
    keywords: ["api", "route", "user", "profile", "get", "endpoint", "rest"],
  },
  {
    symbolName: "WebSocketServer.handleUpgrade()",
    filePath: "src/api/ws/WebSocketServer.ts",
    line: 64,
    summary: "Handles HTTP upgrade to WebSocket with authentication verification and rate limiting.",
    category: "API Endpoints",
    keywords: ["websocket", "upgrade", "realtime", "connection", "ws", "server"],
  },
  {
    symbolName: "RateLimiter.check()",
    filePath: "src/api/middleware/RateLimiter.ts",
    line: 18,
    summary: "Token bucket rate limiter middleware. Returns 429 with Retry-After header when exceeded.",
    category: "API Endpoints",
    keywords: ["rate", "limit", "throttle", "middleware", "429", "bucket"],
  },

  // Middleware
  {
    symbolName: "AuthMiddleware.verify()",
    filePath: "src/api/middleware/AuthMiddleware.ts",
    line: 11,
    summary: "Verifies JWT from Authorization header, attaches decoded user to request context.",
    category: "Middleware",
    keywords: ["middleware", "auth", "verify", "jwt", "header", "request"],
  },
  {
    symbolName: "RequestLogger.log()",
    filePath: "src/api/middleware/RequestLogger.ts",
    line: 8,
    summary: "Structured request/response logger with duration tracking, status codes, and correlation IDs.",
    category: "Middleware",
    keywords: ["logger", "request", "response", "middleware", "correlation", "structured"],
  },

  // React Hooks
  {
    symbolName: "useDebounce()",
    filePath: "src/hooks/useDebounce.ts",
    line: 5,
    summary: "Debounces a value with configurable delay. Returns the debounced value and a flush function.",
    category: "React Hooks",
    keywords: ["debounce", "hook", "delay", "react", "state", "timer"],
  },
  {
    symbolName: "useInfiniteScroll()",
    filePath: "src/hooks/useInfiniteScroll.ts",
    line: 12,
    summary: "Intersection Observer-based infinite scroll hook with loading states and error retry.",
    category: "React Hooks",
    keywords: ["infinite", "scroll", "pagination", "intersection", "observer", "hook"],
  },
  {
    symbolName: "useOptimisticUpdate()",
    filePath: "src/hooks/useOptimisticUpdate.ts",
    line: 22,
    summary: "Applies optimistic UI updates with automatic rollback on server rejection.",
    category: "React Hooks",
    keywords: ["optimistic", "update", "rollback", "mutation", "hook", "ui"],
  },

  // State Management
  {
    symbolName: "createAtomFamily()",
    filePath: "src/state/atomFamily.ts",
    line: 9,
    summary: "Factory for parameterized Jotai atom families with LRU eviction and debug labels.",
    category: "State Management",
    keywords: ["atom", "family", "jotai", "state", "lru", "factory", "parameterized"],
  },
  {
    symbolName: "PersistenceMiddleware.hydrate()",
    filePath: "src/state/PersistenceMiddleware.ts",
    line: 34,
    summary: "Hydrates atom values from IndexedDB on app startup with version migration support.",
    category: "State Management",
    keywords: ["persist", "hydrate", "storage", "indexeddb", "state", "restore"],
  },

  // Configuration
  {
    symbolName: "ConfigLoader.parse()",
    filePath: "src/config/ConfigLoader.ts",
    line: 16,
    summary: "Parses and validates environment configuration using Zod schemas with default fallbacks.",
    category: "Configuration",
    keywords: ["config", "env", "parse", "validate", "zod", "environment", "settings"],
  },
  {
    symbolName: "FeatureFlags.isEnabled()",
    filePath: "src/config/FeatureFlags.ts",
    line: 28,
    summary: "Checks if a feature flag is enabled for the current user with percentage rollout support.",
    category: "Configuration",
    keywords: ["feature", "flag", "toggle", "rollout", "enabled", "experiment"],
  },

  // Logging & Monitoring
  {
    symbolName: "MetricsCollector.histogram()",
    filePath: "src/telemetry/MetricsCollector.ts",
    line: 47,
    summary: "Records a histogram observation for latency tracking with configurable bucket boundaries.",
    category: "Logging & Monitoring",
    keywords: ["metrics", "histogram", "latency", "monitoring", "prometheus", "observe"],
  },
  {
    symbolName: "StructuredLogger.info()",
    filePath: "src/telemetry/StructuredLogger.ts",
    line: 21,
    summary: "Emits a structured JSON log entry with automatic context enrichment and log level filtering.",
    category: "Logging & Monitoring",
    keywords: ["log", "logger", "structured", "json", "info", "context", "telemetry"],
  },

  // Tests
  {
    symbolName: "TestFactory.createUser()",
    filePath: "src/__tests__/factories/TestFactory.ts",
    line: 14,
    summary: "Factory function that creates a test user entity with randomized but deterministic data.",
    category: "Tests",
    keywords: ["test", "factory", "mock", "fixture", "user", "create", "seed"],
  },
];

// ─── Scoring Helpers ────────────────────────────────────────

function computeSemanticScore(query: string, entry: MockEntry): number {
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);

  let totalScore = 0;
  for (const term of terms) {
    let bestMatch = 0;

    // Keyword match (strongest signal)
    for (const kw of entry.keywords) {
      if (kw === term) {
        bestMatch = Math.max(bestMatch, 1.0);
      } else if (kw.startsWith(term)) {
        bestMatch = Math.max(bestMatch, 0.8);
      } else if (kw.includes(term)) {
        bestMatch = Math.max(bestMatch, 0.6);
      }
    }

    // Symbol name match
    const symbolLower = entry.symbolName.toLowerCase();
    if (symbolLower.includes(term)) {
      bestMatch = Math.max(bestMatch, 0.7);
    }

    // Summary match
    if (entry.summary.toLowerCase().includes(term)) {
      bestMatch = Math.max(bestMatch, 0.4);
    }

    totalScore += bestMatch;
  }

  if (terms.length === 0) return 0;

  // Normalize to 0-1 and map to plausible range (0.70-0.98)
  const normalized = totalScore / terms.length;
  return normalized > 0 ? 0.70 + normalized * 0.28 : 0;
}

function computeTextScore(query: string, entry: MockEntry): number {
  const q = query.toLowerCase();
  const symbolLower = entry.symbolName.toLowerCase();
  const pathLower = entry.filePath.toLowerCase();

  if (symbolLower.includes(q)) return 0.95;
  if (pathLower.includes(q)) return 0.85;
  if (entry.summary.toLowerCase().includes(q)) return 0.75;
  return 0;
}

function computeSymbolScore(query: string, entry: MockEntry): number {
  const q = query.toLowerCase();
  const symbolLower = entry.symbolName.toLowerCase();

  // Extract the bare function/method name
  const bareSymbol = symbolLower.replace(/[().]/g, "").split(".").pop() ?? symbolLower;

  if (bareSymbol === q) return 0.98;
  if (bareSymbol.startsWith(q)) return 0.90;
  if (symbolLower.includes(q)) return 0.80;
  return 0;
}

// ─── Public API ─────────────────────────────────────────────

let idCounter = 0;

/**
 * Generates mock semantic search results for a given query and mode.
 * Groups results by category and sorts by match score.
 */
export function generateMockResults(query: string, mode: SearchMode): SemanticSearchGroup[] {
  if (!query.trim()) return [];

  let scoreFn: (query: string, entry: MockEntry) => number;
  if (mode === "semantic") scoreFn = computeSemanticScore;
  else if (mode === "text") scoreFn = computeTextScore;
  else scoreFn = computeSymbolScore;

  const scored: (SemanticSearchResult & { _score: number })[] = [];

  for (const entry of MOCK_ENTRIES) {
    const score = scoreFn(query, entry);
    if (score > 0) {
      scored.push({
        id: `ssr-${++idCounter}`,
        symbolName: entry.symbolName,
        filePath: entry.filePath,
        line: entry.line,
        summary: entry.summary,
        matchScore: Math.round(score * 100) / 100,
        category: entry.category,
        _score: score,
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b._score - a._score);

  // Group by category preserving score order
  const groupMap = new Map<string, SemanticSearchResult[]>();
  // eslint-disable-next-line @typescript-eslint/naming-convention -- destructuring to omit internal _score field
  for (const { _score: _scoreOmit, ...result } of scored) {
    const existing = groupMap.get(result.category);
    if (existing) {
      existing.push(result);
    } else {
      groupMap.set(result.category, [result]);
    }
  }

  return Array.from(groupMap.entries()).map(([category, results]) => ({
    category,
    results,
  }));
}
