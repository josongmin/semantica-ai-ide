import { createStore } from "jotai";

import { createTimelineEvent, resetIdCounter } from "~shared/lib/mocks";
import type { TimelineEventType } from "~shared/protocol";

import {
  filteredTimelineAtom,
  pushTimelineEventAtom,
  timelineEventsAtom,
  timelineFilterAtom,
} from "../model/atoms";

beforeEach(() => {
  resetIdCounter();
});

describe("pushTimelineEventAtom", () => {
  it("adds a single event to the timeline list", () => {
    const store = createStore();
    const evt = createTimelineEvent({ id: "evt_1", type: "tool_call_start" });

    store.set(pushTimelineEventAtom, evt);

    const events = store.get(timelineEventsAtom);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(evt);
  });

  it("multiple events maintain insertion order", () => {
    const store = createStore();
    const evt1 = createTimelineEvent({ id: "evt_1", type: "tool_call_start" });
    const evt2 = createTimelineEvent({ id: "evt_2", type: "tool_call_end" });
    const evt3 = createTimelineEvent({ id: "evt_3", type: "file_created" });

    store.set(pushTimelineEventAtom, evt1);
    store.set(pushTimelineEventAtom, evt2);
    store.set(pushTimelineEventAtom, evt3);

    const events = store.get(timelineEventsAtom);
    expect(events).toHaveLength(3);
    expect(events[0]?.id).toBe("evt_1");
    expect(events[1]?.id).toBe("evt_2");
    expect(events[2]?.id).toBe("evt_3");
  });

  it("does not mutate previously stored events", () => {
    const store = createStore();
    const evt1 = createTimelineEvent({ id: "evt_1" });
    store.set(pushTimelineEventAtom, evt1);

    const snapshotBefore = store.get(timelineEventsAtom);

    const evt2 = createTimelineEvent({ id: "evt_2" });
    store.set(pushTimelineEventAtom, evt2);

    // The old snapshot reference should not have changed (immutable)
    expect(snapshotBefore).toHaveLength(1);
    expect(store.get(timelineEventsAtom)).toHaveLength(2);
  });
});

describe("filteredTimelineAtom", () => {
  it("no filter (empty set) returns all events", () => {
    const store = createStore();
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "tool_call_start" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "error_raised" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "file_created" }));

    // Default filter is empty set, meaning show all
    const filtered = store.get(filteredTimelineAtom);
    expect(filtered).toHaveLength(3);
  });

  it("filter by single type returns only matching events", () => {
    const store = createStore();
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "tool_call_start" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "error_raised" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "file_created" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "tool_call_start" }));

    store.set(timelineFilterAtom, new Set<TimelineEventType>(["error_raised"]));

    const filtered = store.get(filteredTimelineAtom);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.type).toBe("error_raised");
  });

  it("filter by multiple types returns all matching events", () => {
    const store = createStore();
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "tool_call_start" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "error_raised" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "file_created" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "tool_call_end" }));

    store.set(timelineFilterAtom, new Set<TimelineEventType>(["tool_call_start", "tool_call_end"]));

    const filtered = store.get(filteredTimelineAtom);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((e) => e.type.startsWith("tool_call"))).toBe(true);
  });

  it("filter that matches nothing returns empty array", () => {
    const store = createStore();
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "tool_call_start" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "error_raised" }));

    store.set(timelineFilterAtom, new Set<TimelineEventType>(["checkpoint_created"]));

    const filtered = store.get(filteredTimelineAtom);
    expect(filtered).toHaveLength(0);
  });

  it("clearing filter back to empty set returns all events again", () => {
    const store = createStore();
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "tool_call_start" }));
    store.set(pushTimelineEventAtom, createTimelineEvent({ type: "error_raised" }));

    // Apply a filter
    store.set(timelineFilterAtom, new Set<TimelineEventType>(["error_raised"]));
    expect(store.get(filteredTimelineAtom)).toHaveLength(1);

    // Clear the filter
    store.set(timelineFilterAtom, new Set<TimelineEventType>());
    expect(store.get(filteredTimelineAtom)).toHaveLength(2);
  });
});
