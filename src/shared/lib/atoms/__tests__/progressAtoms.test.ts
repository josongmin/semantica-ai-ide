import { createStore } from "jotai";

import {
  progressItemFamily,
  progressKeysAtom,
  removeProgressAtom,
  resetProgressStoreAtom,
  setProgressAtom,
} from "../progressAtoms";

describe("progressAtoms", () => {
  it("setProgressAtom adds a new entry", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "build", value: 50 });

    expect(store.get(progressKeysAtom)).toEqual(["build"]);
    expect(store.get(progressItemFamily("build"))).toEqual({
      key: "build",
      value: 50,
      max: undefined,
      label: undefined,
    });
  });

  it("setProgressAtom updates existing entry without duplicating key", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "build", value: 30, max: 100, label: "Building" });
    store.set(setProgressAtom, { key: "build", value: 80, max: 100, label: "Building" });

    expect(store.get(progressKeysAtom)).toEqual(["build"]);
    expect(store.get(progressItemFamily("build"))?.value).toBe(80);
  });

  it("handles multiple concurrent progress keys", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "a", value: 10 });
    store.set(setProgressAtom, { key: "b", value: 20 });
    store.set(setProgressAtom, { key: "c", value: 30 });

    expect(store.get(progressKeysAtom)).toEqual(["a", "b", "c"]);
  });

  it("removeProgressAtom removes an entry", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "a", value: 10 });
    store.set(setProgressAtom, { key: "b", value: 20 });
    store.set(removeProgressAtom, "a");

    expect(store.get(progressKeysAtom)).toEqual(["b"]);
    expect(store.get(progressItemFamily("a"))).toBeNull();
  });

  it("resetProgressStoreAtom clears all entries", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "a", value: 10 });
    store.set(setProgressAtom, { key: "b", value: 20 });
    store.set(resetProgressStoreAtom);

    expect(store.get(progressKeysAtom)).toEqual([]);
  });
});
