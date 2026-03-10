/**
 * System Lens Mock Data — RFC-SYSTEM-LENS-001
 *
 * Deterministic mock data generators for development and testing.
 */

import type { AnalysisRiskLevel, AnalysisSymbolKind } from "~shared/protocol/types";

import type { ImpactItem, LensBadgeData, LensDetailData } from "./types";

// ─── Utilities ───────────────────────────────────────────

/** Safe modular index access — guaranteed non-null for non-empty arrays */
function at<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length] as T;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Name Arrays ─────────────────────────────────────────

const CALLER_NAMES = [
  "AuthController.login",
  "SessionManager.validate",
  "ApiGateway.routeRequest",
  "PaymentService.charge",
  "UserService.getProfile",
  "NotificationService.send",
  "CacheManager.invalidate",
  "RateLimiter.check",
  "AuditLogger.record",
  "WebhookDispatcher.emit",
  "HealthCheck.probe",
  "MetricsCollector.flush",
] as const;

const CALLEE_NAMES = [
  "db.query",
  "redis.get",
  "redis.set",
  "jwt.verify",
  "jwt.sign",
  "bcrypt.compare",
  "logger.info",
  "metrics.increment",
  "config.get",
  "validator.check",
  "serializer.toJSON",
  "eventBus.publish",
] as const;

const MODULE_NAMES = [
  "auth/middleware",
  "auth/strategies",
  "payment/stripe",
  "payment/invoicing",
  "users/profile",
  "users/permissions",
  "api/gateway",
  "api/versioning",
  "notifications/email",
  "notifications/push",
  "cache/redis",
  "cache/memory",
] as const;

const IMPACT_NAMES = [
  "AuthMiddleware",
  "PaymentProcessor",
  "UserRepository",
  "SessionStore",
  "ApiRateLimiter",
  "NotificationQueue",
  "CacheInvalidator",
  "AuditTrail",
  "WebhookRegistry",
  "ConfigLoader",
  "HealthEndpoint",
  "MetricsPipeline",
  "PermissionGuard",
  "EventReplayService",
] as const;

const COMMIT_MESSAGES = [
  "fix: handle expired token edge case",
  "feat: add retry logic for payment gateway",
  "refactor: extract validation into shared util",
  "perf: cache user permissions lookup",
  "fix: prevent double-submit on charge endpoint",
  "chore: update bcrypt to v5.1",
  "feat: add audit logging for admin actions",
  "fix: race condition in session refresh",
] as const;

const AUTHORS = [
  "alice",
  "bob",
  "carol",
  "dave",
  "eve",
  "frank",
] as const;

const TEST_SUFFIXES = [
  "should authenticate valid credentials",
  "should reject expired tokens",
  "should return 403 for unauthorized",
  "should handle concurrent requests",
  "should validate input schema",
  "should emit audit event",
  "should retry on transient failure",
  "should respect rate limits",
] as const;

// ─── Mock Symbols ────────────────────────────────────────

interface MockSymbolDef {
  readonly name: string;
  readonly kind: AnalysisSymbolKind;
  readonly callerCount: number;
  readonly calleeCount: number;
  readonly impactedModules: number;
  readonly impactedTests: number;
  readonly impactedApis: number;
  readonly callFrequency: number | null;
  readonly avgLatency: number | null;
  readonly changeFrequency: number;
  readonly riskLevel: AnalysisRiskLevel;
}

const MOCK_SYMBOLS: Record<string, MockSymbolDef> = {
  handleLogin: {
    name: "handleLogin",
    kind: "function",
    callerCount: 4,
    calleeCount: 6,
    impactedModules: 3,
    impactedTests: 7,
    impactedApis: 2,
    callFrequency: 1240,
    avgLatency: 82,
    changeFrequency: 14,
    riskLevel: "high",
  },
  validateToken: {
    name: "validateToken",
    kind: "function",
    callerCount: 12,
    calleeCount: 3,
    impactedModules: 5,
    impactedTests: 9,
    impactedApis: 4,
    callFrequency: 8900,
    avgLatency: 12,
    changeFrequency: 6,
    riskLevel: "critical",
  },
  formatDate: {
    name: "formatDate",
    kind: "function",
    callerCount: 18,
    calleeCount: 1,
    impactedModules: 2,
    impactedTests: 3,
    impactedApis: 0,
    callFrequency: 4500,
    avgLatency: 0.3,
    changeFrequency: 2,
    riskLevel: "none",
  },
  AuthService: {
    name: "AuthService",
    kind: "class",
    callerCount: 7,
    calleeCount: 9,
    impactedModules: 6,
    impactedTests: 11,
    impactedApis: 3,
    callFrequency: 3200,
    avgLatency: 45,
    changeFrequency: 18,
    riskLevel: "high",
  },
  useAuth: {
    name: "useAuth",
    kind: "hook",
    callerCount: 9,
    calleeCount: 4,
    impactedModules: 4,
    impactedTests: 5,
    impactedApis: 1,
    callFrequency: 2100,
    avgLatency: 8,
    changeFrequency: 10,
    riskLevel: "medium",
  },
  sanitizeInput: {
    name: "sanitizeInput",
    kind: "function",
    callerCount: 22,
    calleeCount: 2,
    impactedModules: 7,
    impactedTests: 8,
    impactedApis: 5,
    callFrequency: 15000,
    avgLatency: 1.2,
    changeFrequency: 4,
    riskLevel: "medium",
  },
  queryDatabase: {
    name: "queryDatabase",
    kind: "function",
    callerCount: 15,
    calleeCount: 5,
    impactedModules: 8,
    impactedTests: 12,
    impactedApis: 6,
    callFrequency: 6700,
    avgLatency: 35,
    changeFrequency: 8,
    riskLevel: "high",
  },
  UserProfile: {
    name: "UserProfile",
    kind: "interface",
    callerCount: 6,
    calleeCount: 0,
    impactedModules: 3,
    impactedTests: 4,
    impactedApis: 2,
    callFrequency: null,
    avgLatency: null,
    changeFrequency: 5,
    riskLevel: "low",
  },
} as const;

const SYMBOL_KEYS = Object.keys(MOCK_SYMBOLS) as readonly string[];

// ─── Generators ──────────────────────────────────────────

export function generateMockBadges(filePath: string): readonly LensBadgeData[] {
  const h = simpleHash(filePath);
  const count = 3 + (h % 6); // 3–8 badges per file
  const badges: LensBadgeData[] = [];

  for (let i = 0; i < count; i++) {
    const key = at(SYMBOL_KEYS, h + i);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- key is always valid (at wraps index)
    const def = MOCK_SYMBOLS[key]!;
    const line = 10 + i * 18 + (h % 7);

    badges.push({
      symbolId: `${filePath}:${def.name}:${line}`,
      symbolName: def.name,
      symbolKind: def.kind,
      filePath,
      line,
      endLine: line + 8 + (i % 5),
      callerCount: def.callerCount,
      calleeCount: def.calleeCount,
      impactedModules: def.impactedModules,
      impactedTests: def.impactedTests,
      impactedApis: def.impactedApis,
      callFrequency: def.callFrequency,
      avgLatency: def.avgLatency,
      lastModifiedCommit: `a${(h + i).toString(16).slice(0, 6)}f`,
      lastModifiedDaysAgo: 1 + ((h + i) % 30),
      changeFrequency: def.changeFrequency,
      riskLevel: def.riskLevel,
    });
  }

  return badges;
}

export function generateMockDetail(symbolId: string): LensDetailData {
  const h = simpleHash(symbolId);
  const parts = symbolId.split(":");
  const filePath = parts[0] ?? "src/unknown.ts";
  const symbolName = parts[1] ?? "unknown";
  const parsedLine = Number(parts[2]);
  const line = Number.isFinite(parsedLine) && parsedLine > 0 ? parsedLine : 1;

  const key = at(SYMBOL_KEYS, h);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- key is always valid (at wraps index)
  const def = MOCK_SYMBOLS[key]!;

  // Generate callers
  const callerCount = Math.min(def.callerCount, 6);
  const callers = Array.from({ length: callerCount }, (_, i) => {
    const name = at(CALLER_NAMES, h + i);
    const mod = at(MODULE_NAMES, h + i);
    return {
      id: `caller-${i}-${h}`,
      name,
      kind: "function" as const,
      filePath: `src/${mod}.ts`,
      line: 20 + i * 12,
      module: mod,
    };
  });

  // Generate callees
  const calleeCount = Math.min(def.calleeCount, 6);
  const callees = Array.from({ length: calleeCount }, (_, i) => {
    const name = at(CALLEE_NAMES, h + i);
    const mod = at(MODULE_NAMES, h + i + 3);
    return {
      id: `callee-${i}-${h}`,
      name,
      kind: "function" as const,
      filePath: `src/${mod}.ts`,
      line: 35 + i * 8,
      module: mod,
    };
  });

  // Generate impact items
  const impactCount = def.impactedModules + def.impactedTests;
  const impactedItems: ImpactItem[] = Array.from(
    { length: Math.min(impactCount, 8) },
    (_, i) => {
      const name = at(IMPACT_NAMES, h + i);
      const kinds = ["module", "test", "api", "service"] as const;
      return {
        id: `impact-${i}-${h}`,
        name,
        kind: at(kinds, i),
        severity: i < 3 ? ("direct" as const) : ("transitive" as const),
        filePath: `src/${at(MODULE_NAMES, h + i + 1)}.ts`,
        line: 15 + i * 10,
      };
    },
  );

  // Generate dataflow edges
  const dataflowIn = Array.from({ length: 2 + (h % 3) }, (_, i) => ({
    fromSymbol: at(CALLER_NAMES, h + i + 2),
    toSymbol: symbolName,
    transformations: ["validate", "parse", "normalize"].slice(0, 1 + (i % 3)),
    taintLabel: i === 0 ? ("user-input" as const) : undefined,
  }));

  const dataflowOut = Array.from({ length: 1 + (h % 3) }, (_, i) => ({
    fromSymbol: symbolName,
    toSymbol: at(CALLEE_NAMES, h + i + 4),
    transformations: ["serialize", "encrypt", "compress"].slice(0, 1 + (i % 2)),
    taintLabel: i === 0 ? ("db-result" as const) : undefined,
  }));

  // Generate recent commits
  const recentCommits = Array.from({ length: 3 + (h % 4) }, (_, i) => ({
    hash: (h + i * 7).toString(16).padStart(7, "0"),
    message: at(COMMIT_MESSAGES, h + i),
    author: at(AUTHORS, h + i),
    daysAgo: 1 + i * 3 + (h % 5),
  }));

  // Generate related tests
  const relatedTests = Array.from({ length: 2 + (h % 4) }, (_, i) => ({
    id: `test-${i}-${h}`,
    name: `${symbolName} ${at(TEST_SUFFIXES, h + i)}`,
    filePath: `src/__tests__/${symbolName}.test.ts`,
    status: (i <= 1 ? "pass" : "fail") as
      | "pass"
      | "fail"
      | "skip",
    lastRun: Date.now() - (1 + i) * 3600_000,
  }));

  return {
    symbolId,
    symbolName,
    symbolKind: def.kind,
    filePath,
    line,
    endLine: line + 12,
    callerCount: def.callerCount,
    calleeCount: def.calleeCount,
    impactedModules: def.impactedModules,
    impactedTests: def.impactedTests,
    impactedApis: def.impactedApis,
    callFrequency: def.callFrequency,
    avgLatency: def.avgLatency,
    lastModifiedCommit: recentCommits[0]?.hash ?? null,
    lastModifiedDaysAgo: recentCommits[0]?.daysAgo ?? null,
    changeFrequency: def.changeFrequency,
    riskLevel: def.riskLevel,
    callers,
    callees,
    impactedItems,
    dataflowIn,
    dataflowOut,
    recentCommits,
    relatedTests,
  };
}
