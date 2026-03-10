/**
 * Adapter atom for scope-guard feature.
 *
 * Widgets read this atom instead of importing directly from
 * `features/scope-guard`, breaking the DIP violation.
 * The feature layer hydrates the adapter at bootstrap time.
 */
import { atom } from "jotai";

// ─── Adapter interface ──────────────────────────────────────────────

export interface ScopeGuardAdapter {
  /** Whether any scope rules are configured. */
  readonly isActive: boolean;
  /** Include glob patterns (files matching any are allowed). */
  readonly includes: readonly string[];
  /** Exclude glob patterns (files matching any are blocked). */
  readonly excludes: readonly string[];
  /** Check if a file path violates the scope rules. */
  isScopeViolation: (filePath: string) => boolean;
  /** Set scope guard patterns (both includes and excludes). */
  setScopeGuard: (payload: { includes: readonly string[]; excludes: readonly string[] }) => void;
}

// ─── Adapter atom (null before hydration) ───────────────────────────

export const scopeGuardAdapterAtom = atom<ScopeGuardAdapter | null>(null);
scopeGuardAdapterAtom.debugLabel = "scopeGuardAdapterAtom";
