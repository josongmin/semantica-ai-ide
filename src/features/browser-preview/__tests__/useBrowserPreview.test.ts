import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { browserConsoleEntriesAtom, browserStateAtom } from "../../../entities/browser";
import { browserPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { useBrowserPreview } from "../model/useBrowserPreview";

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

describe("useBrowserPreview", () => {
  it("returns browserState and consoleEntries from atoms", () => {
    const store = createStore();
    store.set(browserStateAtom, { url: "https://example.com", loading: false });
    store.set(browserConsoleEntriesAtom, []);

    const { result } = renderHook(() => useBrowserPreview(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.browserState.url).toBe("https://example.com");
    expect(result.current.browserState.loading).toBe(false);
    expect(result.current.consoleEntries).toEqual([]);
  });

  it("panelVisible defaults to false", () => {
    const store = createStore();

    const { result } = renderHook(() => useBrowserPreview(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.panelVisible).toBe(false);
  });

  it("togglePanel flips panelVisible", () => {
    const store = createStore();
    store.set(browserPanelVisibleAtom, false);

    const { result } = renderHook(() => useBrowserPreview(), {
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

  it("navigate posts BROWSER_NAVIGATE to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useBrowserPreview(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.navigate("https://example.com/page");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "BROWSER_NAVIGATE",
      url: "https://example.com/page",
    });
  });

  it("click posts BROWSER_CLICK with coordinates to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useBrowserPreview(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.click(120, 350);
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "BROWSER_CLICK",
      x: 120,
      y: 350,
    });
  });

  it("close posts BROWSER_CLOSE to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useBrowserPreview(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.close();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "BROWSER_CLOSE",
    });
  });
});
