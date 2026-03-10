import { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import type { SessionId } from "../../../shared/protocol";
import {
  assignTagAtom,
  createTagAtom,
  deleteTagAtom,
  getSessionTags,
  type SessionTag,
  sessionTagMapAtom,
  sessionTagsAtom,
  TAG_COLORS,
  unassignTagAtom,
} from "./sessionTagAtoms";

export interface UseSessionTagsResult {
  /** All available tags */
  allTags: readonly SessionTag[];
  /** Get tags for a specific session */
  getTagsForSession: (sessionId: SessionId) => readonly SessionTag[];
  /** Create a new tag */
  createTag: (label: string) => SessionTag;
  /** Delete a tag */
  deleteTag: (tagId: string) => void;
  /** Assign a tag to a session */
  assign: (sessionId: SessionId, tagId: string) => void;
  /** Remove a tag from a session */
  unassign: (sessionId: SessionId, tagId: string) => void;
}

let tagCounter = 0;

/**
 * Hook for managing session tags/labels.
 * Tags can be created, assigned to sessions, and used for filtering.
 */
export function useSessionTags(): UseSessionTagsResult {
  const allTags = useAtomValue(sessionTagsAtom);
  const tagMap = useAtomValue(sessionTagMapAtom);
  const create = useSetAtom(createTagAtom);
  const remove = useSetAtom(deleteTagAtom);
  const assignTag = useSetAtom(assignTagAtom);
  const unassignTag = useSetAtom(unassignTagAtom);

  const getTagsForSession = useCallback(
    (sessionId: SessionId) => getSessionTags(sessionId, tagMap, allTags),
    [tagMap, allTags],
  );

  const createTag = useCallback(
    (label: string): SessionTag => {
      const tag: SessionTag = {
        id: `tag-${Date.now()}-${++tagCounter}`,
        label,
        color: TAG_COLORS[allTags.length % TAG_COLORS.length] ?? "blue",
      };
      create(tag);
      return tag;
    },
    [allTags.length, create],
  );

  const deleteTag = useCallback(
    (tagId: string) => {
      remove(tagId);
    },
    [remove],
  );

  const assign = useCallback(
    (sessionId: SessionId, tagId: string) => {
      assignTag({ sessionId, tagId });
    },
    [assignTag],
  );

  const unassign = useCallback(
    (sessionId: SessionId, tagId: string) => {
      unassignTag({ sessionId, tagId });
    },
    [unassignTag],
  );

  return useMemo(
    () => ({ allTags, getTagsForSession, createTag, deleteTag, assign, unassign }),
    [allTags, getTagsForSession, createTag, deleteTag, assign, unassign],
  );
}
