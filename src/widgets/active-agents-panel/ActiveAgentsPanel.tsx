import React from "react";
import { useAtomValue } from "jotai";

import { activeAgentsAtom, type AgentIdentity,getAgentRoleConfig } from "../../entities/agent-identity";
import { cn, Icon, Text } from "../../shared/ui";

function AgentChip({ agent }: { agent: AgentIdentity }) {
  const rc = getAgentRoleConfig(agent.role);
  const isWorking = agent.status === "working";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md border",
        "transition-colors duration-fast",
        rc.bgClass,
        rc.borderClass,
      )}
    >
      <Icon
        name={rc.icon}
        tokenSize="2xs"
        className={cn(rc.textClass, isWorking && "animate-pulse")}
      />
      <Text size="2xs" weight="medium" className={rc.textClass} truncate>
        {agent.name || rc.label}
      </Text>
      {agent.current_task && (
        <Text size="2xs" tone="ghost" truncate className="max-w-[120px]">
          {agent.current_task}
        </Text>
      )}
    </div>
  );
}

/**
 * Shows all active agents in the current session.
 * Only renders when multiple agents are active.
 */
export const ActiveAgentsPanel = React.memo(function ActiveAgentsPanel() {
  const agents = useAtomValue(activeAgentsAtom);

  if (agents.length === 0) return null;

  return (
    <div
      className="px-3 py-1.5 border-b border-vsc-border/40 animate-[message-in_200ms_var(--ease-spring)]"
      data-testid="active-agents-panel"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name="organization" tokenSize="2xs" className="text-vsc-text-ghost" />
        <Text size="2xs" tone="ghost" weight="medium">
          Active Agents
        </Text>
        <Text size="2xs" tone="ghost" mono>
          ({agents.length})
        </Text>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {agents.map((agent) => (
          <AgentChip key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
});
