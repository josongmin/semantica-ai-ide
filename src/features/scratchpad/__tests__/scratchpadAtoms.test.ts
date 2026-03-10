import { createStore } from "jotai";

import { createNotepad, resetIdCounter } from "../../../shared/lib/mocks";
import {
  activeNotepadAtom,
  activeNotepadIdAtom,
  deleteNotepadAtom,
  notepadListAtom,
  notepadsAtom,
  resetScratchpadAtom,
  setNotepadsAtom,
  upsertNotepadAtom,
} from "../model/scratchpadAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("scratchpadAtoms", () => {
  it("starts with an empty map", () => {
    const store = createStore();
    expect(store.get(notepadsAtom).size).toBe(0);
  });

  it("setNotepadsAtom adds notepads to the map", () => {
    const store = createStore();
    const np1 = createNotepad({ id: "np1", title: "Notes 1" });
    const np2 = createNotepad({ id: "np2", title: "Notes 2" });

    store.set(setNotepadsAtom, [np1, np2]);

    const map = store.get(notepadsAtom);
    expect(map.size).toBe(2);
    expect(map.get("np1")?.title).toBe("Notes 1");
    expect(map.get("np2")?.title).toBe("Notes 2");
  });

  it("setNotepadsAtom merges with existing notepads", () => {
    const store = createStore();
    store.set(setNotepadsAtom, [createNotepad({ id: "np1" })]);
    store.set(setNotepadsAtom, [createNotepad({ id: "np2" })]);

    expect(store.get(notepadsAtom).size).toBe(2);
  });

  it("setNotepadsAtom updates existing notepad by id", () => {
    const store = createStore();
    store.set(setNotepadsAtom, [
      createNotepad({ id: "np1", title: "Original", content: "Old content" }),
    ]);

    store.set(setNotepadsAtom, [
      createNotepad({ id: "np1", title: "Updated", content: "New content" }),
    ]);

    const map = store.get(notepadsAtom);
    expect(map.size).toBe(1);
    expect(map.get("np1")?.title).toBe("Updated");
    expect(map.get("np1")?.content).toBe("New content");
  });

  it("upsertNotepadAtom adds or updates a single notepad", () => {
    const store = createStore();
    const notepad = createNotepad({ id: "np1", title: "My Notes" });

    store.set(upsertNotepadAtom, notepad);

    expect(store.get(notepadsAtom).get("np1")?.title).toBe("My Notes");

    // Update
    store.set(upsertNotepadAtom, { ...notepad, title: "Updated Notes" });
    expect(store.get(notepadsAtom).get("np1")?.title).toBe("Updated Notes");
  });

  it("deleteNotepadAtom removes a notepad by id", () => {
    const store = createStore();
    store.set(setNotepadsAtom, [createNotepad({ id: "np1" }), createNotepad({ id: "np2" })]);

    store.set(deleteNotepadAtom, "np1");

    const map = store.get(notepadsAtom);
    expect(map.size).toBe(1);
    expect(map.has("np1")).toBe(false);
    expect(map.has("np2")).toBe(true);
  });

  it("deleteNotepadAtom does nothing for unknown id", () => {
    const store = createStore();
    store.set(setNotepadsAtom, [createNotepad({ id: "np1" })]);

    store.set(deleteNotepadAtom, "unknown");
    expect(store.get(notepadsAtom).size).toBe(1);
  });

  it("activeNotepadIdAtom starts as null", () => {
    const store = createStore();
    expect(store.get(activeNotepadIdAtom)).toBeNull();
  });

  it("activeNotepadAtom returns the selected notepad", () => {
    const store = createStore();
    const notepad = createNotepad({ id: "np1", title: "Active" });
    store.set(setNotepadsAtom, [notepad]);
    store.set(activeNotepadIdAtom, "np1");

    expect(store.get(activeNotepadAtom)).toEqual(notepad);
  });

  it("activeNotepadAtom returns null when no id set", () => {
    const store = createStore();
    store.set(setNotepadsAtom, [createNotepad({ id: "np1" })]);

    expect(store.get(activeNotepadAtom)).toBeNull();
  });

  it("activeNotepadAtom returns null when id does not exist in map", () => {
    const store = createStore();
    store.set(activeNotepadIdAtom, "nonexistent");

    expect(store.get(activeNotepadAtom)).toBeNull();
  });

  it("notepadListAtom returns notepads sorted by updated_at_ms descending", () => {
    const store = createStore();
    store.set(setNotepadsAtom, [
      createNotepad({ id: "np1", title: "Old", updated_at_ms: 1000 }),
      createNotepad({ id: "np2", title: "New", updated_at_ms: 3000 }),
      createNotepad({ id: "np3", title: "Middle", updated_at_ms: 2000 }),
    ]);

    const list = store.get(notepadListAtom);
    expect(list[0]?.title).toBe("New");
    expect(list[1]?.title).toBe("Middle");
    expect(list[2]?.title).toBe("Old");
  });

  it("notepadListAtom returns empty array when no notepads", () => {
    const store = createStore();
    expect(store.get(notepadListAtom)).toEqual([]);
  });

  it("resetScratchpadAtom clears all state", () => {
    const store = createStore();
    store.set(setNotepadsAtom, [createNotepad({ id: "np1" })]);
    store.set(activeNotepadIdAtom, "np1");

    store.set(resetScratchpadAtom);

    expect(store.get(notepadsAtom).size).toBe(0);
    expect(store.get(activeNotepadIdAtom)).toBeNull();
    expect(store.get(activeNotepadAtom)).toBeNull();
  });
});
