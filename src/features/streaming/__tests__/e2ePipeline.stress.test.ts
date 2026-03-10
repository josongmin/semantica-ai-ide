/**
 * E2E Pipeline Stress Test
 *
 * Tests the FULL flow: window.postMessage → StreamingEngine → ServerEventDispatcher → Atom Store
 * via the useStreamingCommit hook. This is the most critical integration point —
 * no other test covers this complete pipeline under load.
 */
import { act, renderHook } from "@testing-library/react";
import { createStore } from "jotai";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnOrderAtom } from "~entities/message/turns";

import { useStreamingCommit } from "../../../app/event-dispatch";
import { createMessage, createTurn, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId, ServerEvent, TurnId } from "../../../shared/protocol";
import { createWrapper, flushAllRaf, postBatch, postServerEvent, resetRafMock } from "./fixtures";

// ─── Lifecycle ─────────────────────────────────────────────
beforeEach(() => {
  resetRafMock();
  resetIdCounter();
});

// ─── Tests ─────────────────────────────────────────────────
describe("E2E Pipeline: postMessage → Engine → Dispatcher → Store", () => {
  it("single serverEvent via postMessage → lands in store after rAF", () => {
    const store = createStore();
    renderHook(() => useStreamingCommit(), { wrapper: createWrapper(store) });

    const msg = createMessage({ id: "msg_1" as MessageId, text: "Hello" });

    act(() => {
      postServerEvent({ t: "UPSERT_MESSAGE", msg });
      flushAllRaf();
    });

    expect(store.get(messageAtomFamily("msg_1" as MessageId))).toEqual(msg);
    expect(store.get(messageOrderAtom)).toContain("msg_1");
  });

  it("ServerEventBatch via postMessage → all serverEvents processed", () => {
    const store = createStore();
    renderHook(() => useStreamingCommit(), { wrapper: createWrapper(store) });

    const msg = createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" });

    act(() => {
      postBatch([
        { t: "UPSERT_MESSAGE", msg },
        { t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: "Hello " },
        { t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: "World" },
        { t: "SET_MESSAGE_STATUS", id: "msg_1" as MessageId, status: "final" },
      ]);
      flushAllRaf();
    });

    const result = store.get(messageAtomFamily("msg_1" as MessageId));
    expect(result!.text).toBe("Hello World");
    expect(result!.status).toBe("final");
  });

  it("1,000 postMessage events → all arrive in store, coalesced by engine", () => {
    const store = createStore();
    renderHook(() => useStreamingCommit(), { wrapper: createWrapper(store) });

    const msg = createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" });

    act(() => {
      postServerEvent({ t: "UPSERT_MESSAGE", msg });

      for (let i = 0; i < 1_000; i++) {
        postServerEvent({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: `[${i}]` });
      }
      flushAllRaf();
    });

    const result = store.get(messageAtomFamily("msg_1" as MessageId));
    // All 1000 chunks must arrive
    for (let i = 0; i < 1_000; i++) {
      expect(result!.text).toContain(`[${i}]`);
    }
  });

  it("100 batches × 10 serverEvents each → full conversation built correctly", () => {
    const store = createStore();
    renderHook(() => useStreamingCommit(), { wrapper: createWrapper(store) });

    act(() => {
      // Create 10 conversations, each with a batch of setup serverEvents
      for (let t = 0; t < 10; t++) {
        const msgId = `msg_${t}` as MessageId;
        const turnId = `turn_${t}` as TurnId;

        postBatch(
          [
            {
              t: "UPSERT_MESSAGE",
              msg: createMessage({ id: msgId, text: "", status: "streaming" }),
            },
            {
              t: "UPSERT_TURN",
              turn: createTurn({ id: turnId, status: "running" }),
            },
          ],
          `setup_${t}`,
        );

        // 10 streaming batches per message
        for (let b = 0; b < 10; b++) {
          const chunks: ServerEvent[] = [];
          for (let c = 0; c < 10; c++) {
            chunks.push({ t: "APPEND_TEXT", id: msgId, chunk: `t${t}b${b}c${c} ` });
          }
          postBatch(chunks, `stream_${t}_${b}`);
        }

        postBatch([{ t: "SET_MESSAGE_STATUS", id: msgId, status: "final" }], `finalize_${t}`);
      }

      flushAllRaf();
    });

    expect(store.get(messageOrderAtom)).toHaveLength(10);
    expect(store.get(turnOrderAtom)).toHaveLength(10);

    for (let t = 0; t < 10; t++) {
      const msg = store.get(messageAtomFamily(`msg_${t}` as MessageId));
      expect(msg!.status).toBe("final");
      // Each message got 10 batches × 10 chunks = 100 chunks
      expect(msg!.text).toContain(`t${  t  }b0c0`);
      expect(msg!.text).toContain(`t${  t  }b9c9`);
    }
  });

  it("invalid postMessage data → silently ignored, no crash", () => {
    const store = createStore();
    renderHook(() => useStreamingCommit(), { wrapper: createWrapper(store) });

    act(() => {
      // Various invalid payloads
      window.dispatchEvent(new MessageEvent("message", { data: null }));
      window.dispatchEvent(new MessageEvent("message", { data: undefined }));
      window.dispatchEvent(new MessageEvent("message", { data: "not an object" }));
      window.dispatchEvent(new MessageEvent("message", { data: 42 }));
      window.dispatchEvent(new MessageEvent("message", { data: { random: "object" } }));
      window.dispatchEvent(new MessageEvent("message", { data: { type: "NOT_SERVER_EVENT_BATCH" } }));

      // Valid serverEvent should still work after invalid ones
      const msg = createMessage({ id: "msg_ok" as MessageId, text: "survived" });
      postServerEvent({ t: "UPSERT_MESSAGE", msg });
      flushAllRaf();
    });

    expect(store.get(messageAtomFamily("msg_ok" as MessageId))!.text).toBe("survived");
    expect(store.get(messageOrderAtom)).toHaveLength(1);
  });

  it("flush() forces immediate commit without waiting for rAF", () => {
    const store = createStore();
    const { result } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    const msg = createMessage({ id: "msg_1" as MessageId, text: "", status: "streaming" });

    act(() => {
      postServerEvent({ t: "UPSERT_MESSAGE", msg });
      postServerEvent({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: "urgent" });
      // Force flush without rAF
      result.current.flush();
    });

    // Should be committed even without flushAllRaf()
    const committed = store.get(messageAtomFamily("msg_1" as MessageId));
    expect(committed!.text).toBe("urgent");
  });

  it("cleanup: unmounting removes listener and destroys engine", () => {
    const store = createStore();
    const { unmount } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    unmount();

    // Post-unmount messages should be ignored
    act(() => {
      postServerEvent({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "ghost" as MessageId, text: "should not appear" }),
      });
      flushAllRaf();
    });

    expect(store.get(messageAtomFamily("ghost" as MessageId))).toBeNull();
  });
});
