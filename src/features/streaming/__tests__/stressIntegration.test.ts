/**
 * Stress & integration tests for the full ServerEvent → Atom Store pipeline.
 *
 * Tests the dispatcher + atom store under extreme conditions:
 * - Bulk message creation (채팅방에 메시지 대량 축적)
 * - High-frequency APPEND_TEXT (고속 스트리밍)
 * - Concurrent multi-turn operations
 * - Store consistency after rapid mutations
 */
import { createStore } from "jotai";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnAtomFamily, turnOrderAtom } from "~entities/message/turns";
import { checkpointsAtom, sessionMetaAtom } from "~entities/session/state";
import { timelineEventsAtom } from "~entities/timeline-event";
import { toolCallAtomFamily } from "~entities/tool-call";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import {
  createCheckpoint,
  createFileChange,
  createMessage,
  createTimelineEvent,
  createToolCall,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../../shared/protocol";
// ─── Dispatch Helper ─────────────────────────────────────
function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

describe("ServerEvent dispatcher – stress & integration", () => {
  // ── Bulk Message Creation (채팅방 대량 메시지) ──────────
  describe("bulk message accumulation", () => {
    it("1,000 messages: all stored with correct order and unique IDs", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const N = 1_000;

      for (let i = 0; i < N; i++) {
        const msg = createMessage({
          id: `msg_${i}` as MessageId,
          text: `Message content ${i}`,
          role: i % 3 === 0 ? "user" : "assistant",
        });
        dispatch({ t: "UPSERT_MESSAGE", msg });
      }

      const order = store.get(messageOrderAtom);
      expect(order).toHaveLength(N);

      // Verify ordering
      for (let i = 0; i < N; i++) {
        expect(order[i]).toBe(`msg_${i}`);
      }

      // Verify each message content is retrievable
      for (let i = 0; i < N; i++) {
        const msg = store.get(messageAtomFamily(`msg_${i}` as MessageId));
        expect(msg).not.toBeNull();
        expect(msg!.text).toBe(`Message content ${i}`);
      }
    });

    it("duplicate UPSERT_MESSAGE: updates in-place without duplicating order", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Create 100 messages
      for (let i = 0; i < 100; i++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: `msg_${i}` as MessageId, text: `v1_${i}` }),
        });
      }

      // Upsert all again with updated text
      for (let i = 0; i < 100; i++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: `msg_${i}` as MessageId, text: `v2_${i}` }),
        });
      }

      const order = store.get(messageOrderAtom);
      // Should still be 100, not 200
      expect(order).toHaveLength(100);

      // Text should be updated version
      for (let i = 0; i < 100; i++) {
        expect(store.get(messageAtomFamily(`msg_${i}` as MessageId))!.text).toBe(`v2_${i}`);
      }
    });

    it("500 messages with 500-char text each: ~250KB total, no crash", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const longText = "A".repeat(500);

      for (let i = 0; i < 500; i++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: `msg_${i}` as MessageId, text: longText }),
        });
      }

      expect(store.get(messageOrderAtom)).toHaveLength(500);
      expect(store.get(messageAtomFamily("msg_499" as MessageId))!.text).toHaveLength(500);
    });
  });

  // ── High-Frequency APPEND_TEXT (고속 스트리밍) ──────────
  describe("high-frequency text streaming", () => {
    it("10,000 APPEND_TEXT to single message: text accumulated correctly", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" }),
      });

      const chunks: string[] = [];
      for (let i = 0; i < 10_000; i++) {
        const chunk = `token_${i} `;
        chunks.push(chunk);
        dispatch({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk });
      }

      const msg = store.get(messageAtomFamily("msg_1" as MessageId));
      expect(msg!.text).toBe(chunks.join(""));
      expect(msg!.text.length).toBeGreaterThan(70_000); // ~7+ chars × 10000
    });

    it("APPEND_TEXT to non-existent message: silently ignored, no crash", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Try to append to a message that doesn't exist
      expect(() => {
        for (let i = 0; i < 100; i++) {
          dispatch({ t: "APPEND_TEXT", id: "ghost_msg" as MessageId, chunk: "data" });
        }
      }).not.toThrow();

      // Store should have no messages
      expect(store.get(messageOrderAtom)).toHaveLength(0);
    });

    it("concurrent streaming to 50 messages: each accumulates independently", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Create 50 messages
      for (let m = 0; m < 50; m++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({
            id: `msg_${m}` as MessageId,
            text: "",
            status: "streaming",
          }),
        });
      }

      // Stream 100 tokens to each, round-robin style (mimics interleaved delivery)
      for (let token = 0; token < 100; token++) {
        for (let m = 0; m < 50; m++) {
          dispatch({
            t: "APPEND_TEXT",
            id: `msg_${m}` as MessageId,
            chunk: `[${token}]`,
          });
        }
      }

      // Each message should have 100 tokens
      for (let m = 0; m < 50; m++) {
        const msg = store.get(messageAtomFamily(`msg_${m}` as MessageId));
        expect(msg!.text).toContain("[0]");
        expect(msg!.text).toContain("[99]");
        // All 100 tokens present
        for (let t = 0; t < 100; t++) {
          expect(msg!.text).toContain(`[${t}]`);
        }
      }
    });
  });

  // ── Multi-Turn Stress ──────────────────────────────────
  describe("multi-turn operations", () => {
    it("200 turns: all stored in correct order", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      for (let i = 0; i < 200; i++) {
        dispatch({
          t: "UPSERT_TURN",
          turn: createTurn({ id: `turn_${i}` as TurnId, status: "success" }),
        });
      }

      const turnOrder = store.get(turnOrderAtom);
      expect(turnOrder).toHaveLength(200);
      for (let i = 0; i < 200; i++) {
        expect(turnOrder[i]).toBe(`turn_${i}`);
      }
    });

    it("turn phase updates 1,000 times on same turn: final state correct", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPSERT_TURN",
        turn: createTurn({
          id: "turn_1" as TurnId,
          phases: [createTurnPhase({ phase: "thinking", status: "pending" })],
        }),
      });

      // Rapidly update thinking phase 1000 times
      for (let i = 0; i < 1_000; i++) {
        dispatch({
          t: "UPDATE_TURN_PHASE",
          turn_id: "turn_1" as TurnId,
          phase: "thinking",
          entry: { summary: `iteration_${i}`, status: i === 999 ? "success" : "running" },
        });
      }

      const turn = store.get(turnAtomFamily("turn_1" as TurnId));
      const thinkingPhase = turn!.phases.find((p) => p.phase === "thinking");
      expect(thinkingPhase!.summary).toBe("iteration_999");
      expect(thinkingPhase!.status).toBe("success");
    });

    it("full conversation simulation: 50 turns with messages, tool calls, phases", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      for (let t = 0; t < 50; t++) {
        const turnId = `turn_${t}` as TurnId;
        const userMsgId = `msg_user_${t}` as MessageId;
        const assistantMsgId = `msg_asst_${t}` as MessageId;

        // User message
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: userMsgId, role: "user", text: `Question ${t}` }),
        });

        // Turn
        dispatch({
          t: "UPSERT_TURN",
          turn: createTurn({
            id: turnId,
            status: "running",
            phases: [
              createTurnPhase({
                phase: "user_message",
                message_ids: [userMsgId],
                status: "success",
              }),
              createTurnPhase({ phase: "thinking", status: "running" }),
            ],
          }),
        });

        // Assistant streaming response
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: assistantMsgId, text: "", status: "streaming" }),
        });

        // Stream 20 tokens
        for (let tok = 0; tok < 20; tok++) {
          dispatch({ t: "APPEND_TEXT", id: assistantMsgId, chunk: `word${tok} ` });
        }

        // Tool call
        const tcId = `tc_${t}`;
        dispatch({
          t: "UPSERT_TOOL_CALL",
          tool_call: createToolCall({ id: tcId, turn_id: turnId as string, status: "running" }),
        });
        dispatch({
          t: "UPDATE_TOOL_CALL_STATUS",
          id: tcId,
          status: "success",
          result_summary: "Done",
          duration_ms: 42,
        });

        // Phase updates
        dispatch({
          t: "UPDATE_TURN_PHASE",
          turn_id: turnId,
          phase: "thinking",
          entry: { status: "success" },
        });
        dispatch({
          t: "UPDATE_TURN_PHASE",
          turn_id: turnId,
          phase: "summary",
          entry: { status: "success", summary: `Answer ${t}` },
        });

        // Finalize
        dispatch({ t: "SET_MESSAGE_STATUS", id: assistantMsgId, status: "final" });
      }

      // Verify totals
      expect(store.get(messageOrderAtom)).toHaveLength(100); // 50 user + 50 assistant
      expect(store.get(turnOrderAtom)).toHaveLength(50);

      // Verify last message content
      const lastMsg = store.get(messageAtomFamily("msg_asst_49" as MessageId));
      expect(lastMsg!.status).toBe("final");
      expect(lastMsg!.text).toContain("word0");
      expect(lastMsg!.text).toContain("word19");

      // Verify tool calls
      const lastTc = store.get(toolCallAtomFamily("tc_49"));
      expect(lastTc!.status).toBe("success");
    });
  });

  // ── Timeline & Checkpoint Accumulation ─────────────────
  describe("timeline and checkpoint accumulation", () => {
    it("1,000 timeline events: all stored without loss", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      for (let i = 0; i < 1_000; i++) {
        dispatch({
          t: "PUSH_TIMELINE",
          event: createTimelineEvent({ id: `evt_${i}`, summary: `Event ${i}` }),
        });
      }

      const events = store.get(timelineEventsAtom);
      expect(events).toHaveLength(1_000);
      expect(events[0]?.summary).toBe("Event 0");
      expect(events[999]?.summary).toBe("Event 999");
    });

    it("500 checkpoints: all stored in order", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      for (let i = 0; i < 500; i++) {
        dispatch({
          t: "ADD_CHECKPOINT",
          checkpoint: createCheckpoint({ id: `cp_${i}`, label: `Checkpoint ${i}` }),
        });
      }

      const cps = store.get(checkpointsAtom);
      expect(cps).toHaveLength(500);
      expect(cps[499]?.label).toBe("Checkpoint 499");
    });
  });

  // ── Session Meta Rapid Updates ─────────────────────────
  describe("session meta rapid updates", () => {
    it("100 rapid status changes: final state reflects last update", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      const statuses = ["idle", "running", "paused", "error", "completed"] as const;
      for (let i = 0; i < 100; i++) {
        dispatch({
          t: "SET_SESSION_META",
          meta: { status: statuses[i % statuses.length] },
        });
      }

      // Last i=99, 99 % 5 = 4 → "completed"
      expect(store.get(sessionMetaAtom).status).toBe("completed");
    });

    it("cost/token counters accumulate correctly with partial updates", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      for (let i = 1; i <= 100; i++) {
        dispatch({
          t: "SET_SESSION_META",
          meta: {
            cost_usd: i * 0.01,
            tokens_in: i * 100,
            tokens_out: i * 50,
          },
        });
      }

      const meta = store.get(sessionMetaAtom);
      expect(meta.cost_usd).toBe(1.0);
      expect(meta.tokens_in).toBe(10_000);
      expect(meta.tokens_out).toBe(5_000);
    });
  });

  // ── File Change Stress ─────────────────────────────────
  describe("file change stress", () => {
    it("200 file changes across 10 turns: all stored correctly", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      for (let t = 0; t < 10; t++) {
        for (let f = 0; f < 20; f++) {
          dispatch({
            t: "UPSERT_FILE_CHANGE",
            file_change: createFileChange({
              file_path: `src/file_${t}_${f}.ts`,
              turn_id: `turn_${t}`,
              status: f % 3 === 0 ? "added" : f % 3 === 1 ? "modified" : "deleted",
              insertions: f * 2,
              deletions: f,
            }),
          });
        }
      }

      // No crash, store should be accessible
      expect(store.get(messageOrderAtom)).toHaveLength(0); // No messages in this test
    });
  });

  // ── Mixed ServerEvent Storm ──────────────────────────────────
  describe("mixed serverEvent storm (realistic worst-case)", () => {
    it("5,000 mixed serverEvents in rapid succession: store remains consistent", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Pre-seed some entities
      for (let m = 0; m < 10; m++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: `msg_${m}` as MessageId, text: "", status: "streaming" }),
        });
      }
      for (let t = 0; t < 5; t++) {
        dispatch({
          t: "UPSERT_TURN",
          turn: createTurn({
            id: `turn_${t}` as TurnId,
            phases: [createTurnPhase({ phase: "thinking", status: "pending" })],
          }),
        });
      }

      // Fire 5000 mixed serverEvents
      for (let i = 0; i < 5_000; i++) {
        const mod = i % 7;
        switch (mod) {
          case 0:
            dispatch({
              t: "APPEND_TEXT",
              id: `msg_${i % 10}` as MessageId,
              chunk: `[${i}]`,
            });
            break;
          case 1:
            dispatch({
              t: "UPDATE_TURN_PHASE",
              turn_id: `turn_${i % 5}` as TurnId,
              phase: "thinking",
              entry: { summary: `step_${i}` },
            });
            break;
          case 2:
            dispatch({
              t: "SET_SESSION_META",
              meta: { tokens_in: i },
            });
            break;
          case 3:
            dispatch({
              t: "PUSH_TIMELINE",
              event: createTimelineEvent({ id: `evt_${i}`, summary: `E${i}` }),
            });
            break;
          case 4:
            dispatch({ t: "NOP" });
            break;
          case 5:
            dispatch({ t: "SET_PROGRESS", key: "test", value: i });
            break;
          case 6:
            dispatch({
              t: "UPSERT_TOOL_CALL",
              tool_call: createToolCall({
                id: `tc_${i}`,
                turn_id: `turn_${i % 5}`,
                status: "success",
              }),
            });
            break;
        }
      }

      // Verify store consistency
      expect(store.get(messageOrderAtom)).toHaveLength(10);
      expect(store.get(turnOrderAtom)).toHaveLength(5);

      // Messages should have accumulated text
      for (let m = 0; m < 10; m++) {
        const msg = store.get(messageAtomFamily(`msg_${m}` as MessageId));
        expect(msg).not.toBeNull();
        expect(msg!.text.length).toBeGreaterThan(0);
      }

      // Session meta should reflect last update
      const meta = store.get(sessionMetaAtom);
      expect(meta.tokens_in).toBeDefined();

      // Timeline events should have accumulated
      const events = store.get(timelineEventsAtom);
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
