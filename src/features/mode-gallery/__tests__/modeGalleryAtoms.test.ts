import { createStore } from "jotai";

import type { ModeEntry } from "../../../shared/protocol";
import {
  filteredModesAtom,
  modeCategoriesAtom,
  modeCategoryFilterAtom,
  modeGalleryAtom,
  modeSearchQueryAtom,
  resetModeGalleryStoreAtom,
  setModeGalleryAtom,
} from "../model/modeGalleryAtoms";
function createModeEntry(overrides: Partial<ModeEntry> = {}): ModeEntry {
  return {
    id: `mode_${Math.random().toString(36).slice(2, 8)}`,
    name: "Test Mode",
    description: "A test mode",
    author: "test-author",
    rating: 4.5,
    install_count: 1000,
    installed: false,
    categories: ["testing"],
    ...overrides,
  };
}

describe("modeGalleryAtoms", () => {
  it("starts with empty gallery", () => {
    const store = createStore();
    expect(store.get(modeGalleryAtom)).toHaveLength(0);
  });

  it("setModeGalleryAtom replaces entries", () => {
    const store = createStore();
    const m1 = createModeEntry({ id: "m1", name: "Mode A" });
    const m2 = createModeEntry({ id: "m2", name: "Mode B" });

    store.set(setModeGalleryAtom, [m1, m2]);
    expect(store.get(modeGalleryAtom)).toHaveLength(2);
  });

  it("modeCategoriesAtom returns unique sorted categories", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [
      createModeEntry({ id: "m1", categories: ["coding", "automation"] }),
      createModeEntry({ id: "m2", categories: ["automation", "debugging"] }),
      createModeEntry({ id: "m3", categories: ["coding"] }),
    ]);

    const categories = store.get(modeCategoriesAtom);
    expect(categories).toEqual(["automation", "coding", "debugging"]);
  });

  it("filteredModesAtom returns all modes when no search or filter", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [createModeEntry({ id: "m1" }), createModeEntry({ id: "m2" })]);

    expect(store.get(filteredModesAtom)).toHaveLength(2);
  });

  it("filteredModesAtom filters by search query on name", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [
      createModeEntry({ id: "m1", name: "Code Review" }),
      createModeEntry({ id: "m2", name: "Debug Helper" }),
      createModeEntry({ id: "m3", name: "Code Generator" }),
    ]);

    store.set(modeSearchQueryAtom, "code");
    const filtered = store.get(filteredModesAtom);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((m) => m.id)).toEqual(["m1", "m3"]);
  });

  it("filteredModesAtom filters by search query on description", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [
      createModeEntry({ id: "m1", name: "Alpha", description: "Reviews pull requests" }),
      createModeEntry({ id: "m2", name: "Beta", description: "Generates tests" }),
    ]);

    store.set(modeSearchQueryAtom, "pull");
    expect(store.get(filteredModesAtom)).toHaveLength(1);
    expect(store.get(filteredModesAtom)[0]?.id).toBe("m1");
  });

  it("filteredModesAtom filters by search query on author", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [
      createModeEntry({ id: "m1", author: "john-doe" }),
      createModeEntry({ id: "m2", author: "jane-smith" }),
    ]);

    store.set(modeSearchQueryAtom, "john");
    expect(store.get(filteredModesAtom)).toHaveLength(1);
    expect(store.get(filteredModesAtom)[0]?.id).toBe("m1");
  });

  it("filteredModesAtom filters by category", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [
      createModeEntry({ id: "m1", categories: ["coding"] }),
      createModeEntry({ id: "m2", categories: ["debugging"] }),
      createModeEntry({ id: "m3", categories: ["coding", "debugging"] }),
    ]);

    store.set(modeCategoryFilterAtom, "debugging");
    const filtered = store.get(filteredModesAtom);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((m) => m.id)).toEqual(["m2", "m3"]);
  });

  it("filteredModesAtom combines search query and category filter", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [
      createModeEntry({ id: "m1", name: "Review Code", categories: ["coding"] }),
      createModeEntry({ id: "m2", name: "Review Tests", categories: ["testing"] }),
      createModeEntry({ id: "m3", name: "Generate Code", categories: ["coding"] }),
    ]);

    store.set(modeSearchQueryAtom, "review");
    store.set(modeCategoryFilterAtom, "coding");

    const filtered = store.get(filteredModesAtom);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("m1");
  });

  it("filteredModesAtom is case-insensitive", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [createModeEntry({ id: "m1", name: "Code Review" })]);

    store.set(modeSearchQueryAtom, "CODE REVIEW");
    expect(store.get(filteredModesAtom)).toHaveLength(1);
  });

  it("filteredModesAtom trims whitespace from search", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [createModeEntry({ id: "m1", name: "Code Review" })]);

    store.set(modeSearchQueryAtom, "  code  ");
    expect(store.get(filteredModesAtom)).toHaveLength(1);
  });

  it("resetModeGalleryStoreAtom clears all state", () => {
    const store = createStore();
    store.set(setModeGalleryAtom, [createModeEntry({ id: "m1" })]);
    store.set(modeSearchQueryAtom, "test");
    store.set(modeCategoryFilterAtom, "coding");

    store.set(resetModeGalleryStoreAtom);

    expect(store.get(modeGalleryAtom)).toHaveLength(0);
    expect(store.get(modeSearchQueryAtom)).toBe("");
    expect(store.get(modeCategoryFilterAtom)).toBe("");
  });
});
