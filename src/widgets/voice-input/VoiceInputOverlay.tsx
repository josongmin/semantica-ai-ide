import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  setVoiceOverlayRequestedAtom,
  useWebSpeech,
  voiceInputStateAtom,
  voiceOverlayRequestedAtom,
  voiceTranscriptAtom,
  voiceWaveformLevelsAtom,
} from "../../features/voice-input";
import { cn, Icon, Spinner, Text, WaveformBar } from "../../shared/ui";

const EXIT_DURATION_MS = 180;
const MIN_VISIBLE_MS = 400;

/**
 * Bottom sheet style voice recording overlay.
 * Slides up above the chat input during listening/processing.
 * - Animated recording icon + real-time waveform
 * - Live transcript from Web Speech API
 * - Stop button (glow effect)
 * - ESC to dismiss
 * - Min visible time + exit animation to prevent "flash and vanish"
 */
export const VoiceInputOverlay = React.memo(function VoiceInputOverlay() {
  const state = useAtomValue(voiceInputStateAtom);
  const transcript = useAtomValue(voiceTranscriptAtom);
  const waveformLevels = useAtomValue(voiceWaveformLevelsAtom);
  const overlayRequested = useAtomValue(voiceOverlayRequestedAtom);
  const setOverlayRequested = useSetAtom(setVoiceOverlayRequestedAtom);
  const { stop, cancel } = useWebSpeech();
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "active" | "exiting">("idle");
  const becameActiveAt = useRef<number | null>(null);

  const isActive = state.status === "listening" || state.status === "processing";
  const shouldBecomeActive = isActive || overlayRequested;

  useEffect(() => {
    if (shouldBecomeActive) {
      becameActiveAt.current = Date.now();
       
      setPhase("active");
    }
    if (phase === "active" && !isActive) {
      const elapsed = becameActiveAt.current != null ? Date.now() - becameActiveAt.current : 0;
      const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
      const t = setTimeout(() => {
        setOverlayRequested(false);
        setPhase("exiting");
      }, delay);
      return () => clearTimeout(t);
    }
  }, [shouldBecomeActive, phase, isActive, setOverlayRequested]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const t = setTimeout(() => {
      setPhase("idle");
      setOverlayRequested(false);
    }, EXIT_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, setOverlayRequested]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (state.status !== "listening" && state.status !== "processing") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [state.status, cancel]);

  if (phase === "idle") return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-t-xl border-t border-x border-vsc-border/60",
        "bg-vsc-bg shadow-sheet",
        phase === "exiting"
          ? "animate-[slide-down-sheet_180ms_ease-in]"
          : "animate-[slide-up-sheet_200ms_ease-out]",
      )}
      role="dialog"
      aria-label="Voice input"
      aria-live="polite"
      data-testid="voice-input-overlay"
    >
      {/* Handle bar */}
      <div className="flex justify-center pt-2 pb-1">
        <span className="w-10 h-1 rounded-full bg-vsc-fg/20" aria-hidden />
      </div>

      <div className="flex flex-col items-center gap-4 px-5 pb-6 pt-1">
        {/* Recording icon + status row */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative flex items-center justify-center shrink-0">
            <span
              className="absolute inset-0 rounded-full bg-vsc-error/25 animate-ping"
              style={{ animationDuration: "1.5s" }}
              aria-hidden
            />
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-vsc-error/25 ring-2 ring-vsc-error/50">
              <Icon name="mic" tokenSize="lg" className="text-vsc-error" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {state.status === "listening" ? (
              <Text size="sm" weight="medium" tone="error" className="animate-pulse">
                Listening…
              </Text>
            ) : (
              <div className="flex items-center gap-2">
                <Spinner size="sm" className="text-vsc-text-secondary shrink-0" />
                <Text size="sm" weight="medium" tone="secondary">
                  Processing…
                </Text>
              </div>
            )}
            {state.status === "listening" && (
              <WaveformBar levels={waveformLevels} active className="h-4 mt-1" />
            )}
          </div>
          {state.status === "listening" && (
            <button
              type="button"
              onClick={handleStop}
              aria-label="Stop recording"
              data-testid="voice-overlay-stop"
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                "bg-vsc-error text-vsc-bg cursor-pointer",
                "shadow-glow-error hover:shadow-glow-error-hover",
                "transition-shadow duration-normal",
                "focus-ring",
              )}
            >
              <Icon name="debug-stop" tokenSize="sm" />
            </button>
          )}
        </div>

        {/* Real-time transcript */}
        <div
          className={cn(
            "w-full min-h-[64px] max-h-[120px] overflow-y-auto rounded-lg px-4 py-3",
            "bg-vsc-surface-2/70 backdrop-blur-md border border-vsc-border/40",
          )}
        >
          {transcript ? (
            <Text size="sm" tone="primary" className="whitespace-pre-wrap leading-relaxed">
              {transcript}
            </Text>
          ) : (
            <Text size="sm" tone="tertiary" className="italic">
              {state.status === "listening" ? "Speak now…" : "Transcribing…"}
            </Text>
          )}
        </div>

        {/* ESC hint */}
        <Text size="2xs" tone="ghost" className="select-none">
          Press{" "}
          <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2 text-vsc-text-tertiary font-mono text-2xs">
            ESC
          </kbd>{" "}
          to cancel
        </Text>
      </div>
    </div>
  );
});
