import React, { useCallback } from "react";

import type { MissionControlAgent } from "../../shared/protocol";
import { Badge, cn, Icon, ProgressBar, Text, Tooltip } from "../../shared/ui";

interface MissionControlCardProps {
  agent: MissionControlAgent;
  onNavigate: (sessionId: string) => void;
}

const statusBorderColors: Record<MissionControlAgent["status"], string> = {
  running: "border-l-vsc-success",
  idle: "border-l-vsc-warning",
  error: "border-l-vsc-error",
};

const statusIcons: Record<MissionControlAgent["status"], string> = {
  running: "play",
  idle: "watch",
  error: "error",
};

const statusLabels: Record<MissionControlAgent["status"], string> = {
  running: "Running",
  idle: "Idle",
  error: "Error",
};

function formatEta(etaMs: number | undefined): string | null {
  if (etaMs == null || etaMs <= 0) return null;
  const seconds = Math.ceil(etaMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
}

/**
 * Individual agent card within the Mission Control grid.
 * Shows agent name, status, current task, progress, risk level, and ETA.
 * Click navigates to the agent's chat session.
 */
export const MissionControlCard = React.memo(function MissionControlCard({
  agent,
  onNavigate,
}: MissionControlCardProps) {
  const handleClick = useCallback(() => {
    if (agent.session_id) {
      onNavigate(agent.session_id);
    }
  }, [agent.session_id, onNavigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && agent.session_id) {
        e.preventDefault();
        onNavigate(agent.session_id);
      }
    },
    [agent.session_id, onNavigate],
  );

  const eta = formatEta(agent.eta_ms);

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 p-3 rounded border border-vsc-border bg-vsc-bg-secondary",
        "border-l-2 cursor-pointer transition-[background-color,box-shadow,transform] duration-fast hover:bg-vsc-bg-tertiary hover:shadow-md active:scale-[0.98] focus-ring",
        statusBorderColors[agent.status],
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Agent ${agent.name}, status: ${agent.status}, progress: ${agent.progress_pct}%`}
      data-testid={`mission-control-card-${agent.id}`}
    >
      {/* Header: name + status */}
      <div className="flex items-center justify-between gap-2">
        <Text size="sm" weight="medium" className="truncate min-w-0">
          {agent.name}
        </Text>
        <Tooltip content={statusLabels[agent.status]}>
          <Icon
            name={statusIcons[agent.status]}
            tokenSize="2xs"
            className={cn(
              agent.status === "running" && "text-vsc-success",
              agent.status === "idle" && "text-vsc-warning",
              agent.status === "error" && "text-vsc-error",
            )}
          />
        </Tooltip>
      </div>

      {/* Current task */}
      {agent.current_task && (
        <Text size="xs" tone="secondary" className="truncate min-w-0">
          {agent.current_task}
        </Text>
      )}

      {/* Progress bar */}
      <ProgressBar value={agent.progress_pct} max={100} />

      {/* Footer: risk + ETA + progress % */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge
            text={agent.risk_level}
            variant={(() => { if (agent.risk_level === "safe") return "success" as const; if (agent.risk_level === "moderate") return "warning" as const; return "error" as const; })()}
          />
        </div>
        <div className="flex items-center gap-2">
          {eta && (
            <Text size="2xs" tone="tertiary">
              ETA {eta}
            </Text>
          )}
          <Text size="2xs" tone="tertiary">
            {Math.round(agent.progress_pct)}%
          </Text>
        </div>
      </div>
    </div>
  );
});
