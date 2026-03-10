import { createStore } from "jotai";

import { activityFeedVisibleAtom } from "../dialogAtoms";

describe("activityFeedVisibleAtom", () => {
  it("has a default value of false", () => {
    const store = createStore();
    expect(store.get(activityFeedVisibleAtom)).toBe(false);
  });

  it("can be set to true", () => {
    const store = createStore();
    store.set(activityFeedVisibleAtom, true);
    expect(store.get(activityFeedVisibleAtom)).toBe(true);
  });

  it("can be toggled back to false", () => {
    const store = createStore();
    store.set(activityFeedVisibleAtom, true);
    store.set(activityFeedVisibleAtom, false);
    expect(store.get(activityFeedVisibleAtom)).toBe(false);
  });

  it("stores are independent (separate store has its own default)", () => {
    const storeA = createStore();
    const storeB = createStore();

    storeA.set(activityFeedVisibleAtom, true);

    expect(storeA.get(activityFeedVisibleAtom)).toBe(true);
    expect(storeB.get(activityFeedVisibleAtom)).toBe(false);
  });
});
