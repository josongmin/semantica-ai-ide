import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  indexFileCountAtom,
  indexProgressAtom,
  indexStatusAtom,
  searchResultsAtom,
} from "../../../entities/semantic-index";
import { searchPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { useSemanticSearch } from "../model/useSemanticSearch";

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

describe("useSemanticSearch", () => {
  it("returns index state from atoms", () => {
    const store = createStore();
    store.set(indexStatusAtom, "ready");
    store.set(indexProgressAtom, 100);
    store.set(indexFileCountAtom, 42);
    store.set(searchResultsAtom, []);

    const { result } = renderHook(() => useSemanticSearch(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.indexStatus).toBe("ready");
    expect(result.current.indexProgress).toBe(100);
    expect(result.current.indexFileCount).toBe(42);
    expect(result.current.results).toEqual([]);
  });

  it("panelVisible defaults to false", () => {
    const store = createStore();

    const { result } = renderHook(() => useSemanticSearch(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.panelVisible).toBe(false);
  });

  it("togglePanel flips panelVisible", () => {
    const store = createStore();
    store.set(searchPanelVisibleAtom, false);

    const { result } = renderHook(() => useSemanticSearch(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.togglePanel();
    });

    expect(result.current.panelVisible).toBe(true);

    act(() => {
      result.current.togglePanel();
    });

    expect(result.current.panelVisible).toBe(false);
  });

  it("triggerSearch posts SEMANTIC_SEARCH to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useSemanticSearch(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.triggerSearch("find auth functions");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SEMANTIC_SEARCH",
      query: "find auth functions",
    });
  });

  it("triggerReindex posts REQUEST_INDEX to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useSemanticSearch(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.triggerReindex();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "REQUEST_INDEX",
    });
  });
});
