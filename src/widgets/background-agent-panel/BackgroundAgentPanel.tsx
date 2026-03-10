import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { useBackgroundAgentControl } from "~shared/bootstrap/background-agent";

import {
  activeBackgroundAgentCountAtom,
  backgroundAgentsAtom,
} from "../../entities/background-agent";
import type { BackgroundAgentId, BackgroundAgentStatus } from "../../shared/protocol";
import { Badge, cn, Icon, ProgressBar, Text } from "../../shared/ui";

// ─── Agent Card ──────────────────────────────────────────────

const STATE_STYLES: Record<string, { dot: string; label: string }> = {
  idle: { dot: "bg-vsc-text-ghost", label: "Idle" },
  running: { dot: "bg-vsc-success motion-safe:animate-pulse", label: "Running" },
  paused: { dot: "bg-vsc-warning", label: "Paused" },
  error: { dot: "bg-vsc-error", label: "Error" },
  completed: { dot: "bg-vsc-info", label: "Done" },
};

const KIND_ICONS: Record<string, string> = {
  "lint-watch": "warning",
  "test-watch": "beaker",
  "refactor-sweep": "wand",
  "dependency-audit": "shield",
  "doc-gen": "book",
  custom: "extensions",
};

interface AgentCardProps {
  readonly agent: BackgroundAgentStatus;
  readonly onStop: (id: BackgroundAgentId) => void;
  readonly onPause: (id: BackgroundAgentId) => void;
  readonly onResume: (id: BackgroundAgentId) => void;
}

const BackgroundAgentCard = React.memo(function BackgroundAgentCard({
  agent,
  onStop,
  onPause,
  onResume,
}: AgentCardProps) {
  const defaultStyle = { dot: "bg-vsc-text-secondary", label: "Idle" };
  const styles = STATE_STYLES[agent.state] ?? STATE_STYLES.idle ?? defaultStyle;
  const icon = KIND_ICONS[agent.kind] ?? "extensions";

  return (
    <div
      className="rounded-lg border border-vsc-border/40 bg-vsc-surface-1 p-3 space-y-2"
      aria-label={`${agent.label} agent — ${styles.label}`}
      data-testid={`bg-agent-card-${agent.agentId}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full shrink-0", styles.dot)} aria-hidden="true" />
        <Icon name={icon} tokenSize="sm" className="text-vsc-text-secondary shrink-0" title={agent.kind} />
        <Text size="sm" weight="medium" className="flex-1 min-w-0" truncate>
          {agent.label}
        </Text>
        <Badge text={styles.label} variant={agent.state === "error" ? "error" : "info"} />
      </div>

      {/* Progress */}
      {agent.progress && agent.state === "running" && (
        <ProgressBar
          value={agent.progress.current}
          max={agent.progress.total}
          label={`${agent.label}: ${agent.progress.current}/${agent.progress.total}`}
        />
      )}

      {/* Last result */}
      {agent.lastResult && (
        <div className="text-2xs text-vsc-text-tertiary">
          {agent.lastResult.summary}
          {agent.lastResult.issues > 0 && (
            <span className="ml-1 text-vsc-warning">
              ({agent.lastResult.issues} issues)
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1.5 pt-1">
        {agent.state === "running" && (
          <button
            type="button"
            onClick={() => onPause(agent.agentId)}
            className="h-6 px-2 rounded text-2xs font-medium
                       bg-vsc-warning/10 text-vsc-warning
                       hover:bg-vsc-warning/20 transition-colors duration-fast cursor-pointer focus-ring"
            aria-label={`Pause ${agent.label}`}
          >
            Pause
          </button>
        )}
        {agent.state === "paused" && (
          <button
            type="button"
            onClick={() => onResume(agent.agentId)}
            className="h-6 px-2 rounded text-2xs font-medium
                       bg-vsc-success/10 text-vsc-success
                       hover:bg-vsc-success/20 transition-colors duration-fast cursor-pointer focus-ring"
            aria-label={`Resume ${agent.label}`}
          >
            Resume
          </button>
        )}
        <button
          type="button"
          onClick={() => onStop(agent.agentId)}
          className="h-6 px-2 rounded text-2xs font-medium
                     bg-vsc-error/10 text-vsc-error
                     hover:bg-vsc-error/20 transition-colors duration-fast cursor-pointer focus-ring"
          aria-label={`Stop ${agent.label}`}
        >
          Stop
        </button>
      </div>
    </div>
  );
});

// ─── Main Panel ──────────────────────────────────────────────

export const BackgroundAgentPanel = React.memo(function BackgroundAgentPanel() {
  const agents = useAtomValue(backgroundAgentsAtom);
  const activeCount = useAtomValue(activeBackgroundAgentCountAtom);
  const { stopAgent, pauseAgent, resumeAgent } = useBackgroundAgentControl();

  const handleStop = useCallback(
    (id: BackgroundAgentId) => stopAgent(id),
    [stopAgent],
  );
  const handlePause = useCallback(
    (id: BackgroundAgentId) => pauseAgent(id),
    [pauseAgent],
  );
  const handleResume = useCallback(
    (id: BackgroundAgentId) => resumeAgent(id),
    [resumeAgent],
  );

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-vsc-text-ghost">
        <Icon name="server-process" tokenSize="lg" className="mb-2 opacity-40" />
        <Text size="sm" tone="ghost">No background agents</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3" data-testid="background-agent-panel">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon name="server-process" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="bold">Background Agents</Text>
        {activeCount > 0 && (
          <Badge text={`${activeCount} active`} variant="success" className="ml-auto" />
        )}
      </div>

      {/* Agent cards */}
      <div className="space-y-2">
        {agents.map((agent) => (
          <BackgroundAgentCard
            key={agent.agentId}
            agent={agent}
            onStop={handleStop}
            onPause={handlePause}
            onResume={handleResume}
          />
        ))}
      </div>
    </div>
  );
});
