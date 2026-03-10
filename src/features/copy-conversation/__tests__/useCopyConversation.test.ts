import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { upsertMessageAtom } from "~entities/message/writers";

import { createMessage, resetIdCounter } from "../../../shared/lib/mocks";
import { useCopyConversation } from "../model/useCopyConversation";
const mockWriteText = vi.fn().mockResolvedValue(undefined);

const originalClipboard = navigator.clipboard;

beforeAll(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: originalClipboard,
    writable: true,
    configurable: true,
  });
});

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

beforeEach(() => {
  mockWriteText.mockClear();
  resetIdCounter();
});

describe("useCopyConversation", () => {
  it("copies messages as markdown to clipboard", async () => {
    const store = createStore();
    const userMsg = createMessage({ role: "user", text: "Hello" });
    const agentMsg = createMessage({ role: "assistant", text: "Hi there" });
    store.set(upsertMessageAtom, userMsg);
    store.set(upsertMessageAtom, agentMsg);

    const { result } = renderHook(() => useCopyConversation(), {
      wrapper: createWrapper(store),
    });

    await result.current.copyAsMarkdown();

    expect(mockWriteText).toHaveBeenCalledTimes(1);
    const markdown = mockWriteText.mock.calls[0]?.[0];
    expect(markdown).toContain("**You**:");
    expect(markdown).toContain("Hello");
    expect(markdown).toContain("**Agent**:");
    expect(markdown).toContain("Hi there");
    expect(markdown).toContain("---");
  });

  it("handles empty conversation", async () => {
    const store = createStore();
    const { result } = renderHook(() => useCopyConversation(), {
      wrapper: createWrapper(store),
    });

    await result.current.copyAsMarkdown();

    // Empty conversation: no clipboard write
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  it("uses System label for system messages", async () => {
    const store = createStore();
    const sysMsg = createMessage({ role: "system", text: "Context set" });
    store.set(upsertMessageAtom, sysMsg);

    const { result } = renderHook(() => useCopyConversation(), {
      wrapper: createWrapper(store),
    });

    await result.current.copyAsMarkdown();

    const markdown = mockWriteText.mock.calls[0]?.[0];
    expect(markdown).toContain("**System**:");
  });
});
