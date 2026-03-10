import React, { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import {
  agentMessageCountsAtom,
  agentMessagesAtom,
  agentParticipantsAtom,
  agentTeamPanelOpenAtom,
} from "../../features/agent-team";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import type { AgentMessage } from "../../shared/protocol";
import { Badge, Button, cn, EmptyState, Icon, Text, Tooltip } from "../../shared/ui";

// ─── Helpers ─────────────────────────────────────────────────

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const messageTypeBadgeVariant: Record<
  AgentMessage["message_type"],
  "default" | "warning" | "success"
> = {
  request: "warning",
  response: "success",
  broadcast: "default",
};

// ─── Message Row ─────────────────────────────────────────────

interface AgentMessageRowProps {
  message: AgentMessage;
}

const AgentMessageRow = React.memo(function AgentMessageRow({ message }: AgentMessageRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-2 rounded border border-vsc-border",
        "bg-vsc-bg-secondary",
        message.message_type === "broadcast" && "border-l-2 border-l-vsc-warning",
        message.message_type === "request" && "border-l-2 border-l-vsc-focus",
        message.message_type === "response" && "border-l-2 border-l-vsc-success",
      )}
      data-testid={`agent-message-${message.id}`}
      role="listitem"
    >
      {/* Header: from -> to + type + timestamp */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge text={message.from_agent} variant="default" />
        <Icon name="arrow-right" tokenSize="2xs" className="text-vsc-text-tertiary" />
        <Badge text={message.to_agent} variant="default" />
        <Badge
          text={message.message_type}
          variant={messageTypeBadgeVariant[message.message_type]}
        />
        <Text size="2xs" tone="tertiary" className="ml-auto">
          {formatTimestamp(message.timestamp_ms)}
        </Text>
      </div>
      {/* Content */}
      <Text size="xs" className="whitespace-pre-wrap break-words">
        {message.content}
      </Text>
    </div>
  );
});

// ─── Agent Team Chat ─────────────────────────────────────────

/**
 * Agent Team Chat: Visualizes agent-to-agent P2P communication.
 * Shows a chat thread with sender/receiver badges, message types,
 * and a human intervention button.
 */
export const AgentTeamChat = React.memo(function AgentTeamChat() {
  const [panelOpen, setPanelOpen] = useAtom(agentTeamPanelOpenAtom);
  const messages = useAtomValue(agentMessagesAtom);
  const participants = useAtomValue(agentParticipantsAtom);
  const counts = useAtomValue(agentMessageCountsAtom);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  const handleIntervene = useCallback(() => {
    const target = participants[0];
    if (target !== undefined) {
      try {
        getVscodeApi().postMessage({
          type: "SEND_AGENT_INTERVENTION",
          agent_id: target,
          message: "",
        });
      } catch (err) {
        console.error("Failed to send agent intervention:", err);
      }
    }
  }, [participants]);

  if (!panelOpen) return null;

  return (
    <div
      className="flex flex-col gap-2 p-3 border-b border-vsc-border bg-vsc-bg"
      data-testid="agent-team-chat"
      role="region"
      aria-label="Agent Team Chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon name="comment-discussion" tokenSize="sm" className="text-vsc-text-secondary" />
          <Text size="sm" weight="semibold">
            Agent Team
          </Text>
          {participants.length > 0 && (
            <Text size="2xs" tone="tertiary">
              {participants.length} {participants.length === 1 ? "agent" : "agents"}
            </Text>
          )}
          {counts.total > 0 && <Badge text={`${counts.total} msgs`} variant="default" />}
        </div>
        <div className="flex items-center gap-1">
          {participants.length > 0 && (
            <Tooltip content="Intervene - send human override">
              <Button variant="ghost" size="sm" onClick={handleIntervene} aria-label="Intervene">
                <Icon name="debug-pause" tokenSize="2xs" />
                <span className="ml-1 text-xs">Intervene</span>
              </Button>
            </Tooltip>
          )}
          <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close Agent Team">
            <Icon name="close" tokenSize="2xs" />
          </Button>
        </div>
      </div>

      {/* Participant badges */}
      {participants.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap" data-testid="agent-participants">
          {participants.map((agent) => (
            <Badge key={agent} text={agent} variant="default" />
          ))}
        </div>
      )}

      {/* Message thread */}
      {messages.length === 0 ? (
        <EmptyState
          icon="comment-discussion"
          title="No agent messages"
          description="Agent-to-agent messages will appear here."
        />
      ) : (
        <div
          className="flex flex-col gap-1.5 max-h-[--panel-max-h-sm] overflow-y-auto scroll-shadow"
          role="list"
          aria-label="Agent messages"
        >
          {messages.map((msg) => (
            <AgentMessageRow key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
});
