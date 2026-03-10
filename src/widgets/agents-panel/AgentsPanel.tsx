import React from "react";
import { useAtomValue } from "jotai";

import { agentIdsPartitionedAtom } from "~entities/agent-instance";

import { useParallelAgents } from "../../features/parallel-agents";
import { Badge, EmptyState, Icon, Text } from "../../shared/ui";
import { AgentInstanceRow } from "./AgentInstanceRow";

export const AgentsPanel = React.memo(function AgentsPanel() {
  const { agentIds, cancelAgent, panelVisible } = useParallelAgents();
  const { running, completed } = useAtomValue(agentIdsPartitionedAtom);

  if (!panelVisible) return null;
  if (agentIds.length === 0) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center p-8">
        <EmptyState
          icon="server-process"
          title="No agents running"
          description="Parallel agents will appear here when tasks start"
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0 min-w-0"
      role="region"
      aria-label="Parallel agents"
      data-testid="agents-panel"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-vsc-border/30 shrink-0">
        <Icon name="server-process" tokenSize="sm" className="text-vsc-info" />
        <Text size="sm" weight="semibold" className="text-vsc-fg">
          Agents
        </Text>
        {running.length > 0 && (
          <Badge
            variant="info"
            text={running.length}
            className="gap-1 animate-pulse tabular-nums"
          />
        )}
        {completed.length > 0 && (
          <Text size="2xs" tone="ghost" className="tabular-nums">
            {completed.length} done
          </Text>
        )}
      </div>

      {/* ── Agent list ── */}
      <div
        role="list"
        className="flex-1 min-h-[120px] overflow-y-auto overscroll-contain p-2 gap-1.5 flex flex-col [scrollbar-gutter:stable] scroll-shadow stagger-children"
        data-scroll-contain
      >
        {/* Running agents */}
        {running.map((id) => (
          <AgentInstanceRow key={id} id={id} onCancel={cancelAgent} />
        ))}

        {/* Separator between groups */}
        {running.length > 0 && completed.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex-1 h-px bg-vsc-border/25" />
            <Text size="2xs" tone="ghost">completed</Text>
            <div className="flex-1 h-px bg-vsc-border/25" />
          </div>
        )}

        {/* Completed agents */}
        {completed.map((id) => (
          <AgentInstanceRow key={id} id={id} onCancel={cancelAgent} />
        ))}
      </div>
    </div>
  );
});
