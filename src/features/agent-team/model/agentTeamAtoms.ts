/**
 * Agent Team atoms (AO-08).
 *
 * Manages agent-to-agent (P2P) communication messages
 * and team panel visibility.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { AgentMessage } from "../../../shared/protocol";

// ─── Panel Visibility ────────────────────────────────────────

/** Whether the agent team panel is open */
export const agentTeamPanelOpenAtom = atom(false);

// ─── Agent Messages Data ─────────────────────────────────────

/** All agent messages (ordered by timestamp) */
export const agentMessagesAtom = atom<readonly AgentMessage[]>([]);

/** Write-only: replace all agent messages */
export const setAgentMessagesAtom = atom(null, (_get, set, messages: readonly AgentMessage[]) => {
  const sorted = [...messages].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  set(agentMessagesAtom, sorted);
});

/** Derived: unique agent IDs involved in communication */
export const agentParticipantsAtom = atom((get) => {
  const messages = get(agentMessagesAtom);
  const ids = new Set<string>();
  for (const msg of messages) {
    ids.add(msg.from_agent);
    ids.add(msg.to_agent);
  }
  return [...ids].sort();
});

/** Derived: count of messages by type */
export const agentMessageCountsAtom = atom((get) => {
  const messages = get(agentMessagesAtom);
  let request = 0;
  let response = 0;
  let broadcast = 0;
  for (const msg of messages) {
    if (msg.message_type === "request") request++;
    else if (msg.message_type === "response") response++;
    else broadcast++;
  }
  return { request, response, broadcast, total: messages.length };
});

/** Write-only: reset agent team store */
export const resetAgentTeamStoreAtom = atom(null, (_get, set) => {
  set(agentMessagesAtom, []);
  set(agentTeamPanelOpenAtom, false);
});

registerResetAtom(resetAgentTeamStoreAtom);
