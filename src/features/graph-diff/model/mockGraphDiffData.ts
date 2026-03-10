import type { DiffGraphData } from "./graphDiffAtoms";

/**
 * Realistic mock diff data representing a service-layer auth refactor.
 *
 * The scenario: someone changed `AuthService.login()` to add rate-limiting
 * and changed `JWTService.sign()` return type. The mock shows the blast
 * radius propagating through the call graph.
 */
export const MOCK_GRAPH_DIFF_DATA: DiffGraphData = {
  nodes: [
    {
      id: "auth-controller",
      label: "AuthController",
      filePath: "src/controllers/AuthController.ts",
      line: 24,
      changeType: "affected",
      directCallers: 0,
      transitiveDeps: 5,
    },
    {
      id: "auth-service",
      label: "AuthService",
      filePath: "src/services/AuthService.ts",
      line: 41,
      changeType: "changed",
      changes: [
        "+ added: rateLimit check",
        "~ modified: login() return type",
        "~ modified: error handling flow",
      ],
      directCallers: 2,
      transitiveDeps: 6,
    },
    {
      id: "user-repo",
      label: "UserRepo",
      filePath: "src/repos/UserRepo.ts",
      line: 12,
      changeType: "unchanged",
      directCallers: 3,
      transitiveDeps: 0,
    },
    {
      id: "jwt-service",
      label: "JWTService",
      filePath: "src/services/JWTService.ts",
      line: 8,
      changeType: "changed",
      changes: [
        "~ modified: sign() return type → TokenPair",
        "+ added: refresh token generation",
      ],
      directCallers: 2,
      transitiveDeps: 3,
    },
    {
      id: "audit-log",
      label: "AuditLog",
      filePath: "src/infra/AuditLog.ts",
      line: 5,
      changeType: "affected",
      directCallers: 4,
      transitiveDeps: 0,
    },
    {
      id: "session-manager",
      label: "SessionManager",
      filePath: "src/services/SessionManager.ts",
      line: 19,
      changeType: "affected",
      directCallers: 1,
      transitiveDeps: 2,
    },
    {
      id: "permission-checker",
      label: "PermissionChecker",
      filePath: "src/services/PermissionChecker.ts",
      line: 33,
      changeType: "affected",
      directCallers: 5,
      transitiveDeps: 1,
    },
    {
      id: "rate-limiter",
      label: "RateLimiter",
      filePath: "src/middleware/RateLimiter.ts",
      line: 7,
      changeType: "changed",
      changes: [
        "+ added: sliding window algorithm",
        "+ added: per-user bucket config",
      ],
      directCallers: 1,
      transitiveDeps: 0,
    },
    {
      id: "token-cache",
      label: "TokenCache",
      filePath: "src/infra/TokenCache.ts",
      line: 15,
      changeType: "affected",
      directCallers: 2,
      transitiveDeps: 0,
    },
    {
      id: "config-provider",
      label: "ConfigProvider",
      filePath: "src/config/ConfigProvider.ts",
      line: 3,
      changeType: "unchanged",
      directCallers: 6,
      transitiveDeps: 0,
    },
    {
      id: "email-service",
      label: "EmailService",
      filePath: "src/services/EmailService.ts",
      line: 22,
      changeType: "unchanged",
      directCallers: 2,
      transitiveDeps: 1,
    },
  ],

  edges: [
    { source: "auth-controller", target: "auth-service", changeType: "impacted" },
    { source: "auth-service", target: "user-repo", changeType: "normal" },
    { source: "auth-service", target: "jwt-service", changeType: "impacted" },
    { source: "auth-service", target: "rate-limiter", changeType: "new" },
    { source: "auth-service", target: "audit-log", changeType: "impacted" },
    { source: "jwt-service", target: "token-cache", changeType: "impacted" },
    { source: "jwt-service", target: "config-provider", changeType: "normal" },
    { source: "session-manager", target: "jwt-service", changeType: "impacted" },
    { source: "session-manager", target: "token-cache", changeType: "impacted" },
    { source: "permission-checker", target: "auth-service", changeType: "impacted" },
    { source: "permission-checker", target: "config-provider", changeType: "normal" },
    { source: "auth-controller", target: "session-manager", changeType: "impacted" },
    { source: "auth-service", target: "email-service", changeType: "removed" },
    { source: "rate-limiter", target: "config-provider", changeType: "new" },
  ],

  summary: { changed: 3, affected: 5, total: 11 },
};
