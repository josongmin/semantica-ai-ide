/**
 * Voice Input atoms for voice-to-text coding instructions.
 *
 * Manages the lifecycle: idle -> listening -> processing -> done
 * with transcript preview before sending.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { VoiceInputState } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** Default idle state */
const DEFAULT_VOICE_INPUT_STATE: VoiceInputState = { status: "idle" };

/** Current voice input state */
export const voiceInputStateAtom = atom<VoiceInputState>(DEFAULT_VOICE_INPUT_STATE);

/** Write-only: set the voice input state from a serverEvent payload */
export const setVoiceInputStateAtom = atom(null, (_get, set, state: VoiceInputState) => {
  set(voiceInputStateAtom, state);
});

// ─── Derived Atoms ───────────────────────────────────────────

/** Whether voice input is currently active (listening or processing) */
export const isVoiceActiveAtom = atom((get) => {
  const state = get(voiceInputStateAtom);
  return state.status === "listening" || state.status === "processing";
});

/** The current transcript (empty string if none) */
export const voiceTranscriptAtom = atom((get) => {
  return get(voiceInputStateAtom).transcript ?? "";
});

/** Voice waveform amplitude levels (16 bars, 0..1 each) */
export const voiceWaveformLevelsAtom = atom<number[]>(new Array<number>(16).fill(0));

/** Set when user requests recording (clicks mic) — prevents overlay flash-close from batched state */
export const voiceOverlayRequestedAtom = atom(false);
export const setVoiceOverlayRequestedAtom = atom(null, (_get, set, requested: boolean) => {
  set(voiceOverlayRequestedAtom, requested);
});

/** Write-only: reset voice input state to idle */
export const resetVoiceInputStoreAtom = atom(null, (_get, set) => {
  set(voiceInputStateAtom, DEFAULT_VOICE_INPUT_STATE);
  set(voiceOverlayRequestedAtom, false);
});

registerResetAtom(resetVoiceInputStoreAtom);
