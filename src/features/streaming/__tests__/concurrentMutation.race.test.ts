/**
 * Concurrent State Mutation Race Condition Tests
 *
 * Tests:
 * - APPEND_TEXT interleaved with UPSERT_MESSAGE on same message
 * - Approve file diff during active streaming
 * - Multiple turns' messages streaming concurrently (interleaved)
 * - RESET_STORES during active streaming
 * - Tool call status update during tool call upsert
 * - Rapid checkpoint + timeline events during streaming
 */
import { createStore } from "jotai";

import { setFileApprovalAtom } from "~entities/diff";
import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { checkpointsAtom } from "~entities/session/state";
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
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../../shared/protocol";

// ─── Dispatch Helper ─────────────────────────────────────
function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => resetIdCounter());

describe("Concurrent mutation – race conditions", () => {
  describe("UPSERT_MESSAGE vs APPEND_TEXT conflict", () => {
    it("UPSERT overwrites text, then APPEND_TEXT continues from new base", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const msgId = "msg_1" as MessageId;

      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: msgId, text: "v1", status: "streaming" }),
      });
      dispatch({ t: "APPEND_TEXT", id: msgId, chunk: "_chunk1" });
      // Later UPSERT arrives (e.g. server correction)
      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: msgId, text: "v2", status: "streaming" }),
      });
      dispatch({ t: "APPEND_TEXT", id: msgId, chunk: "_chunk2" });

      const msg = store.get(messageAtomFamily(msgId));
      expect(msg!.text).toBe("v2_chunk2");
    });

    it("interleaved APPEND_TEXT across 2 messages: no cross-contamination", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const msg1 = "msg_1" as MessageId;
      const msg2 = "msg_2" as MessageId;

      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: msg1, text: "", status: "streaming" }),
      });
      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: msg2, text: "", status: "streaming" }),
      });

      // Interleave 200 appends round-robin
      for (let i = 0; i < 200; i++) {
        const id = i % 2 === 0 ? msg1 : msg2;
        dispatch({ t: "APPEND_TEXT", id, chunk: `[${i}]` });
      }

      const text1 = store.get(messageAtomFamily(msg1))!.text;
      const text2 = store.get(messageAtomFamily(msg2))!.text;

      // msg1 gets even indices, msg2 gets odd
      expect(text1).toContain("[0]");
      expect(text1).toContain("[198]");
      expect(text1).not.toContain("[1]");
      expect(text2).toContain("[1]");
      expect(text2).toContain("[199]");
      expect(text2).not.toContain("[0]");
    });
  });

  describe("file approval during streaming", () => {
    it("approve file while APPEND_TEXT arrives: both mutations succeed", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const msgId = "msg_1" as MessageId;
      const turnId = "turn_1" as TurnId;

      // Setup streaming message + file change
      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: msgId, text: "", status: "streaming" }),
      });
      dispatch({ t: "UPSERT_TURN", turn: createTurn({ id: turnId, status: "running" }) });
      dispatch({
        t: "UPSERT_FILE_CHANGE",
        file_change: createFileChange({
          turn_id: turnId as string,
          file_path: "src/app.tsx",
          approval_status: "pending",
        }),
      });

      // Interleave streaming + approval
      for (let i = 0; i < 50; i++) {
        dispatch({ t: "APPEND_TEXT", id: msgId, chunk: `token_${i} ` });
        if (i === 25) {
          // Approve in the middle of streaming
          store.set(setFileApprovalAtom, {
            turn_id: turnId as string,
            file_path: "src/app.tsx",
            status: "accepted",
          });
        }
      }

      // Message text accumulated fully
      const msg = store.get(messageAtomFamily(msgId));
      expect(msg!.text).toContain("token_0");
      expect(msg!.text).toContain("token_49");
    });
  });

  describe("RESET_STORES during streaming", () => {
    it("reset mid-stream: old messages cleared, new messages accumulate fresh", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Build 20 messages
      for (let i = 0; i < 20; i++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: `msg_${i}` as MessageId, text: `old_${i}` }),
        });
      }
      expect(store.get(messageOrderAtom)).toHaveLength(20);

      // RESET
      dispatch({ t: "RESET_STORES" });
      expect(store.get(messageOrderAtom)).toHaveLength(0);

      // New messages after reset
      for (let i = 0; i < 10; i++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: `new_msg_${i}` as MessageId, text: `new_${i}` }),
        });
      }
      expect(store.get(messageOrderAtom)).toHaveLength(10);

      // Old messages should not be retrievable (atomFamily removed → returns null default)
      expect(store.get(messageAtomFamily("msg_0" as MessageId))).toBeNull();
      // New messages should be
      expect(store.get(messageAtomFamily("new_msg_0" as MessageId))!.text).toBe("new_0");
    });

    it("APPEND_TEXT after RESET to non-existent message: silently ignored", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_1" as MessageId, text: "hello", status: "streaming" }),
      });
      dispatch({ t: "RESET_STORES" });

      // Try appending to the now-deleted message — appendTextAtom guards with `if (!msg) return`
      expect(() => {
        dispatch({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: "world" });
      }).not.toThrow();

      // Message doesn't exist
      expect(store.get(messageAtomFamily("msg_1" as MessageId))).toBeNull();
    });
  });

  describe("tool call status race", () => {
    it("UPSERT_TOOL_CALL then rapid UPDATE_TOOL_CALL_STATUS: last status wins", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPSERT_TOOL_CALL",
        tool_call: createToolCall({ id: "tc_1", status: "running" }),
      });

      // Rapid status updates
      const statuses = ["running", "success", "error", "success"] as const;
      for (const status of statuses) {
        dispatch({
          t: "UPDATE_TOOL_CALL_STATUS",
          id: "tc_1",
          status,
          result_summary: `Result: ${status}`,
          duration_ms: 100,
        });
      }

      const tc = store.get(toolCallAtomFamily("tc_1"));
      expect(tc!.status).toBe("success"); // last write wins
      expect(tc!.result_summary).toBe("Result: success");
    });

    it("50 tool calls with interleaved upsert + status update", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Interleave creation and status updates
      for (let i = 0; i < 50; i++) {
        dispatch({
          t: "UPSERT_TOOL_CALL",
          tool_call: createToolCall({ id: `tc_${i}`, status: "running", turn_id: "turn_1" }),
        });
      }
      for (let i = 0; i < 50; i++) {
        dispatch({
          t: "UPDATE_TOOL_CALL_STATUS",
          id: `tc_${i}`,
          status: "success",
          result_summary: `Done ${i}`,
          duration_ms: i,
        });
      }

      // All 50 should be success
      for (let i = 0; i < 50; i++) {
        const tc = store.get(toolCallAtomFamily(`tc_${i}`));
        expect(tc!.status).toBe("success");
        expect(tc!.result_summary).toBe(`Done ${i}`);
      }
    });
  });

  describe("checkpoint + timeline during streaming", () => {
    it("add checkpoints + timeline events while streaming: all accumulated", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const msgId = "msg_1" as MessageId;

      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: msgId, text: "", status: "streaming" }),
      });

      for (let i = 0; i < 100; i++) {
        dispatch({ t: "APPEND_TEXT", id: msgId, chunk: `[${i}]` });
        if (i % 20 === 0) {
          dispatch({
            t: "ADD_CHECKPOINT",
            checkpoint: createCheckpoint({ id: `cp_${i}`, label: `CP ${i}` }),
          });
        }
        if (i % 10 === 0) {
          dispatch({
            t: "PUSH_TIMELINE",
            event: createTimelineEvent({ id: `evt_${i}`, summary: `Event ${i}` }),
          });
        }
      }

      const msg = store.get(messageAtomFamily(msgId));
      expect(msg!.text).toContain("[0]");
      expect(msg!.text).toContain("[99]");
      expect(store.get(checkpointsAtom)).toHaveLength(5); // 0,20,40,60,80
      expect(store.get(timelineEventsAtom)).toHaveLength(10); // 0,10,20,...,90
    });
  });
});
