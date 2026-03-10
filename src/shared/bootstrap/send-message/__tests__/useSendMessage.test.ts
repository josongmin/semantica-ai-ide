import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnAtomFamily, turnOrderAtom } from "~entities/message/turns";

import { resetSendMessageCounters, useSendMessage } from "../model/useSendMessage";
// ─── Mock vscodeApi ────────────────────────────────────────
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

// ─── Tests ─────────────────────────────────────────────────
describe("useSendMessage", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    resetSendMessageCounters();
  });

  it("send calls postMessage with correct payload", () => {
    const store = createStore();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.send("Hello Claude");
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    const call = mockPostMessage.mock.calls[0]?.[0];
    expect(call.type).toBe("SEND_MESSAGE");
    expect(call.text).toBe("Hello Claude");
    expect(call.message_id).toEqual(expect.stringContaining("msg-"));
    expect(call.turn_id).toEqual(expect.stringContaining("turn-"));
  });

  it("send creates a local UiMessage in the store", () => {
    const store = createStore();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.send("Test message");
    });

    const messageIds = store.get(messageOrderAtom);
    expect(messageIds).toHaveLength(1);

    const msg = store.get(messageAtomFamily(messageIds[0]!));
    expect(msg).not.toBeNull();
    expect(msg!.role).toBe("user");
    expect(msg!.text).toBe("Test message");
    expect(msg!.status).toBe("final");
  });

  it("send creates a local Turn in the store", () => {
    const store = createStore();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.send("Test message");
    });

    const turnIds = store.get(turnOrderAtom);
    expect(turnIds).toHaveLength(1);

    const turn = store.get(turnAtomFamily(turnIds[0]!));
    expect(turn).not.toBeNull();
    expect(turn!.status).toBe("running");
    expect(turn!.phases).toHaveLength(1);
    expect(turn!.phases[0]?.phase).toBe("user_message");
    expect(turn!.phases[0]?.status).toBe("success");
  });

  it("send trims whitespace from text", () => {
    const store = createStore();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.send("  Hello Claude  ");
    });

    const call = mockPostMessage.mock.calls[0]?.[0];
    expect(call.text).toBe("Hello Claude");

    const messageIds = store.get(messageOrderAtom);
    const msg = store.get(messageAtomFamily(messageIds[0]!));
    expect(msg!.text).toBe("Hello Claude");
  });

  it("empty text is not sent", () => {
    const store = createStore();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.send("");
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(store.get(messageOrderAtom)).toHaveLength(0);
  });

  it("whitespace-only text is not sent", () => {
    const store = createStore();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.send("   \n\t  ");
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(store.get(messageOrderAtom)).toHaveLength(0);
  });

  it("turn phase summary is truncated to 80 characters", () => {
    const store = createStore();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(store),
    });

    const longText = "A".repeat(120);

    act(() => {
      result.current.send(longText);
    });

    const turnIds = store.get(turnOrderAtom);
    const turn = store.get(turnAtomFamily(turnIds[0]!));
    expect(turn!.phases[0]?.summary).toHaveLength(80);
  });

  it("generates unique message IDs across multiple sends", () => {
    const store = createStore();
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(store),
    });

    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    act(() => {
      result.current.send("First");
    });
    now = 2000;
    act(() => {
      result.current.send("Second");
    });

    vi.restoreAllMocks();

    const messageIds = store.get(messageOrderAtom);
    expect(messageIds).toHaveLength(2);
    expect(messageIds[0]).not.toBe(messageIds[1]);

    const turnIds = store.get(turnOrderAtom);
    expect(turnIds).toHaveLength(2);
    expect(turnIds[0]).not.toBe(turnIds[1]);
  });
});
