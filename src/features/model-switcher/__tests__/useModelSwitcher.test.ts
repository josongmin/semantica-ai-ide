import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { availableModelsAtom } from "../../../shared/lib";
import { createModelInfo, createSessionMeta, resetIdCounter } from "../../../shared/lib/mocks";
import { useModelSwitcher } from "../model/useModelSwitcher";

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

describe("useModelSwitcher", () => {
  it("returns available models and current model id", () => {
    const store = createStore();
    const models = [
      createModelInfo({ id: "opus", label: "Opus" }),
      createModelInfo({ id: "sonnet", label: "Sonnet" }),
    ];
    store.set(availableModelsAtom, models);
    store.set(sessionMetaAtom, createSessionMeta({ model_id: "opus" }));

    const { result } = renderHook(() => useModelSwitcher(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.models).toHaveLength(2);
    expect(result.current.currentModelId).toBe("opus");
  });

  it("switchModel posts SWITCH_MODEL to host", () => {
    const store = createStore();
    const { result } = renderHook(() => useModelSwitcher(), {
      wrapper: createWrapper(store),
    });

    result.current.switchModel("sonnet-4");

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SWITCH_MODEL",
      model_id: "sonnet-4",
    });
  });
});
