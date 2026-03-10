import { createStore } from "jotai";

import {
  createUsageModelBreakdown,
  createUsageStats,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import {
  avgCostPerSessionAtom,
  maxModelTokensAtom,
  resetUsageStatsAtom,
  setUsageStatsAtom,
  usageStatsAtom,
} from "../model/usageDashboardAtoms";

beforeEach(() => {
  resetIdCounter();
});

describe("usageDashboardAtoms", () => {
  it("usageStatsAtom defaults to null", () => {
    const store = createStore();
    expect(store.get(usageStatsAtom)).toBeNull();
  });

  it("setUsageStatsAtom sets stats", () => {
    const store = createStore();
    const stats = createUsageStats();

    store.set(setUsageStatsAtom, stats);

    expect(store.get(usageStatsAtom)).toEqual(stats);
  });

  it("resetUsageStatsAtom clears stats to null", () => {
    const store = createStore();
    store.set(setUsageStatsAtom, createUsageStats());

    store.set(resetUsageStatsAtom);

    expect(store.get(usageStatsAtom)).toBeNull();
  });

  describe("avgCostPerSessionAtom", () => {
    it("returns 0 when no stats", () => {
      const store = createStore();
      expect(store.get(avgCostPerSessionAtom)).toBe(0);
    });

    it("returns 0 when total_sessions is 0", () => {
      const store = createStore();
      store.set(setUsageStatsAtom, createUsageStats({ total_sessions: 0, total_cost_usd: 0 }));
      expect(store.get(avgCostPerSessionAtom)).toBe(0);
    });

    it("calculates average cost per session", () => {
      const store = createStore();
      store.set(setUsageStatsAtom, createUsageStats({ total_sessions: 4, total_cost_usd: 2.0 }));
      expect(store.get(avgCostPerSessionAtom)).toBe(0.5);
    });
  });

  describe("maxModelTokensAtom", () => {
    it("returns 0 when no stats", () => {
      const store = createStore();
      expect(store.get(maxModelTokensAtom)).toBe(0);
    });

    it("returns 0 when per_model is empty", () => {
      const store = createStore();
      store.set(setUsageStatsAtom, createUsageStats({ per_model: [] }));
      expect(store.get(maxModelTokensAtom)).toBe(0);
    });

    it("returns max tokens across models", () => {
      const store = createStore();
      store.set(
        setUsageStatsAtom,
        createUsageStats({
          per_model: [
            createUsageModelBreakdown({ model: "a", tokens: 100_000 }),
            createUsageModelBreakdown({ model: "b", tokens: 200_000 }),
            createUsageModelBreakdown({ model: "c", tokens: 50_000 }),
          ],
        }),
      );
      expect(store.get(maxModelTokensAtom)).toBe(200_000);
    });
  });

  it("multiple set/reset cycles work correctly", () => {
    const store = createStore();

    // Set → check → reset → check → set again
    const stats1 = createUsageStats({ total_sessions: 3 });
    store.set(setUsageStatsAtom, stats1);
    expect(store.get(usageStatsAtom)?.total_sessions).toBe(3);

    store.set(resetUsageStatsAtom);
    expect(store.get(usageStatsAtom)).toBeNull();

    const stats2 = createUsageStats({ total_sessions: 7 });
    store.set(setUsageStatsAtom, stats2);
    expect(store.get(usageStatsAtom)?.total_sessions).toBe(7);
  });
});
