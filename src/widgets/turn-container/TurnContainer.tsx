import "./turnFeatures";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useStore } from "jotai";

import { messageAtomFamily } from "~entities/message/core";
import { turnAtomFamily, turnIndexAtomFamily } from "~entities/message/turns";
import { sessionMetaAtom } from "~entities/session/state";

import { useSessionFork } from "../../features/session-fork";
import { useTurnNavigation } from "../../features/turn-navigation";
import { focusedTurnIdAtom, getVscodeApi } from "../../shared/lib";
import type { TurnId } from "../../shared/protocol";
import {
  Button,
  cn,
  ConfirmDialog,
  ErrorBoundary,
  InlineBanner,
  ProgressBar,
  Text,
  Tooltip,
} from "../../shared/ui";
import { ThinkingLogWithPresence } from "./ThinkingLogWithPresence";
import { getTurnFeaturesBySlot } from "./turnFeatureRegistry";
import { TurnPhaseSection } from "./TurnPhaseSection";

interface TurnContainerProps {
  turnId: TurnId;
  focused?: boolean;
  isLast?: boolean;
  /** Entrance animation style, applied on first render only */
  animationStyle?: React.CSSProperties;
}

/** Duration in ms for "Copied!" feedback before resetting */
const COPY_FEEDBACK_MS = 1500;

/** Stable time format options -- avoids creating new object each render */
const TIME_FORMAT_HMS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

/**
 * Core Turn container — the fundamental UX unit.
 * Renders 6-phase structure: user_message → thinking → analysis → plan → changes → summary
 * Each phase is displayed as a timeline entry.
 */
export const TurnContainer = React.memo(function TurnContainer({
  turnId,
  focused,
  isLast,
  animationStyle,
}: TurnContainerProps) {
  const turn = useAtomValue(turnAtomFamily(turnId));
  const turnIndex = useAtomValue(turnIndexAtomFamily(turnId));
  const focusedTurnId = useAtomValue(focusedTurnIdAtom);
  const isFocused = focusedTurnId === turnId;
  const { copyTurnLink } = useTurnNavigation();
  const { forkFromTurn } = useSessionFork();
  const meta = useAtomValue(sessionMetaAtom);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [forkConfirmOpen, setForkConfirmOpen] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current != null) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const handleCopyLink = useCallback(() => {
    copyTurnLink(turnId);
    setCopyState("copied");
    if (copyTimerRef.current != null) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
  }, [copyTurnLink, turnId]);

  const handleFork = useCallback(() => {
    if (meta.status === "running") {
      setForkConfirmOpen(true);
    } else {
      forkFromTurn(turnId);
    }
  }, [forkFromTurn, turnId, meta.status]);

  const confirmFork = useCallback(() => {
    setForkConfirmOpen(false);
    forkFromTurn(turnId);
  }, [forkFromTurn, turnId]);

  const cancelFork = useCallback(() => setForkConfirmOpen(false), []);

  const handleReplay = useCallback(() => {
    getVscodeApi().postMessage({ type: "START_REPLAY", turn_id: turnId });
  }, [turnId]);

  // Phase progress for running turns (must be before early return)
  const phaseProgress = useMemo(() => {
    if (!turn) return { completed: 0, total: 0 };
    const total = turn.phases.length;
    const completed = turn.phases.filter((p) => p.status === "success").length;
    return { completed, total };
  }, [turn]);

  // Find error phase for error message display
  const errorPhase = useMemo(
    () => (turn?.status === "error" ? turn.phases.find((p) => p.status === "error") : null),
    [turn],
  );

  // Suppress redundant InlineBanner when ErrorClassification already shows the error
  const store = useStore();
  const hasClassifiedError = useMemo(() => {
    if (!errorPhase) return false;
    return errorPhase.message_ids.some((id) => {
      const msg = store.get(messageAtomFamily(id));
      return !!msg?.classified_error;
    });
  }, [errorPhase, store]);

  if (!turn) return null;

  const isRunning = turn.status === "running";
  const isError = turn.status === "error";

  // User-only turn: only has user_message phase with content, no agent phases
  const isUserOnly = turn.phases.every(
    (p) =>
      p.phase === "user_message" || (p.message_ids.length === 0 && p.tool_call_ids.length === 0),
  );

  // Hide completed turns with no meaningful content
  const hasContent = turn.phases.some(
    (p) => p.message_ids.length > 0 || p.tool_call_ids.length > 0,
  );
  if (!isRunning && !isError && !hasContent) return null;

  return (
    <div
      className={cn(
        "group/turn flex",
        !isLast && "border-b border-vsc-border/20",
        focused && "ring-2 ring-vsc-focus ring-offset-1",
        isFocused && "ring-2 ring-vsc-focus transition-shadow duration-normal",
        animationStyle && "animate-[message-in_200ms_var(--ease-spring)]",
      )}
      style={animationStyle}
      data-testid={`turn-${turnId}`}
    >
      {/* Turn content */}
      <div className="flex-1 min-w-0 pt-4 pb-2">
        {/* Turn header — status + time + actions */}
        <div className="flex items-center gap-1.5 pl-4 pr-3 py-1">
          {/* Turn label */}
          {!isUserOnly && (
            <Text size="2xs" weight="semibold" tone="ghost" className="uppercase tracking-wide">
              Turn {turnIndex}
            </Text>
          )}

          <Text size="2xs" tone="ghost" mono className="opacity-60">
            {new Date(turn.created_at_ms).toLocaleTimeString([], TIME_FORMAT_HMS)}
          </Text>

          {isRunning && phaseProgress.total > 1 && (
            <ProgressBar
              value={phaseProgress.completed}
              max={phaseProgress.total}
              label={`${phaseProgress.completed}/${phaseProgress.total}`}
              className="flex-1 max-w-20"
            />
          )}

          <div className="flex-1" />

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover/turn:opacity-100 focus-within:opacity-100 transition-opacity duration-fast">
            <Tooltip content={copyState === "copied" ? "Copied!" : "Copy turn link"}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyLink}
                aria-label="Copy turn link"
                className="w-5 h-5"
                icon={copyState === "copied" ? "check" : "link"}
              />
            </Tooltip>

            <Tooltip content="Fork from here">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFork}
                aria-label="Fork session from this turn"
                className="w-5 h-5"
                icon="git-compare"
              />
            </Tooltip>

            <Tooltip content="Replay this turn">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReplay}
                aria-label="Replay this turn step-by-step"
                className="w-5 h-5"
                icon="debug-step-over"
              />
            </Tooltip>
          </div>
        </div>

        {/* Pre-phase features */}
        <Suspense fallback={null}>
          {getTurnFeaturesBySlot("pre-phases").map((f) => (
            <ErrorBoundary key={f.id} fallback={null}>
              {f.render(turnId)}
            </ErrorBoundary>
          ))}
        </Suspense>

        {/* Pipeline moved to FeatureSheetHost popup */}

        {/* Thinking log — real-time activity stream for running turns (exit 애니메이션으로 덜컹거림 방지) */}
        <ThinkingLogWithPresence turnId={turnId} isRunning={isRunning} />

        {/* Phase sections — timeline layout */}
        <div>
          {turn.phases.map((phase) => (
            <TurnPhaseSection key={phase.phase} turnId={turnId} entry={phase} />
          ))}
        </div>

        {/* Error banner — hidden when ErrorClassification already renders in a message */}
        {isError && !hasClassifiedError && (
          <div className="ml-[22px] mr-4 mb-2 animate-[fade-in_var(--duration-normal)_var(--ease-default)]">
            <InlineBanner variant="error" icon="error">
              {errorPhase?.summary ?? "An error occurred during this turn."}
            </InlineBanner>
          </div>
        )}

        {/* Boomerang subtasks rendered inside TurnPhaseSection (summary phase) */}

        {/* Post-phase features */}
        <Suspense fallback={null}>
          {getTurnFeaturesBySlot("post-phases").map((f) => (
            <ErrorBoundary key={f.id} fallback={null}>
              {f.render(turnId)}
            </ErrorBoundary>
          ))}
        </Suspense>

        {/* Fork guard */}
        <ConfirmDialog
          open={forkConfirmOpen}
          onConfirm={confirmFork}
          onCancel={cancelFork}
          title="Fork Running Session"
          description="Session is running. Fork will create a new branch from this point."
        />
      </div>
    </div>
  );
});
