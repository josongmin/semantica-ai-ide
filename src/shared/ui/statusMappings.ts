/**
 * Consolidated status → icon / color / variant mappings.
 *
 * All visual status-mapping tables live here (UI concern).
 * `shared/lib/statusMappings` re-exports the subset that was historically
 * accessed through the lib barrel.
 */

import type { FileChangeStatus, RiskLevel, ValidationGateStatus } from "../protocol";
import { statusBgSubtle, statusColor } from "./tokens";

// ─── Task Status Visual Mappings ─────────────────────────────────

type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

export const STATUS_ICONS: Readonly<Record<TaskStatus, string>> = {
  pending: "circle-outline",
  in_progress: "loading",
  completed: "check",
  failed: "error",
};

export const STATUS_COLORS: Readonly<Record<TaskStatus, string>> = {
  pending: "text-vsc-text-tertiary",
  in_progress: "text-vsc-info",
  completed: "text-vsc-success",
  failed: "text-vsc-error",
};

// ─── Priority Visual Mappings ───────────────────────────────────

type Priority = "high" | "medium" | "low";

export const PRIORITY_VARIANTS: Readonly<Record<Priority, "error" | "warning" | "default">> = {
  high: "error",
  medium: "warning",
  low: "default",
};

// ─── Relative Time Formatting ───────────────────────────────────
// Canonical implementation in shared/lib/formatters.ts
export { formatRelativeTime } from "../lib/formatters";

// ─── Risk Visual Mappings ───────────────────────────────────────

/** Risk-level → text color class (derived from base statusColor tokens) */
export const RISK_TEXT_COLOR: Record<RiskLevel, string> = {
  safe: statusColor.success,
  moderate: statusColor.warning,
  dangerous: statusColor.error,
};

/** Risk-level → background color class (derived from statusBgSubtle tokens) */
export const RISK_BG_COLOR: Record<RiskLevel, string> = {
  safe: statusBgSubtle.success,
  moderate: statusBgSubtle.warning,
  dangerous: statusBgSubtle.error,
};

/** Risk-level → icon color class (same as text color) */
export const RISK_ICON_COLOR = RISK_TEXT_COLOR;

// ─── Validation Gate Mappings ───────────────────────────────────

/** Validation gate status → icon name */
export const GATE_STATUS_ICON: Record<ValidationGateStatus, string> = {
  pending: "circle-outline",
  pass: "pass-filled",
  fail: "error",
  skip: "debug-step-over",
};

/** Validation gate status → color class */
export const GATE_STATUS_COLOR: Record<ValidationGateStatus, string> = {
  pending: "text-vsc-text-tertiary",
  pass: "text-vsc-success",
  fail: "text-vsc-error",
  skip: "text-vsc-text-ghost",
};

// ─── File Change Mappings ───────────────────────────────────────

/** File-change status → codicon name */
export const FILE_CHANGE_STATUS_ICON: Record<FileChangeStatus, string> = {
  added: "new-file",
  modified: "edit",
  deleted: "trash",
  renamed: "file-symlink-file",
};

/** File-change status → text color class (derived from base statusColor tokens) */
export const FILE_CHANGE_STATUS_COLOR: Record<FileChangeStatus, string> = {
  added: statusColor.success,
  modified: statusColor.warning,
  deleted: statusColor.error,
  renamed: statusColor.info,
};
