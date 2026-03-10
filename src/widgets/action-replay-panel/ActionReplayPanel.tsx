import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { replaySessionAtom, useActionReplay } from "../../features/action-replay";
import type { ReplayStep, ReplayStepType } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";

const STEP_ICON: Record<ReplayStepType, string> = {
  tool_call: "tools",
  model_response: "sparkle",
  user_input: "comment",
  approval: "shield",
  checkpoint: "bookmark",
  error: "error",
};

const STEP_COLOR: Record<ReplayStepType, string> = {
  tool_call: "text-vsc-accent",
  model_response: "text-vsc-success",
  user_input: "text-vsc-text-secondary",
  approval: "text-vsc-warning",
  checkpoint: "text-vsc-info",
  error: "text-vsc-error",
};

function StepMarker({
  step,
  isCurrent,
  onBranch,
}: {
  step: ReplayStep;
  isCurrent: boolean;
  onBranch: (index: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 py-0.5 px-1 rounded",
        isCurrent && "bg-vsc-accent/10 border border-vsc-accent/30",
      )}
    >
      <Icon name={STEP_ICON[step.type]} tokenSize="2xs" className={STEP_COLOR[step.type]} />
      <Text size="2xs" tone={isCurrent ? "primary" : "secondary"} truncate className="flex-1 min-w-0">
        {step.summary}
      </Text>
      {step.files_affected.length > 0 && (
        <Text size="2xs" tone="ghost" mono>
          {step.files_affected.length}f
        </Text>
      )}
      {step.can_branch && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onBranch(step.index)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
          title="Branch from here"
          aria-label="Branch from here"
        >
          <Icon name="git-branch" tokenSize="2xs" className="text-vsc-accent" />
        </Button>
      )}
    </div>
  );
}

export const ActionReplayPanel = React.memo(function ActionReplayPanel({
  turnId,
}: {
  turnId?: string;
}) {
  const session = useAtomValue(replaySessionAtom);
  const { replayStep, replayBranch, stopReplay } = useActionReplay();

  const handleStep = useCallback((direction: "forward" | "backward") => {
    replayStep(direction);
  }, [replayStep]);

  const handleBranch = useCallback((step_index: number) => {
    replayBranch(step_index);
  }, [replayBranch]);

  const handleStop = useCallback(() => {
    stopReplay();
  }, [stopReplay]);

  if (!session) return null;
  if (turnId && session.source_turn_id !== turnId) return null;

  const progress = session.total_steps > 0
    ? ((session.current_index + 1) / session.total_steps) * 100
    : 0;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="action-replay-panel">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="history" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">
          Action Replay
        </Text>
        <Text size="2xs" tone="ghost" className="ml-auto">
          {session.current_index + 1}/{session.total_steps}
        </Text>
      </div>

      {/* Scrubber */}
      <div className="pl-5 mb-1.5">
        <div className="w-full h-1.5 rounded-full bg-vsc-bg-tertiary overflow-hidden">
          <div
            className="h-full bg-vsc-accent rounded-full transition-colors duration-fast"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="pl-5 flex items-center gap-1 mb-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleStep("backward")}
          disabled={session.current_index <= 0}
          className="p-0.5 hover:bg-vsc-bg-tertiary transition-colors duration-fast"
          title="Step backward"
          aria-label="Step backward"
        >
          <Icon name="arrow-left" tokenSize="xs" className="text-vsc-text-secondary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          className="p-0.5 hover:bg-vsc-bg-tertiary transition-colors duration-fast"
          title="Stop replay"
          aria-label="Stop replay"
        >
          <Icon
            name={session.status === "playing" ? "debug-pause" : "debug-stop"}
            tokenSize="xs"
            className="text-vsc-text-secondary"
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleStep("forward")}
          disabled={session.current_index >= session.total_steps - 1}
          className="p-0.5 hover:bg-vsc-bg-tertiary transition-colors duration-fast"
          title="Step forward"
          aria-label="Step forward"
        >
          <Icon name="arrow-right" tokenSize="xs" className="text-vsc-text-secondary" />
        </Button>
        <Text size="2xs" tone="ghost" className="ml-1">
          {session.status}
        </Text>
      </div>

      {/* Step list */}
      <div className="pl-5 space-y-0.5 max-h-[--panel-max-h-xs] overflow-y-auto scroll-shadow">
        {session.steps.map((step) => (
          <StepMarker
            key={step.id}
            step={step}
            isCurrent={step.index === session.current_index}
            onBranch={handleBranch}
          />
        ))}
      </div>
    </div>
  );
});
