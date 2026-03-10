import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { TimelineEvent, TimelineEventType } from "~shared/protocol";

/** All timeline events, append-only */
export const timelineEventsAtom = atom<readonly TimelineEvent[]>([]);

/** Filter set (empty = show all) */
export const timelineFilterAtom = atom<ReadonlySet<TimelineEventType>>(
  new Set<TimelineEventType>(),
);

/** Maximum events to retain in memory to prevent unbounded growth */
const MAX_TIMELINE_EVENTS = 1000;

/** Write-only: push a new timeline event (caps at MAX_TIMELINE_EVENTS) */
export const pushTimelineEventAtom = atom(null, (get, set, event: TimelineEvent) => {
  const events = get(timelineEventsAtom);
  const next =
    events.length >= MAX_TIMELINE_EVENTS
      ? [...events.slice(-MAX_TIMELINE_EVENTS + 1), event]
      : [...events, event];
  set(timelineEventsAtom, next);
});

/** Write-only: reset timeline events (call on session change) */
export const resetTimelineStoreAtom = atom(null, (_get, set) => {
  set(timelineEventsAtom, []);
  set(timelineFilterAtom, new Set());
});

/** Write-only: toggle a single event type in the filter set */
export const toggleTimelineFilterAtom = atom(null, (get, set, eventType: TimelineEventType) => {
  const current = get(timelineFilterAtom);
  const next = new Set(current);
  if (next.has(eventType)) next.delete(eventType);
  else next.add(eventType);
  set(timelineFilterAtom, next);
});

/** Write-only: toggle a batch of event types atomically (single render) */
export const toggleTimelineFilterBatchAtom = atom(
  null,
  (get, set, eventTypes: readonly TimelineEventType[]) => {
    const current = get(timelineFilterAtom);
    const next = new Set(current);
    // If ALL types are active → remove all; otherwise → add all
    const allActive = eventTypes.every((t) => next.has(t));
    for (const t of eventTypes) {
      if (allActive) next.delete(t);
      else next.add(t);
    }
    set(timelineFilterAtom, next);
  },
);

/** Derived: filtered timeline events */
export const filteredTimelineAtom = atom((get) => {
  const events = get(timelineEventsAtom);
  const filter = get(timelineFilterAtom);
  if (filter.size === 0) return events;
  return events.filter((e) => filter.has(e.type));
});

registerResetAtom(resetTimelineStoreAtom);
