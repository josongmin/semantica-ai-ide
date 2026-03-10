import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import type { SessionId } from "../../../shared/protocol";
import {
  assignTagAtom,
  createTagAtom,
  deleteTagAtom,
  getSessionTags,
  type SessionTag,
  sessionTagMapAtom,
  sessionTagsAtom,
  unassignTagAtom,
} from "../model/sessionTagAtoms";
import { useSessionTags } from "../model/useSessionTags";
function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

const S1 = "session-1" as SessionId;
const S2 = "session-2" as SessionId;

describe("sessionTagAtoms", () => {
  it("starts with empty tags and map", () => {
    const store = createStore();
    expect(store.get(sessionTagsAtom)).toEqual([]);
    expect(store.get(sessionTagMapAtom).size).toBe(0);
  });

  it("creates a tag", () => {
    const store = createStore();
    const tag: SessionTag = { id: "t1", label: "Bug", color: "#f44747" };
    store.set(createTagAtom, tag);

    expect(store.get(sessionTagsAtom)).toEqual([tag]);
  });

  it("ignores duplicate tag creation", () => {
    const store = createStore();
    const tag: SessionTag = { id: "t1", label: "Bug", color: "#f44747" };
    store.set(createTagAtom, tag);
    store.set(createTagAtom, tag);

    expect(store.get(sessionTagsAtom)).toHaveLength(1);
  });

  it("deletes a tag", () => {
    const store = createStore();
    store.set(createTagAtom, { id: "t1", label: "Bug", color: "#f44747" });
    store.set(deleteTagAtom, "t1");

    expect(store.get(sessionTagsAtom)).toEqual([]);
  });

  it("deleting a tag removes it from sessions", () => {
    const store = createStore();
    store.set(createTagAtom, { id: "t1", label: "Bug", color: "#f44747" });
    store.set(assignTagAtom, { sessionId: S1, tagId: "t1" });
    store.set(deleteTagAtom, "t1");

    expect(store.get(sessionTagMapAtom).get(S1)).toBeUndefined();
  });

  it("assigns a tag to a session", () => {
    const store = createStore();
    store.set(assignTagAtom, { sessionId: S1, tagId: "t1" });

    expect(store.get(sessionTagMapAtom).get(S1)).toEqual(["t1"]);
  });

  it("ignores duplicate assignment", () => {
    const store = createStore();
    store.set(assignTagAtom, { sessionId: S1, tagId: "t1" });
    store.set(assignTagAtom, { sessionId: S1, tagId: "t1" });

    expect(store.get(sessionTagMapAtom).get(S1)).toHaveLength(1);
  });

  it("supports multiple tags per session", () => {
    const store = createStore();
    store.set(assignTagAtom, { sessionId: S1, tagId: "t1" });
    store.set(assignTagAtom, { sessionId: S1, tagId: "t2" });

    expect(store.get(sessionTagMapAtom).get(S1)).toEqual(["t1", "t2"]);
  });

  it("unassigns a tag from a session", () => {
    const store = createStore();
    store.set(assignTagAtom, { sessionId: S1, tagId: "t1" });
    store.set(assignTagAtom, { sessionId: S1, tagId: "t2" });
    store.set(unassignTagAtom, { sessionId: S1, tagId: "t1" });

    expect(store.get(sessionTagMapAtom).get(S1)).toEqual(["t2"]);
  });

  it("unassign removes session entry when no tags left", () => {
    const store = createStore();
    store.set(assignTagAtom, { sessionId: S1, tagId: "t1" });
    store.set(unassignTagAtom, { sessionId: S1, tagId: "t1" });

    expect(store.get(sessionTagMapAtom).has(S1)).toBe(false);
  });

  it("unassign is no-op for non-existent session", () => {
    const store = createStore();
    store.set(unassignTagAtom, { sessionId: S1, tagId: "t1" });

    expect(store.get(sessionTagMapAtom).size).toBe(0);
  });

  it("getSessionTags resolves tag objects", () => {
    const tags: SessionTag[] = [
      { id: "t1", label: "Bug", color: "#f44747" },
      { id: "t2", label: "Feature", color: "#4fc1ff" },
    ];
    const map = new Map<SessionId, readonly string[]>([[S1, ["t1", "t2"]]]);

    const result = getSessionTags(S1, map, tags);
    expect(result).toEqual(tags);
  });

  it("getSessionTags filters invalid tag IDs", () => {
    const tags: SessionTag[] = [{ id: "t1", label: "Bug", color: "#f44747" }];
    const map = new Map<SessionId, readonly string[]>([[S1, ["t1", "t-invalid"]]]);

    const result = getSessionTags(S1, map, tags);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("t1");
  });

  it("getSessionTags returns empty for unknown session", () => {
    expect(getSessionTags(S2, new Map(), [])).toEqual([]);
  });
});

describe("useSessionTags", () => {
  it("creates tag with auto-generated ID and color", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionTags(), {
      wrapper: createWrapper(store),
    });

    let tag: SessionTag | undefined;
    act(() => {
      tag = result.current.createTag("Bug");
    });

    expect(tag!.label).toBe("Bug");
    expect(tag!.id).toMatch(/^tag-/);
    expect(tag!.color).toBeTruthy();
    expect(result.current.allTags).toHaveLength(1);
  });

  it("assigns and retrieves tags for a session", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionTags(), {
      wrapper: createWrapper(store),
    });

    let tag: SessionTag | undefined;
    act(() => {
      tag = result.current.createTag("Feature");
    });

    act(() => {
      result.current.assign(S1, tag!.id);
    });

    const tags = result.current.getTagsForSession(S1);
    expect(tags).toHaveLength(1);
    expect(tags[0]?.label).toBe("Feature");
  });

  it("unassigns a tag from a session", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionTags(), {
      wrapper: createWrapper(store),
    });

    let tag: SessionTag | undefined;
    act(() => {
      tag = result.current.createTag("Draft");
    });

    act(() => {
      result.current.assign(S1, tag!.id);
    });

    act(() => {
      result.current.unassign(S1, tag!.id);
    });

    expect(result.current.getTagsForSession(S1)).toEqual([]);
  });

  it("deletes a tag and removes from sessions", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionTags(), {
      wrapper: createWrapper(store),
    });

    let tag: SessionTag | undefined;
    act(() => {
      tag = result.current.createTag("Temp");
    });

    act(() => {
      result.current.assign(S1, tag!.id);
    });

    act(() => {
      result.current.deleteTag(tag!.id);
    });

    expect(result.current.allTags).toEqual([]);
    expect(result.current.getTagsForSession(S1)).toEqual([]);
  });
});
