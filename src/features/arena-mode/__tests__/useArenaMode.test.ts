import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  arenaModelAAtom,
  arenaModelBAtom,
  arenaWinnerAtom,
  upsertArenaResponseAtom,
} from "~entities/arena";

import type { ArenaResponseId } from "../../../shared/protocol";
import { useArenaMode } from "../model/useArenaMode";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
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
describe("useArenaMode", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("returns default values when store is empty", () => {
    const store = createStore();
    const { result } = renderHook(() => useArenaMode(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.slotA).toBeNull();
    expect(result.current.slotB).toBeNull();
    expect(result.current.winner).toBeNull();
    expect(result.current.modelA).toBe("");
    expect(result.current.modelB).toBe("");
    expect(result.current.isStreaming).toBe(false);
  });

  it("reflects pre-seeded modelA and modelB values", () => {
    const store = createStore();
    store.set(arenaModelAAtom, "gpt-4o");
    store.set(arenaModelBAtom, "claude-3-7-sonnet");

    const { result } = renderHook(() => useArenaMode(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.modelA).toBe("gpt-4o");
    expect(result.current.modelB).toBe("claude-3-7-sonnet");
  });

  it("reflects slotA and slotB responses when upserted", () => {
    const store = createStore();
    store.set(upsertArenaResponseAtom, {
      id: "resp-a" as ArenaResponseId,
      slot: "A",
      text: "Hello from A",
      status: "final",
      model_id: "model-a",
      model_label: "Model A",
      created_at_ms: Date.now(),
    });
    store.set(upsertArenaResponseAtom, {
      id: "resp-b" as ArenaResponseId,
      slot: "B",
      text: "Hello from B",
      status: "final",
      model_id: "model-b",
      model_label: "Model B",
      created_at_ms: Date.now(),
    });

    const { result } = renderHook(() => useArenaMode(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.slotA?.text).toBe("Hello from A");
    expect(result.current.slotB?.text).toBe("Hello from B");
  });

  it("setModels posts ARENA_SET_MODELS with correct model IDs", () => {
    const store = createStore();
    const { result } = renderHook(() => useArenaMode(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.setModels("gpt-4o", "claude-3-7-sonnet"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ARENA_SET_MODELS",
      model_a: "gpt-4o",
      model_b: "claude-3-7-sonnet",
    });
  });

  it("sendPrompt posts ARENA_SEND_PROMPT with the text", () => {
    const store = createStore();
    const { result } = renderHook(() => useArenaMode(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.sendPrompt("Write a fibonacci function"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ARENA_SEND_PROMPT",
      text: "Write a fibonacci function",
    });
  });

  it("selectWinner posts ARENA_SELECT_WINNER with the winner value", () => {
    const store = createStore();
    const { result } = renderHook(() => useArenaMode(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.selectWinner("A"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ARENA_SELECT_WINNER",
      winner: "A",
    });
  });

  it("reflects winner from the store atom", () => {
    const store = createStore();
    store.set(arenaWinnerAtom, "B");

    const { result } = renderHook(() => useArenaMode(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.winner).toBe("B");
  });
});
