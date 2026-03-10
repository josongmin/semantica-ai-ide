import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { contextUsagePctAtom, sessionMetaAtom } from "~entities/session/state";

import { createSessionMeta } from "../../../shared/lib/mocks";
import type { SessionId } from "../../../shared/protocol";
import { contextBreakdownAtom } from "../model/contextBreakdownAtoms";
import { useContextBreakdown } from "../model/useContextBreakdown";

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

describe("contextBreakdownAtoms", () => {
  it("returns empty segments when max_context_tokens is 0", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        max_context_tokens: 0,
        session_id: "s1" as SessionId,
      }),
    );

    expect(store.get(contextBreakdownAtom)).toEqual([]);
  });

  it("returns segments for active session", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 5000,
        tokens_out: 2000,
        max_context_tokens: 100000,
        session_id: "s1" as SessionId,
      }),
    );

    const segments = store.get(contextBreakdownAtom);

    expect(segments.length).toBeGreaterThanOrEqual(3); // Input, Output, System, Available
    expect(segments.find((s) => s.label === "Input")?.tokens).toBe(5000);
    expect(segments.find((s) => s.label === "Output")?.tokens).toBe(2000);
    expect(segments.find((s) => s.label === "System")).toBeDefined();
    expect(segments.find((s) => s.label === "Available")).toBeDefined();
  });

  it("segments have valid percentages", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 3000,
        tokens_out: 1000,
        max_context_tokens: 10000,
        session_id: "s1" as SessionId,
      }),
    );

    const segments = store.get(contextBreakdownAtom);
    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0);

    // Total should be approximately 100%
    expect(totalPct).toBeGreaterThan(95);
    expect(totalPct).toBeLessThanOrEqual(100.1);
  });

  it("omits input segment when tokens_in is 0", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 0,
        tokens_out: 0,
        max_context_tokens: 10000,
        session_id: "s1" as SessionId,
      }),
    );

    const segments = store.get(contextBreakdownAtom);
    expect(segments.find((s) => s.label === "Input")).toBeUndefined();
    expect(segments.find((s) => s.label === "Output")).toBeUndefined();
  });

  it("reuses contextUsagePctAtom from context-monitor (single source)", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 3000,
        tokens_out: 1500,
        max_context_tokens: 10000,
        session_id: "s1" as SessionId,
      }),
    );

    // 4500/10000 = 45%
    expect(store.get(contextUsagePctAtom)).toBe(45);
  });

  it("each segment has a color", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 5000,
        tokens_out: 2000,
        max_context_tokens: 100000,
        session_id: "s1" as SessionId,
      }),
    );

    const segments = store.get(contextBreakdownAtom);
    for (const seg of segments) {
      expect(seg.color).toBeTruthy();
    }
  });
});

describe("useContextBreakdown", () => {
  it("returns breakdown data", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 4000,
        tokens_out: 1000,
        max_context_tokens: 10000,
        session_id: "s1" as SessionId,
      }),
    );

    const { result } = renderHook(() => useContextBreakdown(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.totalUsed).toBe(5000);
    expect(result.current.maxTokens).toBe(10000);
    expect(result.current.usagePct).toBe(50);
    expect(result.current.segments.length).toBeGreaterThan(0);
  });

  it("returns 0% when no max tokens", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        max_context_tokens: 0,
        session_id: "s1" as SessionId,
      }),
    );

    const { result } = renderHook(() => useContextBreakdown(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.usagePct).toBe(0);
    expect(result.current.segments).toEqual([]);
  });
});
