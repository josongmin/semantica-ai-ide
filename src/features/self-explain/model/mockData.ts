/**
 * Mock Self-Explanation Data
 *
 * Generates realistic self-explanation data for development and demo purposes.
 * Uses a simple hash to deterministically select one of 6+ scenarios.
 */

import type { AnalysisSymbolKind, CommitRef } from "~shared/protocol/types";

import type { SelfExplanation } from "./types";

// ─── Scenario Definitions ───────────────────────────────────

interface Scenario {
  readonly symbolName: string;
  readonly symbolKind: AnalysisSymbolKind;
  readonly purpose: string;
  readonly callerCount: number;
  readonly topCallers: readonly { readonly name: string; readonly filePath: string; readonly line: number }[];
  readonly exposedVia: readonly string[];
  readonly impact: SelfExplanation["impact"];
  readonly history: {
    readonly createdCommit: string;
    readonly createdBy: string;
    readonly createdDaysAgo: number;
    readonly totalChanges: number;
    readonly significantChanges: readonly CommitRef[];
  };
  readonly runtime: SelfExplanation["runtime"];
  readonly whyChain: readonly string[];
}

const SCENARIOS: readonly Scenario[] = [
  {
    symbolName: "validateJwtToken",
    symbolKind: "function",
    purpose: "Validates JWT tokens for authentication middleware, verifying signature integrity and token expiration against the configured issuer.",
    callerCount: 12,
    topCallers: [
      { name: "AuthMiddleware.verify", filePath: "src/api/middleware/AuthMiddleware.ts", line: 34 },
      { name: "WebSocketServer.authenticate", filePath: "src/api/ws/WebSocketServer.ts", line: 78 },
      { name: "RefreshTokenHandler.handle", filePath: "src/services/auth/RefreshTokenHandler.ts", line: 22 },
    ],
    exposedVia: ["REST API", "WebSocket", "internal"],
    impact: { modules: 8, tests: 14, apis: 3, services: 2, riskLevel: "high" },
    history: {
      createdCommit: "a1b2c3d",
      createdBy: "alice",
      createdDaysAgo: 342,
      totalChanges: 18,
      significantChanges: [
        { hash: "f4e5d6c", message: "Add PKCE validation to JWT flow", author: "alice", daysAgo: 45 },
        { hash: "7a8b9c0", message: "Fix token expiry edge case for clock skew", author: "bob", daysAgo: 120 },
      ],
    },
    runtime: { callsPerHour: 24500, avgLatencyMs: 2.1, errorRate: 0.003, lastIncident: "2025-12-14", criticalPath: true },
    whyChain: [
      "Handles JWT validation",
      "\u2190 Required by auth middleware",
      "\u2190 Required by all protected API routes",
      "\u2190 Security compliance requirement",
    ],
  },
  {
    symbolName: "RetryPolicy",
    symbolKind: "class",
    purpose: "Implements configurable retry logic with exponential backoff, jitter, and circuit breaker integration for resilient service calls.",
    callerCount: 7,
    topCallers: [
      { name: "HttpClient.request", filePath: "src/core/http/HttpClient.ts", line: 56 },
      { name: "DatabasePool.query", filePath: "src/data/DatabasePool.ts", line: 41 },
      { name: "MessageQueue.publish", filePath: "src/core/events/MessageQueue.ts", line: 29 },
    ],
    exposedVia: ["internal", "SDK"],
    impact: { modules: 5, tests: 9, apis: 0, services: 4, riskLevel: "medium" },
    history: {
      createdCommit: "b2c3d4e",
      createdBy: "charlie",
      createdDaysAgo: 210,
      totalChanges: 8,
      significantChanges: [
        { hash: "c3d4e5f", message: "Add jitter to exponential backoff", author: "charlie", daysAgo: 60 },
      ],
    },
    runtime: { callsPerHour: 8200, avgLatencyMs: null, errorRate: null, lastIncident: null, criticalPath: false },
    whyChain: [
      "Manages retry logic with backoff",
      "\u2190 Required by all external service calls",
      "\u2190 Prevents cascade failures under load",
      "\u2190 SLA uptime requirement (99.9%)",
    ],
  },
  {
    symbolName: "useSessionContext",
    symbolKind: "hook",
    purpose: "Provides the active session context to React components, including user identity, permissions, and feature flags.",
    callerCount: 15,
    topCallers: [
      { name: "ShellLayout", filePath: "src/app/shell/ShellLayout.tsx", line: 18 },
      { name: "ChatPage", filePath: "src/pages/chat/ChatPage.tsx", line: 12 },
      { name: "SettingsPage", filePath: "src/pages/settings/SettingsPage.tsx", line: 9 },
    ],
    exposedVia: ["internal"],
    impact: { modules: 12, tests: 6, apis: 0, services: 0, riskLevel: "high" },
    history: {
      createdCommit: "d4e5f6a",
      createdBy: "diana",
      createdDaysAgo: 180,
      totalChanges: 11,
      significantChanges: [
        { hash: "e5f6a7b", message: "Add feature flag support to session context", author: "diana", daysAgo: 30 },
        { hash: "f6a7b8c", message: "Memoize permission checks for perf", author: "eve", daysAgo: 90 },
      ],
    },
    runtime: { callsPerHour: 48000, avgLatencyMs: 0.3, errorRate: 0.0, lastIncident: null, criticalPath: true },
    whyChain: [
      "Provides session context to all UI components",
      "\u2190 Required for permission-gated rendering",
      "\u2190 Required by feature flag evaluation",
      "\u2190 Core product personalization requirement",
    ],
  },
  {
    symbolName: "PaymentProcessor.charge",
    symbolKind: "method",
    purpose: "Processes payment charges through Stripe with idempotency key support, fraud detection pre-check, and webhook confirmation.",
    callerCount: 3,
    topCallers: [
      { name: "CheckoutService.complete", filePath: "src/services/checkout/CheckoutService.ts", line: 87 },
      { name: "SubscriptionManager.renew", filePath: "src/services/payment/SubscriptionManager.ts", line: 63 },
      { name: "InvoiceService.collectPayment", filePath: "src/services/billing/InvoiceService.ts", line: 44 },
    ],
    exposedVia: ["REST API", "internal", "webhook"],
    impact: { modules: 4, tests: 11, apis: 2, services: 3, riskLevel: "critical" },
    history: {
      createdCommit: "1a2b3c4",
      createdBy: "frank",
      createdDaysAgo: 400,
      totalChanges: 22,
      significantChanges: [
        { hash: "2b3c4d5", message: "Add fraud detection pre-check", author: "frank", daysAgo: 15 },
        { hash: "3c4d5e6", message: "Migrate to Stripe PaymentIntents API", author: "grace", daysAgo: 95 },
        { hash: "4d5e6f7", message: "Fix idempotency key collision handling", author: "frank", daysAgo: 200 },
      ],
    },
    runtime: { callsPerHour: 1200, avgLatencyMs: 340, errorRate: 0.012, lastIncident: "2026-01-08", criticalPath: true },
    whyChain: [
      "Processes payment charges via Stripe",
      "\u2190 Required by checkout and subscription flows",
      "\u2190 Required for revenue collection",
      "\u2190 Core business monetization requirement",
    ],
  },
  {
    symbolName: "EventBus",
    symbolKind: "class",
    purpose: "Typed publish-subscribe event bus for decoupled inter-module communication with priority ordering and dead-letter tracking.",
    callerCount: 9,
    topCallers: [
      { name: "OrderService.placeOrder", filePath: "src/services/orders/OrderService.ts", line: 55 },
      { name: "NotificationDispatcher.dispatch", filePath: "src/services/notifications/NotificationDispatcher.ts", line: 31 },
      { name: "AuditLogger.record", filePath: "src/telemetry/AuditLogger.ts", line: 18 },
    ],
    exposedVia: ["internal", "SDK"],
    impact: { modules: 11, tests: 7, apis: 0, services: 6, riskLevel: "high" },
    history: {
      createdCommit: "5e6f7a8",
      createdBy: "hank",
      createdDaysAgo: 520,
      totalChanges: 14,
      significantChanges: [
        { hash: "6f7a8b9", message: "Add dead-letter queue for failed handlers", author: "hank", daysAgo: 40 },
        { hash: "7a8b9c0", message: "Implement priority-based dispatch ordering", author: "iris", daysAgo: 150 },
      ],
    },
    runtime: { callsPerHour: 35000, avgLatencyMs: 0.8, errorRate: 0.001, lastIncident: "2025-11-22", criticalPath: false },
    whyChain: [
      "Provides typed pub-sub event dispatch",
      "\u2190 Decouples domain modules from side effects",
      "\u2190 Enables audit logging and notifications without coupling",
      "\u2190 Architectural modularity requirement",
    ],
  },
  {
    symbolName: "MigrationRunner.up",
    symbolKind: "method",
    purpose: "Executes pending database migrations in sequence with transaction wrapping, rollback support, and migration lock acquisition.",
    callerCount: 4,
    topCallers: [
      { name: "AppBootstrap.initialize", filePath: "src/bootstrap/AppBootstrap.ts", line: 42 },
      { name: "TestSetup.beforeAll", filePath: "src/__tests__/setup/TestSetup.ts", line: 15 },
      { name: "MigrateCLI.run", filePath: "src/cli/MigrateCLI.ts", line: 28 },
      { name: "HealthCheck.checkDb", filePath: "src/api/health/HealthCheck.ts", line: 51 },
    ],
    exposedVia: ["CLI", "internal"],
    impact: { modules: 3, tests: 5, apis: 1, services: 1, riskLevel: "critical" },
    history: {
      createdCommit: "8b9c0d1",
      createdBy: "jack",
      createdDaysAgo: 600,
      totalChanges: 9,
      significantChanges: [
        { hash: "9c0d1e2", message: "Add advisory lock to prevent concurrent migrations", author: "jack", daysAgo: 25 },
        { hash: "0d1e2f3", message: "Support down() rollback with dry-run mode", author: "kate", daysAgo: 180 },
      ],
    },
    runtime: { callsPerHour: 2, avgLatencyMs: 1200, errorRate: 0.0, lastIncident: "2025-09-03", criticalPath: false },
    whyChain: [
      "Runs database schema migrations",
      "\u2190 Required at application startup",
      "\u2190 Ensures schema matches code expectations",
      "\u2190 Data integrity and deployment safety requirement",
    ],
  },
  {
    symbolName: "RateLimiter.check",
    symbolKind: "method",
    purpose: "Token bucket rate limiter that enforces per-client request quotas, returning 429 with Retry-After header when limits are exceeded.",
    callerCount: 6,
    topCallers: [
      { name: "ApiGateway.handleRequest", filePath: "src/api/gateway/ApiGateway.ts", line: 33 },
      { name: "WebSocketServer.onMessage", filePath: "src/api/ws/WebSocketServer.ts", line: 91 },
      { name: "WebhookReceiver.process", filePath: "src/api/webhooks/WebhookReceiver.ts", line: 17 },
    ],
    exposedVia: ["REST API", "WebSocket"],
    impact: { modules: 6, tests: 8, apis: 4, services: 1, riskLevel: "medium" },
    history: {
      createdCommit: "e2f3a4b",
      createdBy: "leo",
      createdDaysAgo: 280,
      totalChanges: 6,
      significantChanges: [
        { hash: "f3a4b5c", message: "Switch from fixed window to token bucket algorithm", author: "leo", daysAgo: 55 },
      ],
    },
    runtime: { callsPerHour: 52000, avgLatencyMs: 0.1, errorRate: 0.0, lastIncident: null, criticalPath: true },
    whyChain: [
      "Enforces per-client request rate limits",
      "\u2190 Required by API gateway middleware chain",
      "\u2190 Prevents abuse and resource exhaustion",
      "\u2190 Infrastructure protection and fair usage requirement",
    ],
  },
];

// ─── Hash Helper ────────────────────────────────────────────

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Generates a mock self-explanation for a given symbol location.
 * Deterministically selects a scenario based on a hash of the input parameters.
 */
export function generateMockExplanation(params: {
  symbolId: string;
  filePath: string;
  line: number;
}): SelfExplanation {
  const key = `${params.symbolId}:${params.filePath}:${params.line}`;
  const index = simpleHash(key) % SCENARIOS.length;
  const scenario = SCENARIOS[index];

  if (!scenario) {
    throw new Error(`No scenario found at index ${index}`);
  }

  return {
    symbolId: params.symbolId,
    symbolName: scenario.symbolName,
    symbolKind: scenario.symbolKind,
    filePath: params.filePath,
    line: params.line,
    purpose: scenario.purpose,
    usage: {
      callerCount: scenario.callerCount,
      topCallers: scenario.topCallers,
      exposedVia: scenario.exposedVia,
    },
    impact: scenario.impact,
    history: scenario.history,
    runtime: scenario.runtime,
    whyChain: scenario.whyChain,
  };
}
