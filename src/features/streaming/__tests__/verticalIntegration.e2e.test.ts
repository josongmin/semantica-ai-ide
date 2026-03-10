/**
 * Vertical Integration E2E Tests
 *
 * Full lifecycle tests for the ServerEvent -> Atom Store pipeline:
 * - Full turn lifecycle: user_message -> thinking -> analysis -> plan -> changes -> summary
 * - Error recovery: invalid dispatch -> valid serverEvents continue
 * - RESET_STORES -> fresh state -> rebuild conversation
 * - Diff approval flow: upsert file changes -> approve -> verify state
 * - Multiple sessions: build -> reset -> build again -> state correct
 */
import { createStore } from "jotai";

import { fileChangeAtomFamily, setFileApprovalAtom } from "~entities/diff";
import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnAtomFamily, turnOrderAtom } from "~entities/message/turns";
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
  createTurnPhase,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../../shared/protocol";

function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => resetIdCounter());

describe("Vertical integration – E2E lifecycle", () => {
  describe("full turn lifecycle", () => {
    it("user_message -> thinking -> analysis -> plan -> changes -> summary: complete turn", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const turnId = "turn_1" as TurnId;
      const userMsgId = "msg_user_1" as MessageId;
      const assistantMsgId = "msg_asst_1" as MessageId;

      // 1. User message
      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: userMsgId, role: "user", text: "Fix the bug", status: "final" }),
      });
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
              collapsed: false,
            }),
            createTurnPhase({ phase: "thinking", status: "running" }),
          ],
        }),
      });

      // 2. Thinking phase completes
      dispatch({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "thinking",
        entry: { status: "success", summary: "Identified the issue" },
      });

      // 3. Analysis with tool calls
      dispatch({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "analysis",
        entry: { status: "running" },
      });
      dispatch({
        t: "UPSERT_TOOL_CALL",
        tool_call: createToolCall({
          id: "tc_1",
          turn_id: turnId as string,
          tool_name: "read_file",
          status: "running",
        }),
      });
      dispatch({
        t: "UPDATE_TOOL_CALL_STATUS",
        id: "tc_1",
        status: "success",
        result_summary: "Read 150 lines",
        duration_ms: 45,
      });
      dispatch({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "analysis",
        entry: { status: "success", summary: "Found 3 related files" },
      });

      // 4. Plan
      dispatch({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "plan",
        entry: { status: "success", summary: "3-step fix plan" },
      });

      // 5. Changes with file modifications
      dispatch({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "changes",
        entry: { status: "running" },
      });
      dispatch({
        t: "UPSERT_TOOL_CALL",
        tool_call: createToolCall({
          id: "tc_2",
          turn_id: turnId as string,
          tool_name: "write_file",
          category: "write",
          status: "running",
        }),
      });
      dispatch({
        t: "UPSERT_FILE_CHANGE",
        file_change: createFileChange({
          turn_id: turnId as string,
          file_path: "src/buggy.ts",
          status: "modified",
          insertions: 5,
          deletions: 2,
        }),
      });
      dispatch({
        t: "UPDATE_TOOL_CALL_STATUS",
        id: "tc_2",
        status: "success",
        result_summary: "Modified buggy.ts",
        duration_ms: 30,
      });
      dispatch({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "changes",
        entry: { status: "success", summary: "1 file modified" },
      });

      // 6. Summary
      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: assistantMsgId, text: "", status: "streaming" }),
      });
      for (let i = 0; i < 20; i++) {
        dispatch({ t: "APPEND_TEXT", id: assistantMsgId, chunk: `word${i} ` });
      }
      dispatch({ t: "SET_MESSAGE_STATUS", id: assistantMsgId, status: "final" });
      dispatch({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "summary",
        entry: { status: "success", message_ids: [assistantMsgId] },
      });

      // Verify complete state
      const turn = store.get(turnAtomFamily(turnId));
      expect(turn!.phases).toHaveLength(6);
      expect(turn!.phases.find((p) => p.phase === "thinking")!.status).toBe("success");
      expect(turn!.phases.find((p) => p.phase === "analysis")!.status).toBe("success");
      expect(turn!.phases.find((p) => p.phase === "plan")!.status).toBe("success");
      expect(turn!.phases.find((p) => p.phase === "changes")!.status).toBe("success");
      expect(turn!.phases.find((p) => p.phase === "summary")!.status).toBe("success");

      const assistantMsg = store.get(messageAtomFamily(assistantMsgId));
      expect(assistantMsg!.status).toBe("final");
      expect(assistantMsg!.text).toContain("word0");
      expect(assistantMsg!.text).toContain("word19");

      expect(store.get(messageOrderAtom)).toHaveLength(2);
      expect(store.get(turnOrderAtom)).toHaveLength(1);
    });
  });

  describe("diff approval lifecycle", () => {
    it("upsert 5 file changes -> approve 3 -> reject 1 -> verify final state", () => {
      const store = createStore();
      const dispatch = createDispatch(store);
      const turnId = "turn_1";

      const filePaths = ["a.tsx", "b.tsx", "c.tsx", "d.tsx", "e.tsx"];
      for (const fp of filePaths) {
        dispatch({
          t: "UPSERT_FILE_CHANGE",
          file_change: createFileChange({
            turn_id: turnId,
            file_path: `src/${fp}`,
            approval_status: "pending",
          }),
        });
      }

      // Approve a, b, c
      for (const fp of ["a.tsx", "b.tsx", "c.tsx"]) {
        store.set(setFileApprovalAtom, {
          turn_id: turnId,
          file_path: `src/${fp}`,
          status: "accepted",
        });
      }
      // Reject d
      store.set(setFileApprovalAtom, {
        turn_id: turnId,
        file_path: "src/d.tsx",
        status: "rejected",
      });
      // e stays pending

      expect(store.get(fileChangeAtomFamily(`${turnId}::src/a.tsx`))!.approval_status).toBe(
        "accepted",
      );
      expect(store.get(fileChangeAtomFamily(`${turnId}::src/b.tsx`))!.approval_status).toBe(
        "accepted",
      );
      expect(store.get(fileChangeAtomFamily(`${turnId}::src/c.tsx`))!.approval_status).toBe(
        "accepted",
      );
      expect(store.get(fileChangeAtomFamily(`${turnId}::src/d.tsx`))!.approval_status).toBe(
        "rejected",
      );
      expect(store.get(fileChangeAtomFamily(`${turnId}::src/e.tsx`))!.approval_status).toBe(
        "pending",
      );
    });
  });

  describe("RESET_STORES and rebuild", () => {
    it("100-message conversation -> RESET -> 50-message rebuild: clean slate", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      // Build 100-message conversation
      for (let i = 0; i < 100; i++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: `msg_${i}` as MessageId, text: `Old message ${i}` }),
        });
      }
      for (let i = 0; i < 10; i++) {
        dispatch({ t: "UPSERT_TURN", turn: createTurn({ id: `turn_${i}` as TurnId }) });
      }
      dispatch({
        t: "ADD_CHECKPOINT",
        checkpoint: createCheckpoint({ id: "cp_1", label: "Before reset" }),
      });
      dispatch({
        t: "PUSH_TIMELINE",
        event: createTimelineEvent({ id: "evt_1", summary: "Something happened" }),
      });

      expect(store.get(messageOrderAtom)).toHaveLength(100);
      expect(store.get(turnOrderAtom)).toHaveLength(10);

      // RESET
      dispatch({ t: "RESET_STORES" });

      expect(store.get(messageOrderAtom)).toHaveLength(0);
      expect(store.get(turnOrderAtom)).toHaveLength(0);
      expect(store.get(timelineEventsAtom)).toHaveLength(0);
      expect(store.get(checkpointsAtom)).toHaveLength(0);

      // Rebuild with 50 messages
      for (let i = 0; i < 50; i++) {
        dispatch({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: `new_${i}` as MessageId, text: `New ${i}` }),
        });
      }
      for (let i = 0; i < 5; i++) {
        dispatch({ t: "UPSERT_TURN", turn: createTurn({ id: `new_turn_${i}` as TurnId }) });
      }

      expect(store.get(messageOrderAtom)).toHaveLength(50);
      expect(store.get(turnOrderAtom)).toHaveLength(5);

      // Old messages inaccessible (atomFamily.remove was called during reset)
      expect(store.get(messageAtomFamily("msg_0" as MessageId))).toBeNull();
      // New messages accessible
      expect(store.get(messageAtomFamily("new_0" as MessageId))!.text).toBe("New 0");
    });
  });

  describe("multi-turn with tool calls and file changes", () => {
    it("3 turns each with 2 tool calls and 3 file changes: all tracked correctly", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      for (let t = 0; t < 3; t++) {
        const turnId = `turn_${t}` as TurnId;
        dispatch({ t: "UPSERT_TURN", turn: createTurn({ id: turnId, status: "success" }) });

        for (let tc = 0; tc < 2; tc++) {
          const tcId = `tc_${t}_${tc}`;
          dispatch({
            t: "UPSERT_TOOL_CALL",
            tool_call: createToolCall({ id: tcId, turn_id: turnId as string, status: "success" }),
          });
        }

        for (let fc = 0; fc < 3; fc++) {
          dispatch({
            t: "UPSERT_FILE_CHANGE",
            file_change: createFileChange({
              turn_id: turnId as string,
              file_path: `src/t${t}_f${fc}.tsx`,
            }),
          });
        }
      }

      expect(store.get(turnOrderAtom)).toHaveLength(3);

      // Tool calls accessible
      expect(store.get(toolCallAtomFamily("tc_0_0"))!.status).toBe("success");
      expect(store.get(toolCallAtomFamily("tc_2_1"))!.status).toBe("success");

      // File changes accessible via correct key format (turn_id::file_path)
      for (let t = 0; t < 3; t++) {
        for (let fc = 0; fc < 3; fc++) {
          const key = `turn_${t}::src/t${t}_f${fc}.tsx`;
          expect(store.get(fileChangeAtomFamily(key))).not.toBeNull();
        }
      }
    });
  });

  describe("error recovery", () => {
    it("NOP serverEvents interleaved: silently skipped, valid serverEvents processed", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_1" as MessageId, text: "start" }),
      });
      dispatch({ t: "NOP" });
      dispatch({ t: "NOP" });
      dispatch({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_2" as MessageId, text: "end" }),
      });

      expect(store.get(messageOrderAtom)).toHaveLength(2);
    });
  });
});
