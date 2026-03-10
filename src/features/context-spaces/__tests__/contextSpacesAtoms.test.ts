import { createStore } from "jotai";

import { createContextSpace, resetIdCounter } from "../../../shared/lib/mocks";
import {
  activeContextFilesCountAtom,
  activeContextSpacesAtom,
  contextSpacePanelOpenAtom,
  contextSpacesListAtom,
  contextSpacesMapAtom,
  resetContextSpacesStoreAtom,
  setContextSpacesAtom,
} from "../model/contextSpacesAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("contextSpacesAtoms", () => {
  it("starts with empty map and closed panel", () => {
    const store = createStore();
    expect(store.get(contextSpacesMapAtom).size).toBe(0);
    expect(store.get(contextSpacePanelOpenAtom)).toBe(false);
  });

  it("setContextSpacesAtom populates the map", () => {
    const store = createStore();
    const space1 = createContextSpace({ id: "space-1", name: "Frontend" });
    const space2 = createContextSpace({ id: "space-2", name: "Backend" });

    store.set(setContextSpacesAtom, [space1, space2]);

    const map = store.get(contextSpacesMapAtom);
    expect(map.size).toBe(2);
    expect(map.get("space-1")).toEqual(space1);
    expect(map.get("space-2")).toEqual(space2);
  });

  it("contextSpacesListAtom returns sorted list", () => {
    const store = createStore();
    store.set(setContextSpacesAtom, [
      createContextSpace({ id: "s2", name: "Zeta" }),
      createContextSpace({ id: "s1", name: "Alpha" }),
    ]);

    const list = store.get(contextSpacesListAtom);
    expect(list).toHaveLength(2);
    expect(list[0]?.name).toBe("Alpha");
    expect(list[1]?.name).toBe("Zeta");
  });

  it("activeContextSpacesAtom filters only active spaces", () => {
    const store = createStore();
    store.set(setContextSpacesAtom, [
      createContextSpace({ id: "s1", name: "Active", active: true }),
      createContextSpace({ id: "s2", name: "Inactive", active: false }),
      createContextSpace({ id: "s3", name: "Also Active", active: true }),
    ]);

    const active = store.get(activeContextSpacesAtom);
    expect(active).toHaveLength(2);
    expect(active.every((s) => s.active)).toBe(true);
  });

  it("activeContextFilesCountAtom sums files across active spaces", () => {
    const store = createStore();
    store.set(setContextSpacesAtom, [
      createContextSpace({ id: "s1", active: true, files: ["a.ts", "b.ts"] }),
      createContextSpace({ id: "s2", active: false, files: ["c.ts", "d.ts", "e.ts"] }),
      createContextSpace({ id: "s3", active: true, files: ["f.ts"] }),
    ]);

    expect(store.get(activeContextFilesCountAtom)).toBe(3);
  });

  it("resetContextSpacesStoreAtom clears all state", () => {
    const store = createStore();
    store.set(setContextSpacesAtom, [createContextSpace({ id: "s1" })]);
    store.set(contextSpacePanelOpenAtom, true);

    store.set(resetContextSpacesStoreAtom);

    expect(store.get(contextSpacesMapAtom).size).toBe(0);
    expect(store.get(contextSpacePanelOpenAtom)).toBe(false);
  });

  it("replacing spaces replaces the map entirely", () => {
    const store = createStore();
    store.set(setContextSpacesAtom, [createContextSpace({ id: "s1", name: "First" })]);
    expect(store.get(contextSpacesMapAtom).size).toBe(1);

    store.set(setContextSpacesAtom, [createContextSpace({ id: "s2", name: "Second" })]);
    const map = store.get(contextSpacesMapAtom);
    expect(map.size).toBe(1);
    expect(map.has("s2")).toBe(true);
    expect(map.has("s1")).toBe(false);
  });
});
