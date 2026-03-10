import { createStore } from "jotai";

import { createModelRoute, resetIdCounter } from "../../../shared/lib/mocks";
import {
  latestRouteAtom,
  modelRoutesAtom,
  resetModelRoutesAtom,
  setModelRoutesAtom,
} from "../model/modelRoutingAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("modelRoutingAtoms", () => {
  it("starts with an empty array", () => {
    const store = createStore();
    expect(store.get(modelRoutesAtom)).toEqual([]);
  });

  it("setModelRoutesAtom adds routes", () => {
    const store = createStore();
    const route = createModelRoute({ task_type: "code_gen", model: "Opus", timestamp_ms: 1000 });

    store.set(setModelRoutesAtom, [route]);

    expect(store.get(modelRoutesAtom)).toHaveLength(1);
    expect(store.get(modelRoutesAtom)[0]?.task_type).toBe("code_gen");
  });

  it("setModelRoutesAtom deduplicates by timestamp", () => {
    const store = createStore();
    const route1 = createModelRoute({ timestamp_ms: 1000 });
    const route2 = createModelRoute({ timestamp_ms: 1000 });

    store.set(setModelRoutesAtom, [route1]);
    store.set(setModelRoutesAtom, [route2]);

    expect(store.get(modelRoutesAtom)).toHaveLength(1);
  });

  it("setModelRoutesAtom merges new routes with existing", () => {
    const store = createStore();
    store.set(setModelRoutesAtom, [createModelRoute({ timestamp_ms: 1000 })]);
    store.set(setModelRoutesAtom, [createModelRoute({ timestamp_ms: 2000 })]);

    expect(store.get(modelRoutesAtom)).toHaveLength(2);
  });

  it("setModelRoutesAtom sorts newest first", () => {
    const store = createStore();
    store.set(setModelRoutesAtom, [
      createModelRoute({ timestamp_ms: 1000, task_type: "older" }),
      createModelRoute({ timestamp_ms: 3000, task_type: "newest" }),
      createModelRoute({ timestamp_ms: 2000, task_type: "middle" }),
    ]);

    const routes = store.get(modelRoutesAtom);
    expect(routes[0]?.task_type).toBe("newest");
    expect(routes[1]?.task_type).toBe("middle");
    expect(routes[2]?.task_type).toBe("older");
  });

  it("setModelRoutesAtom caps at 50 entries", () => {
    const store = createStore();
    const routes = Array.from({ length: 60 }, (_, i) => createModelRoute({ timestamp_ms: i }));

    store.set(setModelRoutesAtom, routes);

    expect(store.get(modelRoutesAtom)).toHaveLength(50);
  });

  it("latestRouteAtom returns the most recent route", () => {
    const store = createStore();
    store.set(setModelRoutesAtom, [
      createModelRoute({ timestamp_ms: 1000, model: "Haiku" }),
      createModelRoute({ timestamp_ms: 3000, model: "Opus" }),
      createModelRoute({ timestamp_ms: 2000, model: "Sonnet" }),
    ]);

    expect(store.get(latestRouteAtom)?.model).toBe("Opus");
  });

  it("latestRouteAtom returns null when empty", () => {
    const store = createStore();
    expect(store.get(latestRouteAtom)).toBeNull();
  });

  it("resetModelRoutesAtom clears all routes", () => {
    const store = createStore();
    store.set(setModelRoutesAtom, [
      createModelRoute({ timestamp_ms: 1000 }),
      createModelRoute({ timestamp_ms: 2000 }),
    ]);
    expect(store.get(modelRoutesAtom)).toHaveLength(2);

    store.set(resetModelRoutesAtom);
    expect(store.get(modelRoutesAtom)).toHaveLength(0);
    expect(store.get(latestRouteAtom)).toBeNull();
  });
});
