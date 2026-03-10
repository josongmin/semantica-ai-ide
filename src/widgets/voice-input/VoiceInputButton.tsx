import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { useWebSpeech, voiceInputStateAtom, voiceTranscriptAtom } from "../../features/voice-input";
import { getVscodeApi } from "../../shared/lib";
import { Button, cn, Icon, Spinner, Text } from "../../shared/ui";

/**
 * VoiceInputButton - Microphone button with recording state animation.
 *
 * States: idle -> listening -> processing -> done
 * Shows transcript preview when done, with confirm/cancel actions.
 */
export const VoiceInputButton = React.memo(function VoiceInputButton() {
  const state = useAtomValue(voiceInputStateAtom);
  const transcript = useAtomValue(voiceTranscriptAtom);
  const { start, stop, cancel } = useWebSpeech();

  const handleStartRecording = useCallback(() => {
    void start();
  }, [start]);

  const handleStopRecording = useCallback(() => {
    stop();
  }, [stop]);

  const handleConfirm = useCallback(() => {
    if (transcript) {
      getVscodeApi().postMessage({ type: "CONFIRM_VOICE_INPUT", transcript });
    }
  }, [transcript]);

  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  // ─── Idle State ──────────────────────────────────────────
  if (state.status === "idle") {
    return (
      <Button
        variant="ghost"
        size="xs"
        onClick={handleStartRecording}
        aria-label="Start voice input"
        data-testid="voice-input-button"
        className="text-vsc-text-ghost hover:text-vsc-text-secondary transition-colors duration-fast p-0.5 min-h-5 min-w-5"
      >
        <Icon name="mic" tokenSize="2xs" />
      </Button>
    );
  }

  // ─── Listening / Processing (Overlay covers main; footer shows compact control) ─
  if (state.status === "listening") {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1"
        data-testid="voice-input-listening"
        role="status"
        aria-label="Listening for voice input"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStopRecording}
          aria-label="Stop recording"
          data-testid="voice-input-stop"
          className="ring-2 ring-vsc-error/60 rounded-full"
        >
          <Icon name="debug-stop" tokenSize="sm" />
        </Button>
        <span
          className={cn("inline-block w-2.5 h-2.5 rounded-full bg-vsc-error", "animate-pulse")}
          aria-hidden="true"
        />
        <Text size="xs" tone="secondary">
          Recording
        </Text>
      </div>
    );
  }
  if (state.status === "processing") {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1"
        data-testid="voice-input-processing"
        role="status"
        aria-label="Processing voice input"
      >
        <Spinner size="sm" className="text-vsc-text-secondary" />
        <Text size="xs" tone="secondary">
          Processing…
        </Text>
      </div>
    );
  }

  // ─── Done State (transcript preview) ─────────────────────
  return (
    <div
      className="flex flex-col gap-1 px-2 py-1.5 border border-vsc-border rounded bg-vsc-bg-secondary"
      data-testid="voice-input-preview"
    >
      <div className="flex items-center gap-1.5">
        <Icon name="mic" tokenSize="sm" className="text-vsc-text-secondary shrink-0" />
        <Text size="xs" weight="medium">
          Voice Transcript
        </Text>
        {state.confidence !== undefined && (
          <Text size="xs" tone="tertiary" className="ml-auto">
            {Math.round(state.confidence * 100)}%
          </Text>
        )}
      </div>
      <Text
        size="xs"
        tone="secondary"
        className="line-clamp-3"
        data-testid="voice-transcript-text"
      >
        {transcript || "(empty)"}
      </Text>
      <div className="flex items-center gap-1 mt-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          aria-label="Cancel voice input"
          data-testid="voice-input-cancel"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={!transcript}
          aria-label="Confirm voice input"
          data-testid="voice-input-confirm"
        >
          Send
        </Button>
      </div>
    </div>
  );
});
