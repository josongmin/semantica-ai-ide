/**
 * Lightweight runtime validators for adapter boundary data (DIP compliance).
 *
 * All data crossing the transport boundary arrives as `unknown`. These guards
 * ensure type safety at runtime without adding heavy dependencies like zod.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

// ── Capability data ─────────────────────────────────────────

export function validateCapabilities(data: unknown): string[] {
  if (isStringArray(data)) return data;
  throw new TypeError(`[Kernel] Expected string[] for capabilities, got ${typeof data}`);
}

// ── Verdict data ────────────────────────────────────────────

export interface VerdictPayload {
  readonly patchId: string;
  readonly result: unknown;
}

export function validateVerdict(data: unknown): VerdictPayload {
  if (isRecord(data) && typeof data.patchId === "string") {
    return data as VerdictPayload;
  }
  throw new TypeError(`[Kernel] Invalid verdict payload: missing patchId`);
}

// ── Capability check result ─────────────────────────────────

export interface CapabilityCheckResult {
  readonly allowed: boolean;
}

export function validateCapabilityCheck(data: unknown): CapabilityCheckResult {
  if (isRecord(data) && typeof data.allowed === "boolean") {
    return data as CapabilityCheckResult;
  }
  throw new TypeError(`[Kernel] Invalid capability check result: missing 'allowed' boolean`);
}

// ── Policy result ───────────────────────────────────────────

export interface ValidatedPolicyResult {
  readonly outcome: string;
  readonly reason: string;
  readonly approvalRequired: boolean;
}

export function validatePolicyResult(data: unknown): ValidatedPolicyResult {
  if (
    isRecord(data) &&
    typeof data.outcome === "string" &&
    typeof data.reason === "string" &&
    typeof data.approvalRequired === "boolean"
  ) {
    return data as ValidatedPolicyResult;
  }
  throw new TypeError(`[Kernel] Invalid policy result: missing outcome/reason/approvalRequired`);
}

// ── Domain event ────────────────────────────────────────────

export interface ValidatedDomainEvent {
  readonly domain: string;
  readonly type: string;
  readonly payload: unknown;
  readonly timestamp: number;
}

export function validateDomainEvent(data: unknown): ValidatedDomainEvent {
  if (
    isRecord(data) &&
    typeof data.domain === "string" &&
    typeof data.type === "string" &&
    typeof data.timestamp === "number"
  ) {
    return data as ValidatedDomainEvent;
  }
  throw new TypeError(`[Kernel] Invalid domain event: missing domain/type/timestamp`);
}
