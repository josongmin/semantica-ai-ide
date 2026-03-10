import { createStore } from "jotai";

import type { CompletionStats } from "~shared/protocol";

import {
  completionSettingsAtom,
  completionStatsAtom,
  resetCompletionStoreAtom,
  setCompletionStatsAtom,
  updateCompletionSettingsAtom,
} from "../model/atoms";

describe("initial state", () => {
  it("has correct default settings", () => {
    const store = createStore();
    const settings = store.get(completionSettingsAtom);
    expect(settings.enabled).toBe(true);
    expect(settings.trigger_delay_ms).toBe(300);
    expect(settings.max_lines).toBe(5);
    expect(settings.accept_key).toBe("Tab");
  });

  it("has zero default stats", () => {
    const store = createStore();
    const stats = store.get(completionStatsAtom);
    expect(stats.shown_today).toBe(0);
    expect(stats.accepted_today).toBe(0);
    expect(stats.acceptance_rate).toBe(0);
  });
});

describe("updateCompletionSettingsAtom", () => {
  it("merges partial settings without overwriting others", () => {
    const store = createStore();
    store.set(updateCompletionSettingsAtom, { trigger_delay_ms: 500 });

    const settings = store.get(completionSettingsAtom);
    expect(settings.trigger_delay_ms).toBe(500);
    expect(settings.enabled).toBe(true);
    expect(settings.max_lines).toBe(5);
    expect(settings.accept_key).toBe("Tab");
  });

  it("updates multiple fields at once", () => {
    const store = createStore();
    store.set(updateCompletionSettingsAtom, { enabled: false, max_lines: 10 });

    const settings = store.get(completionSettingsAtom);
    expect(settings.enabled).toBe(false);
    expect(settings.max_lines).toBe(10);
    expect(settings.trigger_delay_ms).toBe(300);
  });

  it("updates accept_key", () => {
    const store = createStore();
    store.set(updateCompletionSettingsAtom, { accept_key: "Enter" });
    expect(store.get(completionSettingsAtom).accept_key).toBe("Enter");
  });

  it("applies multiple updates cumulatively", () => {
    const store = createStore();
    store.set(updateCompletionSettingsAtom, { enabled: false });
    store.set(updateCompletionSettingsAtom, { max_lines: 3 });

    const settings = store.get(completionSettingsAtom);
    expect(settings.enabled).toBe(false);
    expect(settings.max_lines).toBe(3);
  });
});

describe("setCompletionStatsAtom", () => {
  it("replaces stats entirely", () => {
    const store = createStore();
    const stats: CompletionStats = {
      shown_today: 50,
      accepted_today: 30,
      acceptance_rate: 0.6,
    };

    store.set(setCompletionStatsAtom, stats);

    const result = store.get(completionStatsAtom);
    expect(result.shown_today).toBe(50);
    expect(result.accepted_today).toBe(30);
    expect(result.acceptance_rate).toBe(0.6);
  });

  it("replaces previous stats on subsequent call", () => {
    const store = createStore();
    store.set(setCompletionStatsAtom, {
      shown_today: 10,
      accepted_today: 5,
      acceptance_rate: 0.5,
    });
    store.set(setCompletionStatsAtom, {
      shown_today: 20,
      accepted_today: 18,
      acceptance_rate: 0.9,
    });

    const result = store.get(completionStatsAtom);
    expect(result.shown_today).toBe(20);
    expect(result.accepted_today).toBe(18);
    expect(result.acceptance_rate).toBe(0.9);
  });
});

describe("resetCompletionStoreAtom", () => {
  it("resets settings and stats to defaults", () => {
    const store = createStore();
    store.set(updateCompletionSettingsAtom, {
      enabled: false,
      max_lines: 20,
      trigger_delay_ms: 1000,
    });
    store.set(setCompletionStatsAtom, {
      shown_today: 99,
      accepted_today: 77,
      acceptance_rate: 0.78,
    });

    store.set(resetCompletionStoreAtom);

    const settings = store.get(completionSettingsAtom);
    expect(settings.enabled).toBe(true);
    expect(settings.trigger_delay_ms).toBe(300);
    expect(settings.max_lines).toBe(5);
    expect(settings.accept_key).toBe("Tab");

    const stats = store.get(completionStatsAtom);
    expect(stats.shown_today).toBe(0);
    expect(stats.accepted_today).toBe(0);
    expect(stats.acceptance_rate).toBe(0);
  });
});
