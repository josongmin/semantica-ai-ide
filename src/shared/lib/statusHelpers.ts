/**
 * Centralized status type-guard helpers and visual lookup tables
 * for TurnStatus, SessionStatus, and AgentInstanceStatus.
 *
 * Replaces hardcoded `.status === "running"` comparisons across widgets.
 */

import type { AgentInstanceStatus, SessionStatus, TurnStatus } from "../protocol";

// ─── Type guard helpers ──────────────────────────────────────

export function isRunning(status: TurnStatus | SessionStatus | AgentInstanceStatus): boolean {
  return status === "running";
}

export function isError(status: TurnStatus | SessionStatus | AgentInstanceStatus): boolean {
  return status === "error";
}

export function isSuccess(status: TurnStatus | AgentInstanceStatus): boolean {
  return status === "success";
}

export function isCompleted(status: SessionStatus): boolean {
  return status === "completed";
}

// ─── Style lookup tables ─────────────────────────────────────

/** TurnStatus → codicon name */
export const STATUS_ICON: Readonly<Record<TurnStatus, string>> = {
  pending: "circle-outline",
  running: "loading~spin",
  success: "check",
  error: "error",
  paused: "debug-pause",
};

/** TurnStatus → Tailwind text-color class */
export const STATUS_COLOR: Readonly<Record<TurnStatus, string>> = {
  pending: "text-vsc-text-ghost",
  running: "text-vsc-info",
  success: "text-vsc-success",
  error: "text-vsc-error",
  paused: "text-vsc-warning",
};
