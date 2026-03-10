import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { mcpServerIdsAtom } from "~entities/mcp";

import { mcpPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { useMcpManager } from "../model/useMcpManager";

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

describe("useMcpManager", () => {
  it("returns serverIds from atom", () => {
    const store = createStore();
    store.set(mcpServerIdsAtom, ["server-1", "server-2"]);

    const { result } = renderHook(() => useMcpManager(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.serverIds).toEqual(["server-1", "server-2"]);
  });

  it("panelVisible defaults to false", () => {
    const store = createStore();

    const { result } = renderHook(() => useMcpManager(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.panelVisible).toBe(false);
  });

  it("togglePanel flips panelVisible", () => {
    const store = createStore();
    store.set(mcpPanelVisibleAtom, false);

    const { result } = renderHook(() => useMcpManager(), {
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

  it("addServer posts ADD_MCP_SERVER to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useMcpManager(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.addServer("http://localhost:3000", "My MCP Server");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ADD_MCP_SERVER",
      url: "http://localhost:3000",
      name: "My MCP Server",
    });
  });

  it("removeServer posts REMOVE_MCP_SERVER to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useMcpManager(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.removeServer("server-xyz");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "REMOVE_MCP_SERVER",
      server_id: "server-xyz",
    });
  });

  it("toggleServer posts TOGGLE_MCP_SERVER to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useMcpManager(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggleServer("server-xyz", false);
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "TOGGLE_MCP_SERVER",
      server_id: "server-xyz",
      enabled: false,
    });
  });
});
