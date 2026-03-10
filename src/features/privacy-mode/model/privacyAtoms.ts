/**
 * Privacy Mode atoms.
 *
 * Tracks the current privacy state indicating whether code data is kept local,
 * shared with an AI model, or stored externally. Displayed as a color-coded
 * lock icon in the header bar.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { PrivacyState } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** Current privacy state; null when not yet reported by the extension */
export const privacyStateAtom = atom<PrivacyState | null>(null);

/** Write-only: set the privacy state from a serverEvent payload */
export const setPrivacyStateAtom = atom(null, (_get, set, state: PrivacyState) => {
  set(privacyStateAtom, state);
});

/** Write-only: reset privacy state */
export const resetPrivacyStateAtom = atom(null, (_get, set) => {
  set(privacyStateAtom, null);
});

registerResetAtom(resetPrivacyStateAtom);
