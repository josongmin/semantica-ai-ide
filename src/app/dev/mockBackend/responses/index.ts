/**
 * Response Pool — barrel export
 *
 * Aggregates all domain-specific response pools and re-exports the
 * public API (classifyIntent, pickResponse, toProtoClassification, toProtoRiskLevel).
 */

// ── Re-export types ──────────────────────────────────────────
export type {
  Classification,
  FileChangeEntry,
  MockChangeSize,
  MockIntentType,
  MockRiskLevel,
  ResponseEntry,
  ToolCallEntry,
  Uncertainty,
} from "./types";

// ── Re-export classification ─────────────────────────────────
export { classifyIntent } from "./classification";

// ── Re-export protocol mapping ───────────────────────────────
export { toProtoClassification, toProtoRiskLevel } from "./protocolMapping";

// ── Aggregate response pools ─────────────────────────────────
import { classifyIntent } from "./classification";
import { perfResponses,refactorResponses, secResponses } from "./codeChangeResponses";
import { diagResponses, fixResponses } from "./diagFixResponses";
import { infoResponses, locateResponses } from "./infoResponses";
import { migrateResponses,specResponses } from "./specMigrateResponses";
import type { MockIntentType, ResponseEntry } from "./types";

const responses: Record<MockIntentType, ResponseEntry[]> = {
  Q_INFO: infoResponses,
  Q_LOCATE: locateResponses,
  Q_DIAG: diagResponses,
  Q_FIX: fixResponses,
  Q_REFACTOR: refactorResponses,
  Q_SEC: secResponses,
  Q_PERF: perfResponses,
  Q_SPEC: specResponses,
  Q_MIGRATE: migrateResponses,
};

// ── Public API ────────────────────────────────────────────────

/** Pick a response based on intent classification of user input */
export function pickResponse(userText: string): ResponseEntry {
  const { intent } = classifyIntent(userText);
  const pool = responses[intent];
  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (picked === undefined) throw new Error(`Empty response pool for intent: ${intent}`);
  return picked;
}
