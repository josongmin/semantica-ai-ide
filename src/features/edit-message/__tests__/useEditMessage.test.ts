import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { messageAtomFamily } from "~entities/message/core";
import { upsertMessageAtom } from "~entities/message/writers";

import { editingMessageIdAtom } from "../../../shared/lib";
import { createMessage, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId } from "../../../shared/protocol";
import { useEditMessage } from "../model/useEditMessage";

const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("useEditMessage", () => {
  it("startEdit sets editingMessageIdAtom", () => {
    const store = createStore();
    const { result } = renderHook(() => useEditMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.startEdit("msg-1" as MessageId);
    });

    expect(store.get(editingMessageIdAtom)).toBe("msg-1");
  });

  it("cancelEdit clears editingMessageIdAtom", () => {
    const store = createStore();
    store.set(editingMessageIdAtom, "msg-1" as MessageId);

    const { result } = renderHook(() => useEditMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.cancelEdit();
    });

    expect(store.get(editingMessageIdAtom)).toBeNull();
  });

  it("submitEdit updates message text and posts to host", () => {
    const store = createStore();
    const msg = createMessage({ role: "user", text: "original" });
    store.set(upsertMessageAtom, msg);

    const { result } = renderHook(() => useEditMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.submitEdit(msg.id, "edited text");
    });

    expect(store.get(messageAtomFamily(msg.id))?.text).toBe("edited text");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "EDIT_MESSAGE",
      messageId: msg.id,
      text: "edited text",
    });
    expect(store.get(editingMessageIdAtom)).toBeNull();
  });

  it("submitEdit trims whitespace", () => {
    const store = createStore();
    const msg = createMessage({ role: "user", text: "original" });
    store.set(upsertMessageAtom, msg);

    const { result } = renderHook(() => useEditMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.submitEdit(msg.id, "  trimmed  ");
    });

    expect(store.get(messageAtomFamily(msg.id))?.text).toBe("trimmed");
  });

  it("submitEdit does nothing for empty text", () => {
    const store = createStore();
    const msg = createMessage({ role: "user", text: "original" });
    store.set(upsertMessageAtom, msg);
    store.set(editingMessageIdAtom, msg.id);

    const { result } = renderHook(() => useEditMessage(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.submitEdit(msg.id, "   ");
    });

    expect(store.get(messageAtomFamily(msg.id))?.text).toBe("original");
    expect(mockPostMessage).not.toHaveBeenCalled();
    // editingMessageIdAtom should still be set (not cleared)
    expect(store.get(editingMessageIdAtom)).toBe(msg.id);
  });
});
