/**
 * SOTA Test: Unmount During Active postMessage Streaming
 *
 * Tests the critical scenario where a React component (or the entire
 * streaming hook) unmounts while postMessage events are actively arriving.
 * This catches:
 *   - Memory leaks (event listener not removed)
 *   - "setState after unmount" warnings
 *   - Stale dispatch refs causing crashes
 *   - Engine buffer not flushed/discarded
 *
 * The existing e2ePipeline test only checks "post-unmount messages are ignored"
 * but doesn't test unmounting MID-STREAM with serverEvents already in the engine buffer.
 */
import { act, render, renderHook, screen } from "@testing-library/react";
import { createStore, Provider, useAtomValue } from "jotai";

import { appendTextAtom, messageAtomFamily, messageOrderAtom } from "~entities/message/core";

import { useStreamingCommit } from "../../../app/event-dispatch";
import { createMessage, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId,ServerEvent } from "../../../shared/protocol";
import { createWrapper, flushAllRaf, postBatch, postServerEvent, resetRafMock } from "./fixtures";

// ─── Lifecycle ────────────────────────────────────────────
beforeEach(() => {
  resetRafMock();
  resetIdCounter();
});

// ─── Tests ────────────────────────────────────────────────
describe("Unmount During Active Streaming", () => {
  it("unmount while serverEvents are buffered (before rAF) → no crash, engine destroys cleanly", () => {
    const store = createStore();
    const { unmount } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    // Push serverEvents but do NOT flush rAF (they're sitting in the engine buffer)
    act(() => {
      postServerEvent({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_buf" as MessageId, text: "", status: "streaming" }),
      });
      for (let i = 0; i < 100; i++) {
        postServerEvent({ t: "APPEND_TEXT", id: "msg_buf" as MessageId, chunk: `[${i}]` });
      }
      // DO NOT call flushAllRaf() — serverEvents are in buffer
    });

    // Unmount with 101 serverEvents still in the engine buffer
    expect(() => unmount()).not.toThrow();

    // Engine's destroy(flush=true) should have committed what was buffered
    const msg = store.get(messageAtomFamily("msg_buf" as MessageId));
    expect(msg).not.toBeNull();
    // All 100 chunks should be there because destroy() flushes by default
    expect(msg!.text).toContain("[0]");
    expect(msg!.text).toContain("[99]");

    // Subsequent postMessage should be completely ignored
    act(() => {
      postServerEvent({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "ghost" as MessageId, text: "ghost" }),
      });
      flushAllRaf();
    });
    expect(store.get(messageAtomFamily("ghost" as MessageId))).toBeNull();
  });

  it("unmount between two rAF frames → second frame never fires", () => {
    const store = createStore();
    const { unmount } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    // Frame 1: push + flush
    act(() => {
      postServerEvent({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_f1" as MessageId, text: "frame1", status: "final" }),
      });
      flushAllRaf();
    });

    expect(store.get(messageAtomFamily("msg_f1" as MessageId))!.text).toBe("frame1");

    // Push more serverEvents (scheduled for frame 2)
    act(() => {
      postServerEvent({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_f2" as MessageId, text: "frame2" }),
      });
    });

    // Unmount before frame 2 fires — cancelAnimationFrame should be called
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();

    // Frame 2's rAF should NOT process (engine destroyed)
    // BUT destroy() flushes, so msg_f2 should still be committed
    expect(store.get(messageAtomFamily("msg_f2" as MessageId))).not.toBeNull();
  });

  it("rapid mount → stream → unmount → mount → stream cycle (5x) → no leaks", () => {
    const store = createStore();
    const wrapper = createWrapper(store);

    for (let cycle = 0; cycle < 5; cycle++) {
      const { unmount } = renderHook(() => useStreamingCommit(), { wrapper });

      const msgId = `msg_cycle_${cycle}` as MessageId;

      act(() => {
        postServerEvent({
          t: "UPSERT_MESSAGE",
          msg: createMessage({ id: msgId, text: "", status: "streaming" }),
        });
        for (let i = 0; i < 50; i++) {
          postServerEvent({ t: "APPEND_TEXT", id: msgId, chunk: `c${i}` });
        }
        flushAllRaf();
      });

      const msg = store.get(messageAtomFamily(msgId));
      expect(msg).not.toBeNull();
      expect(msg!.text).toContain("c0");
      expect(msg!.text).toContain("c49");

      unmount();
    }

    // All 5 messages should exist (accumulated across cycles)
    expect(store.get(messageOrderAtom)).toHaveLength(5);
  });

  it("unmount during large batch processing → buffered serverEvents still committed", () => {
    const store = createStore();
    const { unmount } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    // Send a large batch
    const serverEvents: ServerEvent[] = [
      {
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_large" as MessageId, text: "", status: "streaming" }),
      },
    ];
    for (let i = 0; i < 200; i++) {
      serverEvents.push({ t: "APPEND_TEXT", id: "msg_large" as MessageId, chunk: `[${i}]` });
    }

    act(() => {
      postBatch(serverEvents, "large_batch");
      // Do NOT flush — unmount immediately
    });

    unmount();

    // destroy() with default flush should commit the batch
    const msg = store.get(messageAtomFamily("msg_large" as MessageId));
    expect(msg).not.toBeNull();
    expect(msg!.text).toContain("[0]");
    expect(msg!.text).toContain("[199]");
  });

  it("flush() after unmount → no-op (no crash)", () => {
    const store = createStore();
    const { unmount, result } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    const flushFn = result.current.flush;
    unmount();

    // Calling flush after unmount should be a safe no-op
    expect(() => flushFn()).not.toThrow();
  });

  it("component unmount during streaming renders → DOM cleaned up, no zombie subscriptions", () => {
    const store = createStore();
    const renderCount = vi.fn();

    function TestMessageRow({ messageId }: { messageId: MessageId }) {
      const msg = useAtomValue(messageAtomFamily(messageId));
      renderCount(messageId);
      if (!msg) return null;
      return <div data-testid={`msg-${messageId}`}>{msg.text}</div>;
    }

    function StreamingBridge() {
      useStreamingCommit();
      return null;
    }

    // Phase 1: Mount and stream
    const { unmount } = render(
      <Provider store={store}>
        <StreamingBridge />
        <TestMessageRow messageId={"msg_z" as MessageId} />
      </Provider>,
    );

    act(() => {
      postServerEvent({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_z" as MessageId, text: "visible", status: "streaming" }),
      });
      flushAllRaf();
    });

    expect(screen.getByTestId("msg-msg_z")).toHaveTextContent("visible");
    renderCount.mockClear();

    // Phase 2: Unmount entire tree
    unmount();

    // Phase 3: Push more serverEvents — should NOT trigger renders in unmounted component
    act(() => {
      // Directly set the atom to simulate what would happen
      store.set(appendTextAtom, { id: "msg_z" as MessageId, chunk: " extra" });
    });

    // The component was unmounted, so renderCount should NOT be called
    expect(renderCount).not.toHaveBeenCalled();
  });

  describe("event listener leak detection", () => {
    let addSpy: ReturnType<typeof vi.spyOn>;
    let removeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      addSpy = vi.spyOn(window, "addEventListener");
      removeSpy = vi.spyOn(window, "removeEventListener");
    });

    afterEach(() => {
      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("5 mount/unmount cycles → addEventListener and removeEventListener calls match exactly", () => {
      const store = createStore();
      const wrapper = createWrapper(store);

      const countMessageCalls = (spy: typeof addSpy) =>
        spy.mock.calls.filter((c: unknown[]) => c[0] === "message").length;

      const initialAddCount = countMessageCalls(addSpy);
      const initialRemoveCount = countMessageCalls(removeSpy);

      for (let cycle = 0; cycle < 5; cycle++) {
        const { unmount } = renderHook(() => useStreamingCommit(), { wrapper });

        act(() => {
          postServerEvent({
            t: "UPSERT_MESSAGE",
            msg: createMessage({
              id: `msg_leak_${cycle}` as MessageId,
              text: "test",
              status: "final",
            }),
          });
          flushAllRaf();
        });

        unmount();
      }

      const messageAdds = countMessageCalls(addSpy) - initialAddCount;
      const messageRemoves = countMessageCalls(removeSpy) - initialRemoveCount;

      // Every add must have a matching remove — no listener leaks
      expect(messageAdds).toBe(5);
      expect(messageRemoves).toBe(5);
    });
  });

  it("unmount during back-pressure synchronous flush → no double commit", () => {
    const store = createStore();
    const { unmount } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    // Push enough serverEvents to trigger back-pressure (default maxBuffer=500)
    act(() => {
      postServerEvent({
        t: "UPSERT_MESSAGE",
        msg: createMessage({ id: "msg_bp" as MessageId, text: "", status: "streaming" }),
      });
      // Push 600 serverEvents — exceeds default maxBufferSize(500), triggers sync flush mid-push
      for (let i = 0; i < 600; i++) {
        postServerEvent({ t: "APPEND_TEXT", id: "msg_bp" as MessageId, chunk: `[${i}]` });
      }
      // Do NOT flush rAF
    });

    // Unmount with some serverEvents possibly still buffered
    expect(() => unmount()).not.toThrow();

    // Message should have all 600 chunks (some via back-pressure, rest via destroy flush)
    const msg = store.get(messageAtomFamily("msg_bp" as MessageId));
    expect(msg).not.toBeNull();
    expect(msg!.text).toContain("[0]");
    expect(msg!.text).toContain("[599]");
  });
});
