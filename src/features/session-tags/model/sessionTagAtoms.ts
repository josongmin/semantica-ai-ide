import { atom } from "jotai";

import type { SessionId } from "../../../shared/protocol";

export interface SessionTag {
  readonly id: string;
  readonly label: string;
  readonly color: string;
}

/** Default color palette for tags */
export const TAG_COLORS = [
  "#4fc1ff", // blue
  "#6a9955", // green
  "#dcdcaa", // yellow
  "#ce9178", // orange
  "#c586c0", // purple
  "#f44747", // red
  "#9cdcfe", // light blue
  "#d7ba7d", // gold
] as const;

/** All available tags */
export const sessionTagsAtom = atom<readonly SessionTag[]>([]);

/** Mapping of session ID → tag IDs */
export const sessionTagMapAtom = atom<ReadonlyMap<SessionId, readonly string[]>>(
  new Map<SessionId, readonly string[]>(),
);

/** Write atom: create a new tag */
export const createTagAtom = atom(null, (get, set, tag: SessionTag) => {
  const prev = get(sessionTagsAtom);
  if (prev.some((t) => t.id === tag.id)) return;
  set(sessionTagsAtom, [...prev, tag]);
});

/** Write atom: delete a tag (also removes from all sessions) */
export const deleteTagAtom = atom(null, (get, set, tagId: string) => {
  set(
    sessionTagsAtom,
    get(sessionTagsAtom).filter((t) => t.id !== tagId),
  );

  const map = get(sessionTagMapAtom);
  const next = new Map(map);
  for (const [sessionId, tags] of next) {
    const filtered = tags.filter((id) => id !== tagId);
    if (filtered.length !== tags.length) {
      if (filtered.length === 0) {
        next.delete(sessionId);
      } else {
        next.set(sessionId, filtered);
      }
    }
  }
  set(sessionTagMapAtom, next);
});

/** Write atom: assign a tag to a session */
export const assignTagAtom = atom(
  null,
  (get, set, params: { sessionId: SessionId; tagId: string }) => {
    const map = get(sessionTagMapAtom);
    const current = map.get(params.sessionId) ?? [];
    if (current.includes(params.tagId)) return;
    const next = new Map(map);
    next.set(params.sessionId, [...current, params.tagId]);
    set(sessionTagMapAtom, next);
  },
);

/** Write atom: unassign a tag from a session */
export const unassignTagAtom = atom(
  null,
  (get, set, params: { sessionId: SessionId; tagId: string }) => {
    const map = get(sessionTagMapAtom);
    const current = map.get(params.sessionId);
    if (!current) return;
    const filtered = current.filter((id) => id !== params.tagId);
    const next = new Map(map);
    if (filtered.length === 0) {
      next.delete(params.sessionId);
    } else {
      next.set(params.sessionId, filtered);
    }
    set(sessionTagMapAtom, next);
  },
);

/** Get tags for a specific session */
export function getSessionTags(
  sessionId: SessionId,
  tagMap: ReadonlyMap<SessionId, readonly string[]>,
  allTags: readonly SessionTag[],
): readonly SessionTag[] {
  const tagIds = tagMap.get(sessionId);
  if (!tagIds || tagIds.length === 0) return [];
  return tagIds
    .map((id) => allTags.find((t) => t.id === id))
    .filter((t): t is SessionTag => t !== undefined);
}
