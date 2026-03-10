/**
 * Architect Mode atoms.
 *
 * Tracks which model role is active (planner, coder, or critic) so the UI
 * can display a role badge with appropriate color coding and transition
 * animations.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ArchitectState } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** Current architect state; null when architect mode is not active */
export const architectStateAtom = atom<ArchitectState | null>(null);

/** Write-only: set the architect state from a serverEvent payload */
export const setArchitectStateAtom = atom(null, (_get, set, state: ArchitectState) => {
  set(architectStateAtom, state);
});

/** Write-only: reset architect mode state */
export const resetArchitectStateAtom = atom(null, (_get, set) => {
  set(architectStateAtom, null);
});

registerResetAtom(resetArchitectStateAtom);
