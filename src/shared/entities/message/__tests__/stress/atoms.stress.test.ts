/**
 * Message/Turn Atom Edge-Case & Stress Tests
 *
 * Tests scenarios that normal functional tests miss:
 * - Orphan APPEND_TEXT to non-existent / deleted messages
 * - UPSERT_MESSAGE overwrite during active streaming
 * - SET_MESSAGE_STATUS on non-existent messages
 * - Out-of-order serverEvents: finalized before all text arrives
 * - Duplicate UPSERT operations (idempotency)
 * - Turn phase update on non-existent turns
 */
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
  setDiffLoadedAtom,
  setMessageStatusAtom,
  turnAtomFamily,
  turnOrderAtom,
  updateTurnPhaseAtom,
  upsertMessageAtom,
  upsertTurnAtom,
} from "../../model/atoms";

beforeEach(() => {
  resetIdCounter();
});

describe("Message atoms – edge cases & stress", () => {
  // ── Orphan Operations ──────────────────────────────────
  describe("orphan operations (target doesn't exist)", () => {
    it("APPEND_TEXT to non-existent message: silently ignored", () => {
      const store = createStore();

      store.set(appendTextAtom, { id: "ghost_msg" as MessageId, chunk: "lost data" });

      expect(store.get(messageAtomFamily("ghost_msg" as MessageId))).toBeNull();
      expect(store.get(messageOrderAtom)).toHaveLength(0);
    });

    it("SET_MESSAGE_STATUS on non-existent message: silently ignored", () => {
      const store = createStore();

      store.set(setMessageStatusAtom, { id: "ghost_msg" as MessageId, status: "final" });

      expect(store.get(messageAtomFamily("ghost_msg" as MessageId))).toBeNull();
    });

    it("SET_DIFF_LOADED on non-existent message: silently ignored", () => {
      const store = createStore();

      store.set(setDiffLoadedAtom, { id: "ghost_msg" as MessageId, diff_text: "some diff" });

      expect(store.get(messageAtomFamily("ghost_msg" as MessageId))).toBeNull();
    });

    it("UPDATE_TURN_PHASE on non-existent turn: silently ignored", () => {
      const store = createStore();

      store.set(updateTurnPhaseAtom, {
        turn_id: "ghost_turn" as TurnId,
        phase: "thinking",
        entry: { status: "success" },
      });

      expect(store.get(turnAtomFamily("ghost_turn" as TurnId))).toBeNull();
    });

    it("100 orphan APPEND_TEXT calls: no crash, no side effects", () => {
      const store = createStore();

      for (let i = 0; i < 100; i++) {
        store.set(appendTextAtom, { id: `nonexistent_${i}` as MessageId, chunk: "data" });
      }

      expect(store.get(messageOrderAtom)).toHaveLength(0);
    });
  });

  // ── Overwrite During Streaming ─────────────────────────
  describe("UPSERT_MESSAGE overwrite during streaming", () => {
    it("UPSERT overwrites accumulated text on same ID", () => {
      const store = createStore();

      // Start streaming
      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
      );

      // Accumulate 50 chunks
      for (let i = 0; i < 50; i++) {
        store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: `[${i}]` });
      }

      const beforeOverwrite = store.get(messageAtomFamily("msg_1" as MessageId));
      expect(beforeOverwrite!.text).toContain("[49]");

      // UPSERT replaces the message entirely
      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_1" as MessageId, text: "reset", status: "streaming" }),
      );

      const afterOverwrite = store.get(messageAtomFamily("msg_1" as MessageId));
      expect(afterOverwrite!.text).toBe("reset");

      // messageOrder should NOT have duplicate entries
      const order = store.get(messageOrderAtom);
      expect(order.filter((id) => id === "msg_1")).toHaveLength(1);
    });

    it("APPEND_TEXT interleaved with UPSERT_MESSAGE: last write wins", () => {
      const store = createStore();

      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_1" as MessageId, text: "v1", status: "streaming" }),
      );

      store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: "_appended" });
      expect(store.get(messageAtomFamily("msg_1" as MessageId))!.text).toBe("v1_appended");

      // UPSERT wipes the appended text
      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_1" as MessageId, text: "v2", status: "streaming" }),
      );
      expect(store.get(messageAtomFamily("msg_1" as MessageId))!.text).toBe("v2");

      store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: "_more" });
      expect(store.get(messageAtomFamily("msg_1" as MessageId))!.text).toBe("v2_more");
    });
  });

  // ── Out-of-Order ServerEvent Arrival ─────────────────────────
  describe("out-of-order serverEvent arrival", () => {
    it("status finalized BEFORE all text arrives: late text still appends", () => {
      const store = createStore();

      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_1" as MessageId, text: "Hello", status: "streaming" }),
      );

      // Finalize early
      store.set(setMessageStatusAtom, { id: "msg_1" as MessageId, status: "final" });
      expect(store.get(messageAtomFamily("msg_1" as MessageId))!.status).toBe("final");

      // Late text arrives after finalization
      store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: " World" });

      const msg = store.get(messageAtomFamily("msg_1" as MessageId));
      // Text is appended regardless of status (atoms don't guard on status)
      expect(msg!.text).toBe("Hello World");
      expect(msg!.status).toBe("final");
    });

    it("status cycles: streaming → final → error → streaming (retry scenario)", () => {
      const store = createStore();

      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
      );

      store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: "partial" });
      store.set(setMessageStatusAtom, { id: "msg_1" as MessageId, status: "final" });
      store.set(setMessageStatusAtom, { id: "msg_1" as MessageId, status: "error" });
      store.set(setMessageStatusAtom, { id: "msg_1" as MessageId, status: "streaming" });
      store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: " retry" });
      store.set(setMessageStatusAtom, { id: "msg_1" as MessageId, status: "final" });

      const msg = store.get(messageAtomFamily("msg_1" as MessageId));
      expect(msg!.text).toBe("partial retry");
      expect(msg!.status).toBe("final");
    });

    it("turn created AFTER messages referencing it: no crash", () => {
      const store = createStore();

      // Create messages first
      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_1" as MessageId, turn_id: "turn_1" as TurnId }),
      );

      // Turn arrives late
      store.set(
        upsertTurnAtom,
        createTurn({
          id: "turn_1" as TurnId,
          phases: [
            createTurnPhase({
              phase: "user_message",
              message_ids: ["msg_1" as MessageId],
              status: "success",
            }),
          ],
        }),
      );

      expect(store.get(turnAtomFamily("turn_1" as TurnId))).not.toBeNull();
      expect(store.get(messageAtomFamily("msg_1" as MessageId))).not.toBeNull();
    });
  });

  // ── Duplicate UPSERT Idempotency ───────────────────────
  describe("duplicate UPSERT idempotency", () => {
    it("same message UPSERT 100x: order array has exactly 1 entry", () => {
      const store = createStore();

      for (let i = 0; i < 100; i++) {
        store.set(
          upsertMessageAtom,
          createMessage({ id: "msg_1" as MessageId, text: `version_${i}` }),
        );
      }

      expect(store.get(messageOrderAtom)).toHaveLength(1);
      expect(store.get(messageAtomFamily("msg_1" as MessageId))!.text).toBe("version_99");
    });

    it("same turn UPSERT 100x: order array has exactly 1 entry", () => {
      const store = createStore();

      for (let i = 0; i < 100; i++) {
        store.set(
          upsertTurnAtom,
          createTurn({
            id: "turn_1" as TurnId,
            status: i === 99 ? "success" : "running",
          }),
        );
      }

      expect(store.get(turnOrderAtom)).toHaveLength(1);
      expect(store.get(turnAtomFamily("turn_1" as TurnId))!.status).toBe("success");
    });
  });

  // ── Turn Phase Edge Cases ──────────────────────────────
  describe("turn phase edge cases", () => {
    it("update all 6 phases rapidly on same turn: all update independently", () => {
      const store = createStore();
      const phases = [
        "user_message",
        "thinking",
        "analysis",
        "plan",
        "changes",
        "summary",
      ] as const;

      store.set(
        upsertTurnAtom,
        createTurn({
          id: "turn_1" as TurnId,
          phases: phases.map((p) => createTurnPhase({ phase: p, status: "pending" })),
        }),
      );

      // Update each phase 50 times
      for (let i = 0; i < 50; i++) {
        for (const phase of phases) {
          store.set(updateTurnPhaseAtom, {
            turn_id: "turn_1" as TurnId,
            phase,
            entry: { summary: `${phase}_iter_${i}`, status: i === 49 ? "success" : "running" },
          });
        }
      }

      const turn = store.get(turnAtomFamily("turn_1" as TurnId));
      expect(turn!.phases).toHaveLength(6);
      for (const phase of phases) {
        const entry = turn!.phases.find((p) => p.phase === phase);
        expect(entry!.summary).toBe(`${phase}_iter_49`);
        expect(entry!.status).toBe("success");
      }
    });

    it("add new phase via UPDATE_TURN_PHASE on turn that doesn't have it", () => {
      const store = createStore();

      store.set(
        upsertTurnAtom,
        createTurn({
          id: "turn_1" as TurnId,
          phases: [createTurnPhase({ phase: "user_message", status: "success" })],
        }),
      );

      // Add a phase that didn't exist
      store.set(updateTurnPhaseAtom, {
        turn_id: "turn_1" as TurnId,
        phase: "analysis",
        entry: { status: "running", summary: "new phase" },
      });

      const turn = store.get(turnAtomFamily("turn_1" as TurnId));
      expect(turn!.phases).toHaveLength(2);
      const analysis = turn!.phases.find((p) => p.phase === "analysis");
      expect(analysis!.status).toBe("running");
      expect(analysis!.summary).toBe("new phase");
    });
  });

  // ── Large Text Accumulation ────────────────────────────
  describe("large text accumulation", () => {
    it("100,000 single-char appends: text = 100K chars, no corruption", () => {
      const store = createStore();

      store.set(
        upsertMessageAtom,
        createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
      );

      for (let i = 0; i < 100_000; i++) {
        store.set(appendTextAtom, { id: "msg_1" as MessageId, chunk: "x" });
      }

      const msg = store.get(messageAtomFamily("msg_1" as MessageId));
      expect(msg!.text).toHaveLength(100_000);
      expect(msg!.text).toBe("x".repeat(100_000));
    });
  });
});
