/**
 * Impact Radar Mock Data — RFC-SYSTEM-LENS-001 §3.3
 */

import type { ImpactCategory, ImpactDirection, ImpactSeverity } from "~shared/protocol/types";

import type { ChangeEvent, ImpactAnalysisResult, ImpactNode, ImpactSummary } from "./types";

// ─── Helpers ─────────────────────────────────────────────

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(arr: readonly T[], hash: number, index: number): T {
  return arr[(hash + index * 7) % arr.length] as T;
}

// ─── Templates ───────────────────────────────────────────

const NODE_TEMPLATES: Record<ImpactCategory, readonly string[]> = {
  module: [
    "AuthModule",
    "UserModule",
    "PaymentModule",
    "SettingsModule",
    "DashboardModule",
    "NotificationModule",
    "AnalyticsModule",
    "SearchModule",
  ],
  test: [
    "loginFlow.test",
    "authMiddleware.test",
    "paymentCheckout.test",
    "userProfile.test",
    "dashboardRender.test",
    "settingsValidation.test",
    "searchQuery.test",
    "notificationDispatch.test",
  ],
  api: [
    "/api/v2/payments",
    "/api/v2/users",
    "/api/v2/sessions",
    "/api/v2/notifications",
    "/api/v2/settings",
    "/api/v2/search",
    "/api/v2/analytics",
    "/api/v2/dashboard",
  ],
  service: [
    "NotificationService",
    "CacheService",
    "PaymentService",
    "SessionService",
    "AuditLogService",
    "RateLimiterService",
    "EmailService",
    "QueueService",
  ],
  config: [
    "webpack.config",
    "tsconfig.paths",
    "jest.config",
    "eslint.config",
    "env.production",
    "docker-compose",
  ],
  type: [
    "UserDTO",
    "PaymentIntent",
    "SessionToken",
    "ApiResponse<T>",
    "PaginatedResult",
    "ErrorCode",
  ],
};

const FILE_PATHS: Record<ImpactCategory, readonly string[]> = {
  module: [
    "src/modules/auth/index.ts",
    "src/modules/user/index.ts",
    "src/modules/payment/index.ts",
    "src/modules/settings/index.ts",
    "src/modules/dashboard/index.ts",
    "src/modules/notification/index.ts",
    "src/modules/analytics/index.ts",
    "src/modules/search/index.ts",
  ],
  test: [
    "tests/e2e/loginFlow.test.ts",
    "tests/unit/authMiddleware.test.ts",
    "tests/e2e/paymentCheckout.test.ts",
    "tests/unit/userProfile.test.ts",
    "tests/unit/dashboardRender.test.ts",
    "tests/unit/settingsValidation.test.ts",
    "tests/unit/searchQuery.test.ts",
    "tests/unit/notificationDispatch.test.ts",
  ],
  api: [
    "src/routes/payments.ts",
    "src/routes/users.ts",
    "src/routes/sessions.ts",
    "src/routes/notifications.ts",
    "src/routes/settings.ts",
    "src/routes/search.ts",
    "src/routes/analytics.ts",
    "src/routes/dashboard.ts",
  ],
  service: [
    "src/services/NotificationService.ts",
    "src/services/CacheService.ts",
    "src/services/PaymentService.ts",
    "src/services/SessionService.ts",
    "src/services/AuditLogService.ts",
    "src/services/RateLimiterService.ts",
    "src/services/EmailService.ts",
    "src/services/QueueService.ts",
  ],
  config: [
    "webpack.config.js",
    "tsconfig.json",
    "jest.config.ts",
    ".eslintrc.js",
    ".env.production",
    "docker-compose.yml",
  ],
  type: [
    "src/types/user.ts",
    "src/types/payment.ts",
    "src/types/session.ts",
    "src/types/api.ts",
    "src/types/pagination.ts",
    "src/types/errors.ts",
  ],
};

const IMPACT_DESCRIPTIONS: Record<ImpactCategory, string> = {
  module: "Dependent module requires signature update after change to {{symbol}}",
  test: "Test expectations will fail due to modified behavior of {{symbol}}",
  api: "API contract change — consumers must update request/response handling for {{symbol}}",
  service: "Service dependency graph affected — {{symbol}} propagates through service layer",
  config: "Configuration references {{symbol}} — build or runtime behavior may change",
  type: "Type definition depends on {{symbol}} — downstream consumers need recompilation",
};

const SEVERITIES: readonly ImpactSeverity[] = ["breaking", "major", "minor", "cosmetic"];
const DIRECTIONS: readonly ImpactDirection[] = ["direct", "transitive-1", "transitive-2+"];
const CATEGORIES: readonly ImpactCategory[] = ["module", "test", "api", "service", "config", "type"];
const EDGE_KINDS = ["imports", "calls", "extends", "implements", "type-ref", "config-ref"] as const;

// ─── Generator ───────────────────────────────────────────

function generateNodes(change: ChangeEvent, count: number): ImpactNode[] {
  const h = simpleHash(change.symbolName);
  const nodes: ImpactNode[] = [];

  for (let i = 0; i < count; i++) {
    const category = pick(CATEGORIES, h, i);
    const names = NODE_TEMPLATES[category];
    const paths = FILE_PATHS[category];
    const name = pick(names, h, i);
    const filePath = pick(paths, h, i);

    // First two nodes are more severe (breaking / major)
    let severity: ImpactSeverity;
    if (i < 2) {
      severity = i === 0 ? "breaking" : "major";
    } else {
      severity = pick(SEVERITIES, h, i + 3);
    }

    const direction: ImpactDirection = i === 0 ? "direct" : pick(DIRECTIONS, h, i);
    const confidence = Math.round((0.55 + ((h + i * 13) % 40) / 100) * 100) / 100;
    const description = IMPACT_DESCRIPTIONS[category].replace("{{symbol}}", change.symbolName);

    nodes.push({
      id: `impact-${h}-${i}`,
      name,
      category,
      severity,
      direction,
      filePath,
      line: 10 + ((h + i * 17) % 200),
      description,
      confidence,
    });
  }

  return nodes;
}

function computeSummary(nodes: readonly ImpactNode[]): ImpactSummary {
  let breaking = 0;
  let major = 0;
  let minor = 0;
  let testsPredictedFailing = 0;
  let testsPredictedPassing = 0;
  let apisAffected = 0;
  let servicesAffected = 0;

  for (const node of nodes) {
    if (node.severity === "breaking") breaking++;
    if (node.severity === "major") major++;
    if (node.severity === "minor") minor++;
    if (node.category === "test") {
      if (node.severity === "breaking" || node.severity === "major") {
        testsPredictedFailing++;
      } else {
        testsPredictedPassing++;
      }
    }
    if (node.category === "api") apisAffected++;
    if (node.category === "service") servicesAffected++;
  }

  return {
    totalAffected: nodes.length,
    breaking,
    major,
    minor,
    testsPredictedFailing,
    testsPredictedPassing,
    apisAffected,
    servicesAffected,
  };
}

function generateEdges(
  nodes: readonly ImpactNode[],
  hash: number,
): { readonly from: string; readonly to: string; readonly kind: string }[] {
  const edges: { readonly from: string; readonly to: string; readonly kind: string }[] = [];

  for (let i = 1; i < nodes.length; i++) {
    const fromIndex = (hash + i) % i;
    edges.push({
      from: nodes[fromIndex]?.id ?? "",
      to: nodes[i]?.id ?? "",
      kind: pick(EDGE_KINDS, hash, i),
    });
  }

  // Add a few cross-edges for realism
  if (nodes.length > 4 && nodes[2] && nodes[4]) {
    edges.push({
      from: nodes[2].id,
      to: nodes[4].id,
      kind: pick(EDGE_KINDS, hash, 100),
    });
  }
  if (nodes.length > 6 && nodes[1] && nodes[5]) {
    edges.push({
      from: nodes[1].id,
      to: nodes[5].id,
      kind: pick(EDGE_KINDS, hash, 200),
    });
  }

  return edges;
}

export function generateMockImpact(change: ChangeEvent): ImpactAnalysisResult {
  const h = simpleHash(change.symbolName);
  const count = 5 + (h % 11); // 5–15 nodes
  const nodes = generateNodes(change, count);
  const summary = computeSummary(nodes);
  const graphEdges = generateEdges(nodes, h);

  return {
    triggerSymbol: change.symbolName,
    triggerFile: change.filePath,
    triggerLine: change.line,
    timestamp: Date.now(),
    nodes,
    summary,
    graphEdges,
  };
}
