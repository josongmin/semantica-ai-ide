import type { DocStatus,DriftItem } from "./docDriftAtoms";

// ─── Mock Doc Statuses ──────────────────────────────────────

export const MOCK_DOC_STATUSES: DocStatus[] = [
  {
    path: "docs/rfc/rfc-001-retry.md",
    fileName: "rfc-001-retry.md",
    status: "drifted",
    driftCount: 2,
    lastScanned: Date.now() - 2 * 60_000,
  },
  {
    path: "docs/rfc/rfc-002-auth.md",
    fileName: "rfc-002-auth.md",
    status: "synced",
    driftCount: 0,
    lastScanned: Date.now() - 2 * 60_000,
  },
  {
    path: "docs/rfc/rfc-003-terminal.md",
    fileName: "rfc-003-terminal.md",
    status: "synced",
    driftCount: 0,
    lastScanned: Date.now() - 2 * 60_000,
  },
  {
    path: "docs/rfc/ide-v2/rfc-ide-console-001.md",
    fileName: "rfc-ide-console-001.md",
    status: "new",
    driftCount: 0,
    lastScanned: Date.now() - 2 * 60_000,
  },
  {
    path: "docs/architecture.md",
    fileName: "architecture.md",
    status: "drifted",
    driftCount: 1,
    lastScanned: Date.now() - 2 * 60_000,
  },
];

// ─── Mock Drift Items ───────────────────────────────────────

export const MOCK_DRIFT_ITEMS: DriftItem[] = [
  {
    id: "drift-001",
    docPath: "docs/rfc/rfc-001-retry.md",
    docLine: 5,
    docAssertion: "Max retries: 3",
    codePath: "src/domain/retry/RetryPolicy.ts",
    codeLine: 12,
    codeValue: "RetryPolicy.MAX_RETRIES = 5",
    severity: "mismatch",
    confidence: 0.95,
    autoFixable: true,
  },
  {
    id: "drift-002",
    docPath: "docs/rfc/rfc-001-retry.md",
    docLine: 12,
    docAssertion: "Queue to retry",
    codePath: "src/services/checkout/index.ts",
    codeLine: 142,
    codeValue: "direct call, no queue",
    severity: "mismatch",
    confidence: 0.82,
    autoFixable: false,
  },
  {
    id: "drift-003",
    docPath: "docs/architecture.md",
    docLine: 23,
    docAssertion: "session timeout: 30min",
    codePath: "src/config/session.ts",
    codeLine: 8,
    codeValue: 'config.SESSION_TTL = "1h"',
    severity: "outdated",
    confidence: 0.91,
    autoFixable: true,
  },
];
