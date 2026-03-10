import React from "react";

import { cn, StatusDot } from "~shared/ui";

interface FleetAgent {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly status: "done" | "running" | "idle";
}

const SAMPLE_AGENTS: FleetAgent[] = [
  { id: "a", label: "Agent A", role: "Planner", status: "done" },
  { id: "b", label: "Agent B", role: "Patch", status: "running" },
  { id: "c", label: "Agent C", role: "Test", status: "idle" },
  { id: "d", label: "Agent D", role: "Review", status: "idle" },
];

const STATUS_MAP = {
  done: "success",
  running: "running",
  idle: "idle",
} as const;

export const AgentFleetPane = React.memo(function AgentFleetPane() {
  return (
    <div className="flex-1 min-w-0 p-3 border-l border-vsc-border">
      <h3 className="text-2xs font-semibold text-vsc-text-tertiary uppercase tracking-wider mb-2">
        Agent Fleet
      </h3>
      <div className="space-y-0.5">
        {SAMPLE_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm",
              "cursor-pointer transition-colors duration-fast",
              "hover:bg-vsc-list-hover",
            )}
          >
            <StatusDot status={STATUS_MAP[agent.status]} size="sm" />
            <span className="text-xs text-vsc-fg flex-1">{agent.label}</span>
            <span className="text-2xs text-vsc-text-tertiary">{agent.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
