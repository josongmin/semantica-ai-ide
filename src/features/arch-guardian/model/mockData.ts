/**
 * Architecture Guardian Mock Data — RFC-SYSTEM-LENS-001 §5
 *
 * Realistic mock violations, layers, and rules for development.
 */

import type { ArchAnalysis, ArchLayer, ArchRule, ArchViolationItem } from "./types";

// ─── Mock Layers ────────────────────────────────────────

export const MOCK_LAYERS: readonly ArchLayer[] = [
  {
    id: "layer-presentation",
    name: "Presentation",
    modules: ["controllers", "routes", "middleware"],
    allowedDependencies: ["layer-business", "layer-shared"],
    color: "#3b82f6", // blue
  },
  {
    id: "layer-business",
    name: "Business",
    modules: ["services", "useCases", "validators"],
    allowedDependencies: ["layer-data", "layer-shared"],
    color: "#22c55e", // green
  },
  {
    id: "layer-data",
    name: "Data",
    modules: ["repositories", "models", "migrations"],
    allowedDependencies: ["layer-shared"],
    color: "#f97316", // orange
  },
  {
    id: "layer-shared",
    name: "Shared",
    modules: ["utils", "config", "types"],
    allowedDependencies: [],
    color: "#6b7280", // gray
  },
];

// ─── Mock Rules ─────────────────────────────────────────

export const MOCK_RULES: readonly ArchRule[] = [
  {
    id: "no-layer-skip",
    name: "No Layer Skip",
    description: "Presentation cannot import Data directly — must go through Business layer",
    kind: "layer-skip",
    enabled: true,
  },
  {
    id: "no-circular-deps",
    name: "No Circular Dependencies",
    description: "No circular module dependencies allowed",
    kind: "circular-dependency",
    enabled: true,
  },
  {
    id: "no-feature-coupling",
    name: "No Feature Coupling",
    description: "Features cannot import other features' internal modules",
    kind: "forbidden-import",
    enabled: true,
  },
  {
    id: "no-shared-bypass",
    name: "No Shared Bypass",
    description: "Must use barrel exports from shared modules — no deep imports",
    kind: "coupling-threshold",
    enabled: true,
  },
];

// ─── Mock Violations ────────────────────────────────────

export const MOCK_VIOLATIONS: readonly ArchViolationItem[] = [
  {
    id: "v-001",
    ruleId: "no-layer-skip",
    ruleName: "No Layer Skip",
    kind: "layer-skip",
    filePath: "src/api/UserController.ts",
    line: 8,
    column: 1,
    sourceModule: "controllers",
    targetModule: "repositories",
    message: "Presentation → Data: Direct import of UserRepository bypasses Service layer",
    severity: "error",
    autoFixable: true,
    suggestedFix: "Import from UserService instead of UserRepository",
  },
  {
    id: "v-002",
    ruleId: "no-layer-skip",
    ruleName: "No Layer Skip",
    kind: "layer-skip",
    filePath: "src/api/OrderController.ts",
    line: 5,
    column: 1,
    sourceModule: "controllers",
    targetModule: "models",
    message: "Presentation → Data: Direct import of OrderModel bypasses Service layer",
    severity: "error",
    autoFixable: true,
    suggestedFix: "Use OrderService.getOrder() instead of direct model access",
  },
  {
    id: "v-003",
    ruleId: "no-circular-deps",
    ruleName: "No Circular Dependencies",
    kind: "circular-dependency",
    filePath: "src/services/AuthService.ts",
    line: 3,
    column: 1,
    sourceModule: "services",
    targetModule: "services",
    message: "Cycle: AuthService → UserService → PermissionService → AuthService",
    severity: "warning",
    autoFixable: false,
    suggestedFix: "Extract shared IAuthContext interface to break the cycle",
  },
  {
    id: "v-004",
    ruleId: "no-circular-deps",
    ruleName: "No Circular Dependencies",
    kind: "circular-dependency",
    filePath: "src/services/NotificationService.ts",
    line: 7,
    column: 1,
    sourceModule: "services",
    targetModule: "services",
    message: "Cycle: NotificationService → EventBus → NotificationService",
    severity: "warning",
    autoFixable: false,
    suggestedFix: "Use dependency injection to decouple EventBus from NotificationService",
  },
  {
    id: "v-005",
    ruleId: "no-feature-coupling",
    ruleName: "No Feature Coupling",
    kind: "forbidden-import",
    filePath: "src/features/payment/PaymentService.ts",
    line: 12,
    column: 1,
    sourceModule: "features/payment",
    targetModule: "features/auth",
    message: "Feature coupling: Imports internal atom currentUserAtom from auth feature",
    severity: "warning",
    autoFixable: true,
    suggestedFix: "Use auth barrel export: import { currentUser } from '~features/auth'",
  },
  {
    id: "v-006",
    ruleId: "no-feature-coupling",
    ruleName: "No Feature Coupling",
    kind: "forbidden-import",
    filePath: "src/features/dashboard/DashboardMetrics.ts",
    line: 4,
    column: 1,
    sourceModule: "features/dashboard",
    targetModule: "features/analytics",
    message: "Feature coupling: Imports internal helper formatMetric from analytics feature",
    severity: "info",
    autoFixable: true,
    suggestedFix: "Move formatMetric to shared/utils or use analytics barrel export",
  },
  {
    id: "v-007",
    ruleId: "no-shared-bypass",
    ruleName: "No Shared Bypass",
    kind: "coupling-threshold",
    filePath: "src/widgets/user-card/UserCard.tsx",
    line: 2,
    column: 1,
    sourceModule: "widgets",
    targetModule: "entities/user",
    message: "Deep import: Imports from entities/user/model/internal instead of barrel",
    severity: "warning",
    autoFixable: true,
    suggestedFix: "Use barrel: import { UserAvatar } from '~entities/user'",
  },
  {
    id: "v-008",
    ruleId: "no-shared-bypass",
    ruleName: "No Shared Bypass",
    kind: "coupling-threshold",
    filePath: "src/pages/settings/AdvancedSettings.tsx",
    line: 9,
    column: 1,
    sourceModule: "pages",
    targetModule: "shared/lib",
    message: "Deep import: Imports from shared/lib/atoms/internal/debugAtoms",
    severity: "info",
    autoFixable: true,
    suggestedFix: "Use barrel: import { debugEnabled } from '~shared/lib'",
  },
];

// ─── Generator ──────────────────────────────────────────

export function generateMockAnalysis(): ArchAnalysis {
  return {
    violations: MOCK_VIOLATIONS,
    layers: MOCK_LAYERS,
    totalModules: 47,
    healthScore: 72,
    lastScanned: Date.now(),
  };
}

export function generateMockRules(): readonly ArchRule[] {
  return MOCK_RULES;
}
