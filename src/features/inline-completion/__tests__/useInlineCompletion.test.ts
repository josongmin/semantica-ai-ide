import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { completionSettingsAtom, completionStatsAtom } from "~entities/completion-settings";

import { useInlineCompletion } from "../model/useInlineCompletion";

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
});

describe("useInlineCompletion", () => {
  it("returns settings and stats from atoms", () => {
    const store = createStore();
    store.set(completionSettingsAtom, {
      enabled: true,
      trigger_delay_ms: 500,
      max_lines: 10,
      accept_key: "Tab",
    });
    store.set(completionStatsAtom, {
      shown_today: 20,
      accepted_today: 15,
      acceptance_rate: 0.75,
    });

    const { result } = renderHook(() => useInlineCompletion(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.settings.enabled).toBe(true);
    expect(result.current.settings.trigger_delay_ms).toBe(500);
    expect(result.current.stats.shown_today).toBe(20);
    expect(result.current.stats.acceptance_rate).toBe(0.75);
  });

  it("updateSettings posts SET_COMPLETION_SETTINGS with partial to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useInlineCompletion(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateSettings({ trigger_delay_ms: 200 });
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_COMPLETION_SETTINGS",
      settings: { trigger_delay_ms: 200 },
    });
  });

  it("toggleEnabled posts SET_COMPLETION_SETTINGS with toggled enabled=false when currently true", () => {
    const store = createStore();
    store.set(completionSettingsAtom, {
      enabled: true,
      trigger_delay_ms: 300,
      max_lines: 5,
      accept_key: "Tab",
    });

    const { result } = renderHook(() => useInlineCompletion(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggleEnabled();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_COMPLETION_SETTINGS",
      settings: { enabled: false },
    });
  });

  it("toggleEnabled posts SET_COMPLETION_SETTINGS with toggled enabled=true when currently false", () => {
    const store = createStore();
    store.set(completionSettingsAtom, {
      enabled: false,
      trigger_delay_ms: 300,
      max_lines: 5,
      accept_key: "Tab",
    });

    const { result } = renderHook(() => useInlineCompletion(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggleEnabled();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_COMPLETION_SETTINGS",
      settings: { enabled: true },
    });
  });
});
