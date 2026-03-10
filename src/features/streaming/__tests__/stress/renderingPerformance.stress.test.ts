/**
 * Rendering Performance Regression Guard Tests
 *
 * Tests:
 * - StreamingEngine coalescing: 1000 APPEND_TEXT → fewer commits
 * - Atom subscription isolation: only affected atoms notify
 * - atomFamily cleanup after RESET_STORES
 * - useCallback stability in dispatcher
 * - Back-pressure: large buffer forces sync flush
 */
import { createStore } from "jotai";

import { resetDiffStoreAtom } from "~entities/diff";
import { appendTextAtom, messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnAtomFamily, turnOrderAtom, updateTurnPhaseAtom } from "~entities/message/turns";
import { resetMessageStoreAtom, upsertMessageAtom, upsertTurnAtom } from "~entities/message/writers";
import { resetSessionStoreAtom } from "~entities/session/state";
import { resetTimelineStoreAtom } from "~entities/timeline-event";
import { resetToolCallStoreAtom } from "~entities/tool-call";

import {
  createMessage,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "../../../../shared/lib/mocks";
import { createStreamingEngine } from "../../../../shared/lib/streaming/streamingEngine";
import type { MessageId, ServerEvent, TurnId } from "../../../../shared/protocol";

beforeEach(() => resetIdCounter());

describe("Rendering performance – regression guards", () => {
  describe("StreamingEngine coalescing effectiveness", () => {
    it("1000 APPEND_TEXT to same message: coalesced to far fewer commits", () => {
      let commitCount = 0;
      let totalServerEventsCommitted = 0;

      const engine = createStreamingEngine((serverEvents) => {
        commitCount++;
        totalServerEventsCommitted += serverEvents.length;
      });

      // Push 1000 individual APPEND_TEXT serverEvents for same message
      for (let i = 0; i < 1000; i++) {
        engine.push({
          t: "APPEND_TEXT",
          id: "msg_1" as MessageId,
          chunk: `token_${i} `,
        } as ServerEvent);
      }

      // Force final flush
      engine.flush();
      engine.destroy({ flush: false });

      // Coalescing should reduce 1000 APPEND_TEXT → much fewer committed serverEvents
      // (consecutive APPEND_TEXT with same id are merged)
      expect(totalServerEventsCommitted).toBeLessThan(100); // Well under 1000
      // Commits happen per rAF + back-pressure flushes
      expect(commitCount).toBeGreaterThan(0);
    });

    it("mixed serverEvent types: only consecutive APPEND_TEXT coalesced", () => {
      const committed: ServerEvent[][] = [];

      const engine = createStreamingEngine((serverEvents) => {
        committed.push([...serverEvents]);
      });

      // Alternate APPEND_TEXT and NOP
      for (let i = 0; i < 10; i++) {
        engine.push({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: `a` } as ServerEvent);
        engine.push({ t: "NOP" } as ServerEvent);
      }

      engine.flush();
      engine.destroy({ flush: false });

      // Each APPEND_TEXT is separated by NOP, so no coalescing possible
      const allServerEvents = committed.flat();
      const appendCount = allServerEvents.filter((d) => d.t === "APPEND_TEXT").length;
      expect(appendCount).toBe(10); // No coalescing, all 10 preserved
    });

    it("back-pressure: buffer > maxBufferSize forces sync flush", () => {
      let syncFlushCount = 0;

      const engine = createStreamingEngine(
        () => {
          syncFlushCount++;
        },
        { maxBufferSize: 50 },
      );

      // Push 200 serverEvents rapidly (should trigger 4 sync flushes at 50 each)
      for (let i = 0; i < 200; i++) {
        engine.push({ t: "NOP" } as ServerEvent);
      }

      // At least 3 sync flushes (200/50 = 4, minus any rAF)
      expect(syncFlushCount).toBeGreaterThanOrEqual(3);

      engine.destroy({ flush: false });
    });
  });

  describe("atom subscription isolation", () => {
    it("APPEND_TEXT to msg_5: only msg_5 atom changes, others untouched", () => {
      const store = createStore();

      // Create 10 messages
      for (let i = 0; i < 10; i++) {
        store.set(
          upsertMessageAtom,
          createMessage({
            id: `msg_${i}` as MessageId,
            text: `original_${i}`,
            status: "streaming",
          }),
        );
      }

      // Snapshot all messages before
      const beforeTexts = Array.from(
        { length: 10 },
        (_, i) => store.get(messageAtomFamily(`msg_${i}` as MessageId))!.text,
      );

      // Append only to msg_5
      store.set(appendTextAtom, { id: "msg_5" as MessageId, chunk: "_appended" });

      // Verify only msg_5 changed
      for (let i = 0; i < 10; i++) {
        const msg = store.get(messageAtomFamily(`msg_${i}` as MessageId));
        if (i === 5) {
          expect(msg!.text).toBe("original_5_appended");
        } else {
          expect(msg!.text).toBe(beforeTexts[i]);
        }
      }
    });

    it("UPDATE_TURN_PHASE on turn_3: other turns untouched", () => {
      const store = createStore();

      for (let i = 0; i < 5; i++) {
        store.set(
          upsertTurnAtom,
          createTurn({
            id: `turn_${i}` as TurnId,
            phases: [
              createTurnPhase({ phase: "thinking", status: "pending", summary: `initial_${i}` }),
            ],
          }),
        );
      }

      // Update only turn_3
      store.set(updateTurnPhaseAtom, {
        turn_id: "turn_3" as TurnId,
        phase: "thinking",
        entry: { status: "success", summary: "updated_3" },
      });

      // Only turn_3 changed
      for (let i = 0; i < 5; i++) {
        const turn = store.get(turnAtomFamily(`turn_${i}` as TurnId));
        const thinking = turn!.phases.find((p) => p.phase === "thinking");
        if (i === 3) {
          expect(thinking!.summary).toBe("updated_3");
          expect(thinking!.status).toBe("success");
        } else {
          expect(thinking!.summary).toBe(`initial_${i}`);
          expect(thinking!.status).toBe("pending");
        }
      }
    });
  });

  describe("atomFamily cleanup on RESET_STORES", () => {
    it("500 messages → RESET → atoms return null", () => {
      const store = createStore();

      for (let i = 0; i < 500; i++) {
        store.set(
          upsertMessageAtom,
          createMessage({ id: `msg_${i}` as MessageId, text: `text_${i}` }),
        );
      }
      expect(store.get(messageOrderAtom)).toHaveLength(500);

      // Reset
      store.set(resetMessageStoreAtom);
      store.set(resetDiffStoreAtom);
      store.set(resetToolCallStoreAtom);
      store.set(resetTimelineStoreAtom);
      store.set(resetSessionStoreAtom);

      expect(store.get(messageOrderAtom)).toHaveLength(0);
      expect(store.get(turnOrderAtom)).toHaveLength(0);

      // Cleaned atoms return null (atomFamily.remove was called)
      for (let i = 0; i < 500; i++) {
        expect(store.get(messageAtomFamily(`msg_${i}` as MessageId))).toBeNull();
      }
    });
  });

  describe("engine destroy behavior", () => {
    it("destroy with flush=true: remaining buffer committed", () => {
      let lastCommit: ServerEvent[] = [];
      const engine = createStreamingEngine((serverEvents) => {
        lastCommit = [...serverEvents];
      });

      engine.push({ t: "NOP" } as ServerEvent);
      engine.push({ t: "NOP" } as ServerEvent);
      expect(engine.bufferSize).toBe(2);

      engine.destroy({ flush: true });
      expect(lastCommit).toHaveLength(2);
    });

    it("destroy with flush=false: buffer discarded", () => {
      let commitCalled = false;
      const engine = createStreamingEngine(() => {
        commitCalled = true;
      });

      engine.push({ t: "NOP" } as ServerEvent);
      engine.destroy({ flush: false });

      expect(commitCalled).toBe(false);
    });

    it("push after destroy: silently ignored", () => {
      let commitCount = 0;
      const engine = createStreamingEngine(() => {
        commitCount++;
      });

      engine.destroy();
      engine.push({ t: "NOP" } as ServerEvent);
      engine.flush();

      expect(commitCount).toBe(0);
    });
  });
});
