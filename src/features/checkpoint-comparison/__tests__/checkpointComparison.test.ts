import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { checkpointsAtom } from "~entities/session/state";

import type { Checkpoint } from "../../../shared/protocol";
import {
  clearComparisonAtom,
  comparisonPairAtom,
  isComparisonActiveAtom,
  setComparisonAtom,
} from "../model/checkpointComparisonAtoms";
import { useCheckpointComparison } from "../model/useCheckpointComparison";

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

const CP1: Checkpoint = { id: "cp1", turn_id: "t1", label: "Start", timestamp_ms: 1000 };
const CP2: Checkpoint = { id: "cp2", turn_id: "t2", label: "Middle", timestamp_ms: 2000 };
const CP3: Checkpoint = { id: "cp3", turn_id: "t3", label: "End", timestamp_ms: 3000 };

describe("checkpointComparisonAtoms", () => {
  it("starts with null pair", () => {
    const store = createStore();
    expect(store.get(comparisonPairAtom)).toBeNull();
    expect(store.get(isComparisonActiveAtom)).toBe(false);
  });

  it("sets comparison pair", () => {
    const store = createStore();
    store.set(setComparisonAtom, { from: CP1, to: CP2 });
    expect(store.get(comparisonPairAtom)).toEqual({ from: CP1, to: CP2 });
    expect(store.get(isComparisonActiveAtom)).toBe(true);
  });

  it("clears comparison", () => {
    const store = createStore();
    store.set(setComparisonAtom, { from: CP1, to: CP2 });
    store.set(clearComparisonAtom);
    expect(store.get(comparisonPairAtom)).toBeNull();
    expect(store.get(isComparisonActiveAtom)).toBe(false);
  });
});

describe("useCheckpointComparison", () => {
  it("returns null pair initially", () => {
    const store = createStore();
    store.set(checkpointsAtom, [CP1, CP2, CP3]);

    const { result } = renderHook(() => useCheckpointComparison(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.pair).toBeNull();
    expect(result.current.checkpoints).toHaveLength(3);
  });

  it("compares two checkpoints by ID", () => {
    const store = createStore();
    store.set(checkpointsAtom, [CP1, CP2, CP3]);

    const { result } = renderHook(() => useCheckpointComparison(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.compare("cp1", "cp3");
    });

    expect(result.current.pair).toEqual({ from: CP1, to: CP3 });
  });

  it("ignores comparison with invalid checkpoint ID", () => {
    const store = createStore();
    store.set(checkpointsAtom, [CP1, CP2]);

    const { result } = renderHook(() => useCheckpointComparison(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.compare("cp1", "invalid");
    });

    expect(result.current.pair).toBeNull();
  });

  it("clears active comparison", () => {
    const store = createStore();
    store.set(checkpointsAtom, [CP1, CP2]);
    store.set(setComparisonAtom, { from: CP1, to: CP2 });

    const { result } = renderHook(() => useCheckpointComparison(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.pair).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.pair).toBeNull();
  });

  it("exposes all checkpoints for selection", () => {
    const store = createStore();
    store.set(checkpointsAtom, [CP1, CP2, CP3]);

    const { result } = renderHook(() => useCheckpointComparison(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.checkpoints).toEqual([CP1, CP2, CP3]);
  });
});
