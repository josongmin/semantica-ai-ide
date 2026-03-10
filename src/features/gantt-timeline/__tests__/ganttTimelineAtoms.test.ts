import { createStore } from "jotai";

import { createGanttEntry, resetIdCounter } from "../../../shared/lib/mocks";
import {
  ganttEntriesAtom,
  ganttTimelineBoundsAtom,
  resetGanttEntriesAtom,
  setGanttEntriesAtom,
} from "../model/ganttTimelineAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("ganttTimelineAtoms", () => {
  it("ganttEntriesAtom defaults to empty array", () => {
    const store = createStore();
    expect(store.get(ganttEntriesAtom)).toEqual([]);
  });

  it("setGanttEntriesAtom replaces entries", () => {
    const store = createStore();
    const entries = [
      createGanttEntry({ id: "g1", start_ms: 0, end_ms: 100 }),
      createGanttEntry({ id: "g2", start_ms: 50, end_ms: 200 }),
    ];

    store.set(setGanttEntriesAtom, entries);

    expect(store.get(ganttEntriesAtom)).toHaveLength(2);
    expect(store.get(ganttEntriesAtom)[0]?.id).toBe("g1");
  });

  it("setGanttEntriesAtom fully replaces previous entries", () => {
    const store = createStore();

    store.set(setGanttEntriesAtom, [
      createGanttEntry({ id: "g1" }),
      createGanttEntry({ id: "g2" }),
    ]);
    expect(store.get(ganttEntriesAtom)).toHaveLength(2);

    store.set(setGanttEntriesAtom, [createGanttEntry({ id: "g3" })]);
    expect(store.get(ganttEntriesAtom)).toHaveLength(1);
    expect(store.get(ganttEntriesAtom)[0]?.id).toBe("g3");
  });

  it("resetGanttEntriesAtom clears entries", () => {
    const store = createStore();
    store.set(setGanttEntriesAtom, [createGanttEntry({ id: "g1" })]);

    store.set(resetGanttEntriesAtom);

    expect(store.get(ganttEntriesAtom)).toEqual([]);
  });

  describe("ganttTimelineBoundsAtom", () => {
    it("returns zeros when no entries", () => {
      const store = createStore();
      const bounds = store.get(ganttTimelineBoundsAtom);
      expect(bounds).toEqual({ startMs: 0, endMs: 0, durationMs: 0 });
    });

    it("calculates bounds from entries", () => {
      const store = createStore();
      store.set(setGanttEntriesAtom, [
        createGanttEntry({ id: "g1", start_ms: 100, end_ms: 300 }),
        createGanttEntry({ id: "g2", start_ms: 200, end_ms: 500 }),
        createGanttEntry({ id: "g3", start_ms: 50, end_ms: 150 }),
      ]);

      const bounds = store.get(ganttTimelineBoundsAtom);
      expect(bounds.startMs).toBe(50);
      expect(bounds.endMs).toBe(500);
      expect(bounds.durationMs).toBe(450);
    });

    it("handles single entry", () => {
      const store = createStore();
      store.set(setGanttEntriesAtom, [
        createGanttEntry({ id: "g1", start_ms: 1000, end_ms: 2000 }),
      ]);

      const bounds = store.get(ganttTimelineBoundsAtom);
      expect(bounds.startMs).toBe(1000);
      expect(bounds.endMs).toBe(2000);
      expect(bounds.durationMs).toBe(1000);
    });
  });
});
