import { createStore } from "jotai";

import { createCompactionEvent, resetIdCounter } from "../../../shared/lib/mocks";
import {
  addCompactionEventAtom,
  compactionEventsAtom,
  resetCompactionHistoryAtom,
  totalTokensSavedAtom,
} from "../model/atoms";

beforeEach(() => {
  resetIdCounter();
});

describe("addCompactionEventAtom", () => {
  it("adds a single compaction event", () => {
    const store = createStore();
    const event = createCompactionEvent({
      tokens_before: 100_000,
      tokens_after: 60_000,
    });

    store.set(addCompactionEventAtom, event);

    const events = store.get(compactionEventsAtom);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(event);
  });

  it("maintains insertion order across multiple events", () => {
    const store = createStore();
    const e1 = createCompactionEvent({ id: "c_1", tokens_before: 100_000, tokens_after: 60_000 });
    const e2 = createCompactionEvent({ id: "c_2", tokens_before: 80_000, tokens_after: 50_000 });
    const e3 = createCompactionEvent({ id: "c_3", tokens_before: 70_000, tokens_after: 40_000 });

    store.set(addCompactionEventAtom, e1);
    store.set(addCompactionEventAtom, e2);
    store.set(addCompactionEventAtom, e3);

    const events = store.get(compactionEventsAtom);
    expect(events).toHaveLength(3);
    expect(events[0]?.id).toBe("c_1");
    expect(events[1]?.id).toBe("c_2");
    expect(events[2]?.id).toBe("c_3");
  });

  it("does not mutate previously stored events (immutable)", () => {
    const store = createStore();
    const e1 = createCompactionEvent({ id: "c_1" });
    store.set(addCompactionEventAtom, e1);

    const snapshotBefore = store.get(compactionEventsAtom);

    const e2 = createCompactionEvent({ id: "c_2" });
    store.set(addCompactionEventAtom, e2);

    expect(snapshotBefore).toHaveLength(1);
    expect(store.get(compactionEventsAtom)).toHaveLength(2);
  });
});

describe("totalTokensSavedAtom", () => {
  it("returns 0 when no compaction events exist", () => {
    const store = createStore();
    expect(store.get(totalTokensSavedAtom)).toBe(0);
  });

  it("calculates total tokens saved from a single event", () => {
    const store = createStore();
    store.set(
      addCompactionEventAtom,
      createCompactionEvent({ tokens_before: 100_000, tokens_after: 60_000 }),
    );

    expect(store.get(totalTokensSavedAtom)).toBe(40_000);
  });

  it("sums tokens saved across multiple events", () => {
    const store = createStore();
    store.set(
      addCompactionEventAtom,
      createCompactionEvent({ tokens_before: 100_000, tokens_after: 60_000 }),
    );
    store.set(
      addCompactionEventAtom,
      createCompactionEvent({ tokens_before: 80_000, tokens_after: 50_000 }),
    );

    // 40_000 + 30_000 = 70_000
    expect(store.get(totalTokensSavedAtom)).toBe(70_000);
  });
});

describe("resetCompactionHistoryAtom", () => {
  it("clears all compaction events", () => {
    const store = createStore();
    store.set(addCompactionEventAtom, createCompactionEvent());
    store.set(addCompactionEventAtom, createCompactionEvent());
    expect(store.get(compactionEventsAtom)).toHaveLength(2);

    store.set(resetCompactionHistoryAtom);

    expect(store.get(compactionEventsAtom)).toHaveLength(0);
    expect(store.get(totalTokensSavedAtom)).toBe(0);
  });
});
