import { createStore } from "jotai";

import {
  createMessage,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "~shared/lib/mocks";
import type { MessageId, TurnId } from "~shared/protocol";

import {
  appendTextAtom,
  messageAtomFamily,
  messageOrderAtom,
  setMessageStatusAtom,
  turnAtomFamily,
  turnOrderAtom,
  updateTurnPhaseAtom,
  upsertMessageAtom,
  upsertTurnAtom,
} from "../model/atoms";

beforeEach(() => {
  resetIdCounter();
});

describe("upsertMessageAtom", () => {
  it("new message: updates messageOrder and stores message in atomFamily", () => {
    const store = createStore();
    const msg = createMessage({ id: "msg_1" as MessageId });

    store.set(upsertMessageAtom, msg);

    expect(store.get(messageOrderAtom)).toEqual(["msg_1"]);
    expect(store.get(messageAtomFamily("msg_1" as MessageId))).toEqual(msg);
  });

  it("existing ID: updates message without duplicating in order", () => {
    const store = createStore();
    const msg1 = createMessage({ id: "msg_1" as MessageId, text: "Hello" });
    const msg1Updated = createMessage({ id: "msg_1" as MessageId, text: "Hello updated" });

    store.set(upsertMessageAtom, msg1);
    store.set(upsertMessageAtom, msg1Updated);

    expect(store.get(messageOrderAtom)).toEqual(["msg_1"]);
    expect(store.get(messageAtomFamily("msg_1" as MessageId))?.text).toBe("Hello updated");
  });
});

describe("appendTextAtom", () => {
  it("concatenates chunk to existing message text", () => {
    const store = createStore();
    const msg = createMessage({ id: "msg_1" as MessageId, text: "Hello" });
    store.set(upsertMessageAtom, msg);

    store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: " world" });

    expect(store.get(messageAtomFamily("msg_1" as MessageId))?.text).toBe("Hello world");
  });

  it("missing ID: no-op (no throw)", () => {
    const store = createStore();

    // Should not throw when appending to a non-existent message
    expect(() => {
      store.set(appendTextAtom, { id: "nonexistent" as MessageId, chunk: "data" });
    }).not.toThrow();
  });
});

describe("setMessageStatusAtom", () => {
  it("updates the status field of an existing message", () => {
    const store = createStore();
    const msg = createMessage({ id: "msg_1" as MessageId, status: "streaming" });
    store.set(upsertMessageAtom, msg);

    store.set(setMessageStatusAtom, { id: "msg_1" as MessageId, status: "final" });

    expect(store.get(messageAtomFamily("msg_1" as MessageId))?.status).toBe("final");
  });
});

describe("upsertTurnAtom", () => {
  it("new turn: updates turnOrder and stores turn in atomFamily", () => {
    const store = createStore();
    const turn = createTurn({ id: "turn_1" as TurnId });

    store.set(upsertTurnAtom, turn);

    expect(store.get(turnOrderAtom)).toEqual(["turn_1"]);
    expect(store.get(turnAtomFamily("turn_1" as TurnId))).toEqual(turn);
  });

  it("existing turn: merges and preserves phases if new turn has empty phases", () => {
    const store = createStore();
    const originalPhases = [
      createTurnPhase({ phase: "thinking", status: "success" }),
      createTurnPhase({ phase: "analysis", status: "running" }),
    ];
    const turn = createTurn({ id: "turn_1" as TurnId, phases: originalPhases, status: "running" });
    store.set(upsertTurnAtom, turn);

    // Upsert with empty phases — should preserve existing phases
    const turnUpdate = createTurn({ id: "turn_1" as TurnId, phases: [], status: "success" });
    store.set(upsertTurnAtom, turnUpdate);

    const result = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(result?.status).toBe("success");
    expect(result?.phases).toEqual(originalPhases);
  });
});

describe("updateTurnPhaseAtom", () => {
  it("updates existing phase entry", () => {
    const store = createStore();
    const turn = createTurn({
      id: "turn_1" as TurnId,
      phases: [createTurnPhase({ phase: "thinking", status: "pending" })],
    });
    store.set(upsertTurnAtom, turn);

    store.set(updateTurnPhaseAtom, {
      turn_id: "turn_1" as TurnId,
      phase: "thinking",
      entry: { status: "success", summary: "Thought about it" },
    });

    const result = store.get(turnAtomFamily("turn_1" as TurnId));
    const thinkingPhase = result?.phases.find((p) => p.phase === "thinking");
    expect(thinkingPhase?.status).toBe("success");
    expect(thinkingPhase?.summary).toBe("Thought about it");
  });

  it("adds new phase if it does not exist", () => {
    const store = createStore();
    const turn = createTurn({
      id: "turn_1" as TurnId,
      phases: [createTurnPhase({ phase: "thinking", status: "success" })],
    });
    store.set(upsertTurnAtom, turn);

    store.set(updateTurnPhaseAtom, {
      turn_id: "turn_1" as TurnId,
      phase: "analysis",
      entry: { status: "running", summary: "Analyzing code" },
    });

    const result = store.get(turnAtomFamily("turn_1" as TurnId));
    expect(result?.phases).toHaveLength(2);
    const analysisPhase = result?.phases.find((p) => p.phase === "analysis");
    expect(analysisPhase).toBeDefined();
    expect(analysisPhase?.status).toBe("running");
    expect(analysisPhase?.summary).toBe("Analyzing code");
    // New phases that are not "user_message" or "summary" should be collapsed by default
    expect(analysisPhase?.collapsed).toBe(true);
  });
});
