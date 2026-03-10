/**
 * RFC-004 compatible test harness.
 * Exposes window.__agentUx for automated testing and gate validation.
 */

import { getDefaultStore } from "jotai";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnAtomFamily, turnOrderAtom } from "~entities/message/turns";
import { checkpointsAtom, sessionMetaAtom } from "~entities/session/state";
import { timelineEventsAtom } from "~entities/timeline-event";

import type { MessageId, TurnId } from "../../shared/protocol";

function createTestHarness() {
  const store = getDefaultStore();

  return {
    getMessageIds: () => store.get(messageOrderAtom),
    getMessage: (id: string) => store.get(messageAtomFamily(id as MessageId)),
    getTurnIds: () => store.get(turnOrderAtom),
    getTurn: (id: string) => store.get(turnAtomFamily(id as TurnId)),
    getSessionMeta: () => store.get(sessionMetaAtom),
    getCheckpoints: () => store.get(checkpointsAtom),
    getTimelineEvents: () => store.get(timelineEventsAtom),
    getMessageCount: () => store.get(messageOrderAtom).length,
    getTurnCount: () => store.get(turnOrderAtom).length,
    snapshot: () => ({
      messages: store.get(messageOrderAtom).map((id) => store.get(messageAtomFamily(id))),
      turns: store.get(turnOrderAtom).map((id) => store.get(turnAtomFamily(id))),
      session: store.get(sessionMetaAtom),
      checkpoints: store.get(checkpointsAtom),
      timeline: store.get(timelineEventsAtom),
    }),
  };
}

const testHarness = createTestHarness();
(window as unknown as Record<string, unknown>).__agentUx = testHarness;

export { testHarness };
