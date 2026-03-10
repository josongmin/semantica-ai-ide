import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import type { IntentEntry, IntentId } from "../../../shared/protocol";

/** Full intent timeline */
export const intentTimelineAtom = atom<readonly IntentEntry[]>([]);

/** Active intents only */
export const activeIntentsAtom = atom((get) =>
  get(intentTimelineAtom).filter((i) => i.status === "active"),
);

/** Per-intent lookup */
export const intentByIdFamily = createBoundedAtomFamily(
  (id: IntentId) => atom((get) => get(intentTimelineAtom).find((i) => i.id === id) ?? null),
  { maxSize: 1000 },
  (a: IntentId, b: IntentId) => a === b,
);
setDebugLabel(intentByIdFamily, "intentByIdFamily");

/** Root intents (no parent) */
export const intentRootsAtom = atom((get) => get(intentTimelineAtom).filter((i) => !i.parentId));

/** Current (most recent active) intent — shown in breadcrumb */
export const currentIntentAtom = atom((get) => {
  const active = get(activeIntentsAtom);
  return active.length > 0 ? active[active.length - 1] : null;
});

/** Reset all intent-timeline state */
export const resetIntentTimelineStoreAtom = atom(null, (_get, set) => {
  set(intentTimelineAtom, []);
  intentByIdFamily.setShouldRemove(() => true);
  intentByIdFamily.setShouldRemove(null);
});

/** Upsert intent */
export const upsertIntentAtom = atom(null, (get, set, entry: IntentEntry) => {
  const prev = get(intentTimelineAtom);
  const idx = prev.findIndex((i) => i.id === entry.id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = entry;
    set(intentTimelineAtom, next);
  } else {
    set(intentTimelineAtom, [...prev, entry]);
  }
});
