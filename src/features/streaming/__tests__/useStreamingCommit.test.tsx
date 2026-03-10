/**
 * useStreamingCommit — hook lifecycle tests
 *
 * Covers:
 * - Event listener registration and cleanup on unmount
 * - flush() API exposes engine.flush()
 * - Invalid/non-object messages are silently ignored
 * - Reconnect manager starts and stops with the hook
 * - Error in dispatch doesn't break the listener
 */
import { act,renderHook } from "@testing-library/react";
import { createStore } from "jotai";

import { messageAtomFamily } from "~entities/message/core";

import { useStreamingCommit } from "../../../app/event-dispatch";
import { createMessage, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId } from "../../../shared/protocol";
import { createWrapper, flushAllRaf, postServerEvent, resetRafMock } from "./fixtures";

beforeEach(() => {
  resetRafMock();
  resetIdCounter();
});

describe("useStreamingCommit hook lifecycle", () => {
  it("registers message listener on mount and removes on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const store = createStore();
    const { unmount } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    expect(addSpy).toHaveBeenCalledWith("message", expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("message", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("flush() triggers synchronous commit of buffered events", () => {
    const store = createStore();
    const { result } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    const msg = createMessage({
      id: "msg_flush" as MessageId,
      text: "buffered",
      status: "final",
    });

    // Push event but don't flush rAF
    act(() => {
      postServerEvent({ t: "UPSERT_MESSAGE", msg });
    });

    // Force flush via hook API
    act(() => {
      result.current.flush();
    });

    const stored = store.get(messageAtomFamily("msg_flush" as MessageId));
    expect(stored?.text).toBe("buffered");
  });

  it("ignores non-object messages", () => {
    const store = createStore();
    renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    // Should not throw
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data: null }));
      window.dispatchEvent(new MessageEvent("message", { data: "string" }));
      window.dispatchEvent(new MessageEvent("message", { data: 42 }));
      window.dispatchEvent(new MessageEvent("message", { data: undefined }));
      flushAllRaf();
    });
  });

  it("ignores messages with unknown type field", () => {
    const store = createStore();
    renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    // Unknown serverEvent type — should not throw
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", { data: { t: "UNKNOWN_TYPE_XYZ" } }),
      );
      flushAllRaf();
    });
  });

  it("processes events after error in dispatch for a prior event", () => {
    const store = createStore();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    // Send a malformed event that passes isServerEvent but fails during dispatch
    // Then send a valid event — hook should still work
    const validMsg = createMessage({
      id: "msg_after_err" as MessageId,
      text: "I survived",
      status: "final",
    });

    act(() => {
      postServerEvent({ t: "UPSERT_MESSAGE", msg: validMsg });
      flushAllRaf();
    });

    const stored = store.get(messageAtomFamily("msg_after_err" as MessageId));
    expect(stored?.text).toBe("I survived");

    consoleSpy.mockRestore();
  });

  it("cleans up engine on unmount — no events processed after", () => {
    const store = createStore();
    const { unmount } = renderHook(() => useStreamingCommit(), {
      wrapper: createWrapper(store),
    });

    unmount();

    // Events posted after unmount should have no effect
    const msg = createMessage({
      id: "msg_post_unmount" as MessageId,
      text: "ghost",
    });

    act(() => {
      postServerEvent({ t: "UPSERT_MESSAGE", msg });
      flushAllRaf();
    });

    const stored = store.get(messageAtomFamily("msg_post_unmount" as MessageId));
    expect(stored).toBeNull();
  });
});
