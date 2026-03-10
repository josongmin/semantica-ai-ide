import { createStore } from "jotai";

import {
  type OverlayEntry,
  overlayStackAtom,
  popOverlayAtom,
  pushOverlayAtom,
  topOverlayAtom,
} from "../overlayAtoms";
function entry(id: string, type: OverlayEntry["type"] = "dialog"): OverlayEntry {
  return { id, type, dismiss: null };
}

describe("overlayStackAtom", () => {
  it("default is empty array", () => {
    const store = createStore();
    expect(store.get(overlayStackAtom)).toEqual([]);
  });
});

describe("pushOverlayAtom", () => {
  it("adds entry to end", () => {
    const store = createStore();
    store.set(pushOverlayAtom, entry("a"));

    const stack = store.get(overlayStackAtom);
    expect(stack).toHaveLength(1);
    expect(stack[0]).toEqual(entry("a"));
  });

  it("multiple entries maintain LIFO order", () => {
    const store = createStore();
    store.set(pushOverlayAtom, entry("a", "dialog"));
    store.set(pushOverlayAtom, entry("b", "dropdown"));
    store.set(pushOverlayAtom, entry("c", "popover"));

    const stack = store.get(overlayStackAtom);
    expect(stack).toHaveLength(3);
    expect(stack[0]?.id).toBe("a");
    expect(stack[1]?.id).toBe("b");
    expect(stack[2]?.id).toBe("c");
  });
});

describe("popOverlayAtom", () => {
  it("removes specific entry by id", () => {
    const store = createStore();
    store.set(pushOverlayAtom, entry("a"));
    store.set(pushOverlayAtom, entry("b"));

    store.set(popOverlayAtom, "b");

    const stack = store.get(overlayStackAtom);
    expect(stack).toHaveLength(1);
    expect(stack[0]?.id).toBe("a");
  });

  it("no-op when id not found (stack unchanged)", () => {
    const store = createStore();
    store.set(pushOverlayAtom, entry("a"));

    store.set(popOverlayAtom, "nonexistent");

    const stack = store.get(overlayStackAtom);
    expect(stack).toHaveLength(1);
    expect(stack[0]?.id).toBe("a");
  });

  it("removes from middle of stack", () => {
    const store = createStore();
    store.set(pushOverlayAtom, entry("a"));
    store.set(pushOverlayAtom, entry("b"));
    store.set(pushOverlayAtom, entry("c"));

    store.set(popOverlayAtom, "b");

    const stack = store.get(overlayStackAtom);
    expect(stack).toHaveLength(2);
    expect(stack[0]?.id).toBe("a");
    expect(stack[1]?.id).toBe("c");
  });
});

describe("topOverlayAtom", () => {
  it("returns last entry", () => {
    const store = createStore();
    store.set(pushOverlayAtom, entry("a"));
    store.set(pushOverlayAtom, entry("b"));

    expect(store.get(topOverlayAtom)).toEqual(entry("b"));
  });

  it("returns null when empty", () => {
    const store = createStore();
    expect(store.get(topOverlayAtom)).toBeNull();
  });
});
