import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { checkpointsAtom } from "~entities/session/state";

import { createFileChange } from "../../../shared/lib/mocks";
import type { Checkpoint } from "../../../shared/protocol";
import {
  comparisonFilesAtom,
  comparisonPairAtom,
  setCheckpointDiffAtom,
} from "../model/checkpointComparisonAtoms";
import { useCheckpointComparison } from "../model/useCheckpointComparison";
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

const CP1: Checkpoint = { id: "cp1", turn_id: "t1", label: "Start", timestamp_ms: 1000 };
const CP2: Checkpoint = { id: "cp2", turn_id: "t2", label: "End", timestamp_ms: 2000 };

describe("checkpoint diff integration", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("compare() sends GET_CHECKPOINT_DIFF postMessage", () => {
    const store = createStore();
    store.set(checkpointsAtom, [CP1, CP2]);

    const { result } = renderHook(() => useCheckpointComparison(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.compare("cp1", "cp2");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GET_CHECKPOINT_DIFF",
      from_id: "cp1",
      to_id: "cp2",
    });
  });

  it("setCheckpointDiffAtom populates comparisonFilesAtom", () => {
    const store = createStore();
    const fc1 = createFileChange({ file_path: "src/a.ts" });
    const fc2 = createFileChange({ file_path: "src/b.ts" });

    store.set(setCheckpointDiffAtom, {
      from_id: "cp1",
      to_id: "cp2",
      files: [fc1, fc2],
    });

    expect(store.get(comparisonFilesAtom)).toHaveLength(2);
    expect(store.get(comparisonFilesAtom)[0]?.file_path).toBe("src/a.ts");
  });

  it("clearing comparison does not clear diff files", () => {
    const store = createStore();
    store.set(comparisonPairAtom, { from: CP1, to: CP2 });
    const fc = createFileChange({ file_path: "src/x.ts" });
    store.set(setCheckpointDiffAtom, { from_id: "cp1", to_id: "cp2", files: [fc] });

    store.set(comparisonPairAtom, null);
    // Files remain until next diff request
    expect(store.get(comparisonFilesAtom)).toHaveLength(1);
  });
});
