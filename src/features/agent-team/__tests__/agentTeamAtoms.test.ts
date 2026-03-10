import { createStore } from "jotai";

import { createAgentMessage, resetIdCounter } from "../../../shared/lib/mocks";
import {
  agentMessageCountsAtom,
  agentMessagesAtom,
  agentParticipantsAtom,
  agentTeamPanelOpenAtom,
  resetAgentTeamStoreAtom,
  setAgentMessagesAtom,
} from "../model/agentTeamAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("agentTeamAtoms", () => {
  it("starts with empty messages and closed panel", () => {
    const store = createStore();
    expect(store.get(agentMessagesAtom)).toEqual([]);
    expect(store.get(agentTeamPanelOpenAtom)).toBe(false);
  });

  it("setAgentMessagesAtom populates messages sorted by timestamp", () => {
    const store = createStore();
    const msg1 = createAgentMessage({ id: "m1", timestamp_ms: 2000 });
    const msg2 = createAgentMessage({ id: "m2", timestamp_ms: 1000 });
    const msg3 = createAgentMessage({ id: "m3", timestamp_ms: 3000 });

    store.set(setAgentMessagesAtom, [msg1, msg2, msg3]);

    const messages = store.get(agentMessagesAtom);
    expect(messages).toHaveLength(3);
    expect(messages[0]?.id).toBe("m2");
    expect(messages[1]?.id).toBe("m1");
    expect(messages[2]?.id).toBe("m3");
  });

  it("agentParticipantsAtom returns unique sorted agent IDs", () => {
    const store = createStore();
    store.set(setAgentMessagesAtom, [
      createAgentMessage({ from_agent: "beta", to_agent: "alpha" }),
      createAgentMessage({ from_agent: "alpha", to_agent: "gamma" }),
      createAgentMessage({ from_agent: "gamma", to_agent: "beta" }),
    ]);

    const participants = store.get(agentParticipantsAtom);
    expect(participants).toEqual(["alpha", "beta", "gamma"]);
  });

  it("agentMessageCountsAtom computes correct counts", () => {
    const store = createStore();
    store.set(setAgentMessagesAtom, [
      createAgentMessage({ id: "m1", message_type: "request" }),
      createAgentMessage({ id: "m2", message_type: "request" }),
      createAgentMessage({ id: "m3", message_type: "response" }),
      createAgentMessage({ id: "m4", message_type: "broadcast" }),
    ]);

    const counts = store.get(agentMessageCountsAtom);
    expect(counts.request).toBe(2);
    expect(counts.response).toBe(1);
    expect(counts.broadcast).toBe(1);
    expect(counts.total).toBe(4);
  });

  it("resetAgentTeamStoreAtom clears all state", () => {
    const store = createStore();
    store.set(setAgentMessagesAtom, [createAgentMessage({ id: "m1" })]);
    store.set(agentTeamPanelOpenAtom, true);

    store.set(resetAgentTeamStoreAtom);

    expect(store.get(agentMessagesAtom)).toEqual([]);
    expect(store.get(agentTeamPanelOpenAtom)).toBe(false);
  });

  it("replacing messages replaces the list entirely", () => {
    const store = createStore();

    store.set(setAgentMessagesAtom, [createAgentMessage({ id: "m1", content: "First" })]);
    expect(store.get(agentMessagesAtom)).toHaveLength(1);

    store.set(setAgentMessagesAtom, [
      createAgentMessage({ id: "m2", content: "Second" }),
      createAgentMessage({ id: "m3", content: "Third" }),
    ]);
    const messages = store.get(agentMessagesAtom);
    expect(messages).toHaveLength(2);
    expect(messages.some((m) => m.id === "m1")).toBe(false);
  });

  it("handles empty participants for no messages", () => {
    const store = createStore();
    expect(store.get(agentParticipantsAtom)).toEqual([]);
  });

  it("counts are all zero for empty messages", () => {
    const store = createStore();
    const counts = store.get(agentMessageCountsAtom);
    expect(counts).toEqual({ request: 0, response: 0, broadcast: 0, total: 0 });
  });
});
