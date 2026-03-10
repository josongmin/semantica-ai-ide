import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { debateSessionFamily } from "../../features/multi-agent-debate";
import { getVscodeApi } from "../../shared/lib";
import type { DebateAgent, DebateSession, TurnId } from "../../shared/protocol";
import { Badge, cn, Icon, ProgressBar, Spinner, Text } from "../../shared/ui";

const STATUS_ICON: Record<string, string> = {
  setup: "settings-gear",
  running: "play",
  judging: "law",
  decided: "check-all",
  merged: "git-merge",
};

/** Rotating persona icons and colors for debate agents */
const PERSONA_ICONS = ["lightbulb", "code", "shield", "beaker"] as const;
const PERSONA_COLORS = [
  { text: "text-vsc-keyword", bg: "bg-vsc-keyword/15", border: "border-vsc-keyword/30" },
  { text: "text-vsc-success", bg: "bg-vsc-success/15", border: "border-vsc-success/30" },
  { text: "text-vsc-warning", bg: "bg-vsc-warning/15", border: "border-vsc-warning/30" },
  { text: "text-vsc-info", bg: "bg-vsc-info/15", border: "border-vsc-info/30" },
] as const;

function AgentCard({
  agent,
  session,
  index,
}: {
  agent: DebateAgent;
  session: DebateSession;
  index: number;
}) {
  const handlePick = useCallback(() => {
    getVscodeApi().postMessage({ type: "DEBATE_PICK_WINNER", agent_id: agent.id });
  }, [agent.id]);

  const handleMerge = useCallback(() => {
    getVscodeApi().postMessage({ type: "DEBATE_MERGE", agent_id: agent.id });
  }, [agent.id]);

  const isWinner = session.consensus?.winner_id === agent.id;
  const score = session.consensus?.scores.find((s) => s.agent_id === agent.id);
  const persona = PERSONA_COLORS[index % PERSONA_COLORS.length] ?? PERSONA_COLORS[0];
  const personaIcon = PERSONA_ICONS[index % PERSONA_ICONS.length] ?? PERSONA_ICONS[0];

  let agentVariant: "error" | "success" | "default";
  if (agent.status === "error") {
    agentVariant = "error";
  } else if (agent.status === "done") {
    agentVariant = "success";
  } else {
    agentVariant = "default";
  }

  return (
    <div className={cn("rounded border bg-vsc-bg-secondary/30 p-2 flex flex-col gap-1", persona.border)}>
      <div className="flex items-center gap-1.5">
        <Icon name={personaIcon} tokenSize="2xs" className={persona.text} />
        <Text size="2xs" weight="medium" tone="secondary" truncate className="flex-1 min-w-0">
          {agent.label}
        </Text>
        {agent.status === "working" && <Spinner size="sm" />}
        {isWinner && <Icon name="star-full" tokenSize="2xs" className="text-vsc-warning" />}
        <Badge
          variant={agentVariant}
          text={agent.status}
        />
      </div>

      {agent.approach_summary && (
        <Text size="2xs" tone="ghost" className="line-clamp-2">
          {agent.approach_summary}
        </Text>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          <Text size="2xs" tone="ghost">Confidence</Text>
          <ProgressBar value={agent.confidence * 100} max={100} className="flex-1" />
          <Text size="2xs" tone="ghost" mono>
            {Math.round(agent.confidence * 100)}%
          </Text>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Text size="2xs" tone="tertiary">{agent.files_changed} files</Text>
        <Text size="2xs" tone="tertiary">{agent.tokens_used.toLocaleString()} tok</Text>
        <Text size="2xs" tone="tertiary">{(agent.duration_ms / 1000).toFixed(1)}s</Text>
      </div>

      {score && (
        <div className="flex items-center gap-1">
          <Text size="2xs" tone="ghost">Score: {score.score.toFixed(1)}</Text>
          <Text size="2xs" tone="ghost" className="flex-1 min-w-0 truncate">
            — {score.reasoning}
          </Text>
        </div>
      )}

      {session.status === "decided" && (
        <div className="flex items-center gap-1 mt-0.5">
          <button
            type="button"
            onClick={handlePick}
            className="px-1.5 py-0.5 rounded text-2xs bg-vsc-accent/10 text-vsc-accent hover:bg-vsc-accent/20 transition-colors duration-fast cursor-pointer focus-ring"
          >
            Select
          </button>
          <button
            type="button"
            onClick={handleMerge}
            className="px-1.5 py-0.5 rounded text-2xs bg-vsc-success/10 text-vsc-success hover:bg-vsc-success/20 transition-colors duration-fast cursor-pointer focus-ring"
          >
            Merge
          </button>
        </div>
      )}
    </div>
  );
}

export const DebateArena = React.memo(function DebateArena({
  turnId,
}: {
  turnId: TurnId;
}) {
  const session = useAtomValue(debateSessionFamily(turnId));

  if (!session) return null;

  return (
    <div className="mx-4 my-2 px-3 py-2.5 rounded-lg border border-vsc-border/40 bg-vsc-surface-1/50" data-testid="debate-arena">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="comment-discussion" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">
          Multi-Agent Debate
        </Text>
        <Icon
          name={STATUS_ICON[session.status] ?? "circle-outline"}
          tokenSize="2xs"
          className="ml-auto text-vsc-text-tertiary"
        />
        <Badge variant="default" text={session.status} />
      </div>

      <div className="pl-5 mb-1.5">
        <Text size="2xs" tone="ghost" truncate>
          {session.prompt}
        </Text>
      </div>

      <div className="pl-5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(session.agents.length, 3)}, 1fr)` }}>
        {session.agents.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} session={session} index={index} />
        ))}
      </div>

      {session.consensus && (
        <div className="pl-5 mt-1.5 pt-1.5 border-t border-vsc-border/20">
          <div className="flex items-center gap-1.5">
            <Icon name="check-all" tokenSize="2xs" className="text-vsc-success" />
            <Text size="2xs" tone="secondary">
              Consensus: {session.consensus.method}
              {session.consensus.merged && " (merged)"}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
});
