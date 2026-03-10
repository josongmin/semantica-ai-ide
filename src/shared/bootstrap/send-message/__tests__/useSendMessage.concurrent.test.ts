/**
 * useSendMessage Concurrent & Edge-Case Tests
 *
 * Tests:
 * - Rapid 10x send() calls
 * - Empty/whitespace send rejected
 * - Send + immediate re-send
 * - Counter isolation between tests
 */
import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnOrderAtom } from "~entities/message/turns";
import { resetIdCounter } from "~shared/lib/mocks";

import { resetSendMessageCounters, useSendMessage } from "../model/useSendMessage";
// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("~shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// ─── Helpers ───────────────────────────────────────────────
function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

function renderSendMessage() {
  const store = createStore();
  const { result } = renderHook(() => useSendMessage(), {
    wrapper: createWrapper(store),
  });
  return { result, store };
}

// ─── Lifecycle ─────────────────────────────────────────────
beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
  resetSendMessageCounters();
});

// ─── Tests ─────────────────────────────────────────────────
describe("useSendMessage – concurrent & edge cases", () => {
  it("10 rapid send() calls: all create unique messages and turns", () => {
    const { result, store } = renderSendMessage();

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.send(`Message ${i}`);
      }
    });

    const messages = store.get(messageOrderAtom);
    const turns = store.get(turnOrderAtom);
    expect(messages).toHaveLength(10);
    expect(turns).toHaveLength(10);

    // All IDs unique
    expect(new Set(messages).size).toBe(10);
    expect(new Set(turns).size).toBe(10);

    // postMessage called 10 times
    expect(mockPostMessage).toHaveBeenCalledTimes(10);
    for (let i = 0; i < 10; i++) {
      expect(mockPostMessage.mock.calls[i]?.[0]).toMatchObject({
        type: "SEND_MESSAGE",
        text: `Message ${i}`,
      });
    }
  });

  it("empty/whitespace send: rejected, no message created", () => {
    const { result, store } = renderSendMessage();

    act(() => {
      result.current.send("");
      result.current.send("   ");
      result.current.send("\n\t");
    });

    expect(store.get(messageOrderAtom)).toHaveLength(0);
    expect(store.get(turnOrderAtom)).toHaveLength(0);
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("send then immediate re-send: both succeed as separate turns", () => {
    const { result, store } = renderSendMessage();

    act(() => {
      result.current.send("First");
      result.current.send("Second");
    });

    const messages = store.get(messageOrderAtom);
    expect(messages).toHaveLength(2);

    // Verify texts
    const msg1 = store.get(messageAtomFamily(messages[0]!));
    const msg2 = store.get(messageAtomFamily(messages[1]!));
    expect(msg1?.text).toBe("First");
    expect(msg2?.text).toBe("Second");
    expect(msg1?.turn_id).not.toBe(msg2?.turn_id);
  });

  it("message text trimmed before sending", () => {
    const { result, store } = renderSendMessage();

    act(() => {
      result.current.send("  Hello World  ");
    });

    const messages = store.get(messageOrderAtom);
    const msg = store.get(messageAtomFamily(messages[0]!));
    expect(msg?.text).toBe("Hello World");
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ text: "Hello World" }));
  });

  it("user message has correct role and status", () => {
    const { result, store } = renderSendMessage();

    act(() => {
      result.current.send("Test");
    });

    const messages = store.get(messageOrderAtom);
    const msg = store.get(messageAtomFamily(messages[0]!));
    expect(msg?.role).toBe("user");
    expect(msg?.status).toBe("final");
  });
});
