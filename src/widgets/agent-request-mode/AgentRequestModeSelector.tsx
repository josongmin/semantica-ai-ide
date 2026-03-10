import React, { useCallback, useMemo } from "react";

import { useAgentRequestMode } from "../../features/agent-request-mode";
import type { AgentRequestMode } from "../../shared/protocol";
import { cn, DropdownMenu, type DropdownMenuItem, Icon } from "../../shared/ui";

// ─── Mode configuration ────────────────────────────────────────────
interface ModeConfig {
  readonly id: string;
  readonly label: string;
  readonly agentMode: AgentRequestMode;
  readonly icon: string;
  readonly color: string;
}

const MODE_CONFIG: readonly ModeConfig[] = [
  { id: "ask", label: "Ask", agentMode: "ask", icon: "comment-discussion", color: "vsc-info" },
  { id: "code", label: "Code", agentMode: "agent", icon: "code", color: "vsc-success" },
  { id: "architect", label: "Architect", agentMode: "plan", icon: "compass", color: "vsc-warning" },
  { id: "rush", label: "Rush", agentMode: "debug", icon: "zap", color: "vsc-error" },
  { id: "deep", label: "Deep", agentMode: "code_analysis", icon: "microscope", color: "vsc-link" },
] as const;

/** Reverse lookup: AgentRequestMode -> ModeConfig */
const MODE_BY_AGENT: ReadonlyMap<AgentRequestMode, ModeConfig> = new Map(
  MODE_CONFIG.map((m) => [m.agentMode, m]),
);

// ─── Component ──────────────────────────────────────────────────────
export const AgentRequestModeSelector = React.memo(function AgentRequestModeSelector({
  className,
}: {
  className?: string;
}) {
  const { mode, changeMode } = useAgentRequestMode();

  const items: DropdownMenuItem[] = useMemo(
    () =>
      MODE_CONFIG.map((m) => ({
        id: m.id,
        label: m.agentMode === mode ? `${m.label} \u2713` : m.label,
        icon: m.icon,
      })),
    [mode],
  );

  const handleSelect = useCallback(
    (id: string) => {
      const selected = MODE_CONFIG.find((m) => m.id === id);
      if (selected && selected.agentMode !== mode) {
        changeMode(selected.agentMode);
      }
    },
    [mode, changeMode],
  );

  const fallback = MODE_CONFIG[0];
  const current = MODE_BY_AGENT.get(mode) ?? fallback;
  if (current === undefined) return null;

  return (
    <DropdownMenu
      items={items}
      onSelect={handleSelect}
      align="left"
      className={className}
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-0.5 px-0.5 py-0 rounded text-2xs min-h-5",
            "text-vsc-text-secondary hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring",
          )}
          data-testid="request-mode-trigger"
        >
          <Icon name={current.icon} tokenSize="2xs" />
          <span>{current.label}</span>
          <Icon name="chevron-down" tokenSize="2xs" className="opacity-60" />
        </button>
      }
    />
  );
});
