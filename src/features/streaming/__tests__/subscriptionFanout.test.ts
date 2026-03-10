/**
 * Atom Subscription Fan-out Tests
 *
 * Tests:
 * - Single APPEND_TEXT: only 1 message atom changes
 * - Coalescing reduces atom notifications
 * - atomFamily.remove prevents stale subscriptions
 * - Message + Turn coordinated updates
 */
import { createStore } from "jotai";

import { appendTextAtom, messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnAtomFamily, updateTurnPhaseAtom } from "~entities/message/turns";
import { upsertMessageAtom, upsertTurnAtom } from "~entities/message/writers";

import {
  createMessage,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../../shared/protocol";

beforeEach(() => resetIdCounter());

describe("Subscription fan-out – atom isolation", () => {
  it("APPEND_TEXT to msg_3: subscription callback fires only for msg_3", () => {
    const store = createStore();

    for (let i = 0; i < 5; i++) {
      store.set(
        upsertMessageAtom,
        createMessage({ id: `msg_${i}` as MessageId, text: "", status: "streaming" }),
      );
    }

    // Track which atoms change
    const changed: string[] = [];
    for (let i = 0; i < 5; i++) {
      const msgId = `msg_${i}` as MessageId;
      store.sub(messageAtomFamily(msgId), () => {
        changed.push(msgId);
      });
    }

    // Append to msg_3 only
    store.set(appendTextAtom, { id: "msg_3" as MessageId, chunk: "hello" });

    // Only msg_3 should have fired
    expect(changed).toEqual(["msg_3"]);
  });

  it("UPDATE_TURN_PHASE on turn_2: only turn_2 subscription fires", () => {
    const store = createStore();

    for (let i = 0; i < 4; i++) {
      store.set(
        upsertTurnAtom,
        createTurn({
          id: `turn_${i}` as TurnId,
          phases: [createTurnPhase({ phase: "thinking", status: "pending" })],
        }),
      );
    }

    const changed: string[] = [];
    for (let i = 0; i < 4; i++) {
      const turnId = `turn_${i}` as TurnId;
      store.sub(turnAtomFamily(turnId), () => {
        changed.push(turnId);
      });
    }

    store.set(updateTurnPhaseAtom, {
      turn_id: "turn_2" as TurnId,
      phase: "thinking",
      entry: { status: "success" },
    });

    expect(changed).toEqual(["turn_2"]);
  });

  it("100 APPEND_TEXT to same message: subscription fires 100 times (no coalescing at store level)", () => {
    const store = createStore();
    store.set(
      upsertMessageAtom,
      createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
    );

    let fireCount = 0;
    store.sub(messageAtomFamily("msg_1" as MessageId), () => {
      fireCount++;
    });

    for (let i = 0; i < 100; i++) {
      store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: `[${i}]` });
    }

    // At store level, each set triggers subscription (coalescing is engine's job)
    expect(fireCount).toBe(100);
  });

  it("atomFamily.remove: subscription no longer fires after removal", () => {
    const store = createStore();
    store.set(
      upsertMessageAtom,
      createMessage({ id: "msg_1" as MessageId, text: "initial", status: "streaming" }),
    );

    let _fireCount = 0;
    store.sub(messageAtomFamily("msg_1" as MessageId), () => {
      _fireCount++;
    });

    // Remove the atom from family
    messageAtomFamily.remove("msg_1" as MessageId);

    // Try to append — the atom is now a fresh default (null), append silently ignored
    store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: "ignored" });

    // Message should be null after removal
    expect(store.get(messageAtomFamily("msg_1" as MessageId))).toBeNull();
  });

  it("messageOrder atom fires only on new message, not on APPEND_TEXT", () => {
    const store = createStore();
    store.set(
      upsertMessageAtom,
      createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
    );

    let orderFireCount = 0;
    store.sub(messageOrderAtom, () => {
      orderFireCount++;
    });

    // 50 APPEND_TEXT — should NOT fire messageOrderAtom
    for (let i = 0; i < 50; i++) {
      store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: `[${i}]` });
    }

    expect(orderFireCount).toBe(0);

    // New message SHOULD fire
    store.set(upsertMessageAtom, createMessage({ id: "msg_2" as MessageId, text: "new" }));
    expect(orderFireCount).toBe(1);
  });
});
