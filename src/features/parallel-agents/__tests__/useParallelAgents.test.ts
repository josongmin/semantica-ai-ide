import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { upsertAgentInstanceAtom } from "~entities/agent-instance";

import { agentsPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { createAgentInstance } from "../../../shared/lib/mocks";
import type { AgentInstanceId } from "../../../shared/protocol";
import { useParallelAgents } from "../model/useParallelAgents";

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

describe("useParallelAgents", () => {
  it("returns agentIds and runningCount from atoms", () => {
    const store = createStore();
    store.set(
      upsertAgentInstanceAtom,
      createAgentInstance({ id: "agent-1" as AgentInstanceId, status: "running" }),
    );
    store.set(
      upsertAgentInstanceAtom,
      createAgentInstance({ id: "agent-2" as AgentInstanceId, status: "queued" }),
    );

    const { result } = renderHook(() => useParallelAgents(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.agentIds).toEqual(["agent-1", "agent-2"]);
  });

  it("panelVisible defaults to false", () => {
    const store = createStore();

    const { result } = renderHook(() => useParallelAgents(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.panelVisible).toBe(false);
  });

  it("togglePanel flips panelVisible", () => {
    const store = createStore();
    store.set(agentsPanelVisibleAtom, false);

    const { result } = renderHook(() => useParallelAgents(), {
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

  it("cancelAgent posts CANCEL_AGENT to host", () => {
    const store = createStore();

    const { result } = renderHook(() => useParallelAgents(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.cancelAgent("agent-abc");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "CANCEL_AGENT",
      agent_id: "agent-abc",
    });
  });

  it("spawnAgent posts SPAWN_AGENT with label and optional modelId", () => {
    const store = createStore();

    const { result } = renderHook(() => useParallelAgents(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.spawnAgent("My Agent", "claude-opus");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SPAWN_AGENT",
      label: "My Agent",
      model_id: "claude-opus",
    });
  });

  it("spawnAgent posts SPAWN_AGENT without modelId when omitted", () => {
    const store = createStore();

    const { result } = renderHook(() => useParallelAgents(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.spawnAgent("Worker");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SPAWN_AGENT",
      label: "Worker",
      model_id: undefined,
    });
  });
});
