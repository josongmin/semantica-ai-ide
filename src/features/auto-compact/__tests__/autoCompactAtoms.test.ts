import { createStore } from "jotai";

import {
  compactUsagePctAtom,
  pendingCompactAtom,
  resetAutoCompactAtom,
} from "../model/autoCompactAtoms";

describe("autoCompactAtoms", () => {
  it("starts with pending=false and pct=0", () => {
    const store = createStore();
    expect(store.get(pendingCompactAtom)).toBe(false);
    expect(store.get(compactUsagePctAtom)).toBe(0);
  });

  it("can set pending state", () => {
    const store = createStore();
    store.set(pendingCompactAtom, true);
    expect(store.get(pendingCompactAtom)).toBe(true);
  });

  it("can set usage percentage", () => {
    const store = createStore();
    store.set(compactUsagePctAtom, 87);
    expect(store.get(compactUsagePctAtom)).toBe(87);
  });

  it("resets both atoms", () => {
    const store = createStore();
    store.set(pendingCompactAtom, true);
    store.set(compactUsagePctAtom, 90);

    store.set(resetAutoCompactAtom);

    expect(store.get(pendingCompactAtom)).toBe(false);
    expect(store.get(compactUsagePctAtom)).toBe(0);
  });
});
