import React from "react";
import { useAtomValue } from "jotai";

import { reviewAgentsAtom } from "../../entities/review-agent";
import { multiAgentReviewPanelVisibleAtom } from "../../shared/lib/atoms/inspectionPanelAtoms";
import { AgentCard, Badge, Collapsible } from "../../shared/ui";

export const MultiAgentReviewPanel = React.memo(function MultiAgentReviewPanel() {
  const visible = useAtomValue(multiAgentReviewPanelVisibleAtom);
  const agents = useAtomValue(reviewAgentsAtom);

  if (!visible || agents.length === 0) return null;

  const totalFindings = agents.reduce((sum, a) => sum + a.findings, 0);

  return (
    <Collapsible
      title="Multi-Agent Review"
      icon="organization"
      badge={totalFindings > 0 ? `${totalFindings} findings` : undefined}
    >
      <div className="px-3 py-2 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        {agents.map((agent) => (
          <AgentCard key={agent.id} name={agent.name} role={agent.role} status={agent.status}>
            {agent.summary && <p className="line-clamp-2">{agent.summary}</p>}
            {agent.findings > 0 && <Badge text={`${agent.findings} findings`} variant="warning" className="mt-1" />}
          </AgentCard>
        ))}
      </div>
    </Collapsible>
  );
});
