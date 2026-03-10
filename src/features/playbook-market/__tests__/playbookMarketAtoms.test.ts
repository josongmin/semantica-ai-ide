import { createStore } from "jotai";

import type { PlaybookEntry } from "../../../shared/protocol";
import {
  filteredPlaybooksAtom,
  playbookCategoriesAtom,
  playbookCategoryFilterAtom,
  playbookMarketAtom,
  playbookSearchQueryAtom,
  resetPlaybookMarketStoreAtom,
  setPlaybookMarketAtom,
} from "../model/playbookMarketAtoms";
function createPlaybookEntry(overrides: Partial<PlaybookEntry> = {}): PlaybookEntry {
  return {
    id: `pb_${Math.random().toString(36).slice(2, 8)}`,
    name: "Test Playbook",
    description: "A test playbook",
    version: "1.0.0",
    author: "test-author",
    rating: 4.2,
    installed: false,
    category: "general",
    ...overrides,
  };
}

describe("playbookMarketAtoms", () => {
  it("starts with empty market", () => {
    const store = createStore();
    expect(store.get(playbookMarketAtom)).toHaveLength(0);
  });

  it("setPlaybookMarketAtom replaces entries", () => {
    const store = createStore();
    const p1 = createPlaybookEntry({ id: "p1", name: "Playbook A" });
    const p2 = createPlaybookEntry({ id: "p2", name: "Playbook B" });

    store.set(setPlaybookMarketAtom, [p1, p2]);
    expect(store.get(playbookMarketAtom)).toHaveLength(2);
  });

  it("playbookCategoriesAtom returns unique sorted categories", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [
      createPlaybookEntry({ id: "p1", category: "deployment" }),
      createPlaybookEntry({ id: "p2", category: "testing" }),
      createPlaybookEntry({ id: "p3", category: "deployment" }),
      createPlaybookEntry({ id: "p4" }), // category: "general"
    ]);

    const categories = store.get(playbookCategoriesAtom);
    expect(categories).toEqual(["deployment", "general", "testing"]);
  });

  it("playbookCategoriesAtom excludes entries with no category", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [
      createPlaybookEntry({ id: "p1", category: "testing" }),
      createPlaybookEntry({ id: "p2", category: undefined }),
    ]);

    const categories = store.get(playbookCategoriesAtom);
    expect(categories).toEqual(["testing"]);
  });

  it("filteredPlaybooksAtom returns all when no search or filter", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [
      createPlaybookEntry({ id: "p1" }),
      createPlaybookEntry({ id: "p2" }),
    ]);

    expect(store.get(filteredPlaybooksAtom)).toHaveLength(2);
  });

  it("filteredPlaybooksAtom filters by search query on name", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [
      createPlaybookEntry({ id: "p1", name: "Deploy Helper" }),
      createPlaybookEntry({ id: "p2", name: "Test Runner" }),
      createPlaybookEntry({ id: "p3", name: "Deploy Monitor" }),
    ]);

    store.set(playbookSearchQueryAtom, "deploy");
    const filtered = store.get(filteredPlaybooksAtom);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("filteredPlaybooksAtom filters by search query on description", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [
      createPlaybookEntry({ id: "p1", name: "Alpha", description: "Runs integration tests" }),
      createPlaybookEntry({ id: "p2", name: "Beta", description: "Deploys to production" }),
    ]);

    store.set(playbookSearchQueryAtom, "integration");
    expect(store.get(filteredPlaybooksAtom)).toHaveLength(1);
    expect(store.get(filteredPlaybooksAtom)[0]?.id).toBe("p1");
  });

  it("filteredPlaybooksAtom filters by search query on author", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [
      createPlaybookEntry({ id: "p1", author: "alice" }),
      createPlaybookEntry({ id: "p2", author: "bob" }),
    ]);

    store.set(playbookSearchQueryAtom, "alice");
    expect(store.get(filteredPlaybooksAtom)).toHaveLength(1);
    expect(store.get(filteredPlaybooksAtom)[0]?.id).toBe("p1");
  });

  it("filteredPlaybooksAtom filters by category", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [
      createPlaybookEntry({ id: "p1", category: "testing" }),
      createPlaybookEntry({ id: "p2", category: "deployment" }),
      createPlaybookEntry({ id: "p3", category: "testing" }),
    ]);

    store.set(playbookCategoryFilterAtom, "testing");
    const filtered = store.get(filteredPlaybooksAtom);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("filteredPlaybooksAtom combines search query and category", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [
      createPlaybookEntry({ id: "p1", name: "Unit Test", category: "testing" }),
      createPlaybookEntry({ id: "p2", name: "Unit Deploy", category: "deployment" }),
      createPlaybookEntry({ id: "p3", name: "Integration Test", category: "testing" }),
    ]);

    store.set(playbookSearchQueryAtom, "unit");
    store.set(playbookCategoryFilterAtom, "testing");

    const filtered = store.get(filteredPlaybooksAtom);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("p1");
  });

  it("filteredPlaybooksAtom is case-insensitive", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [createPlaybookEntry({ id: "p1", name: "Deploy Helper" })]);

    store.set(playbookSearchQueryAtom, "DEPLOY HELPER");
    expect(store.get(filteredPlaybooksAtom)).toHaveLength(1);
  });

  it("filteredPlaybooksAtom trims whitespace from search", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [createPlaybookEntry({ id: "p1", name: "Deploy Helper" })]);

    store.set(playbookSearchQueryAtom, "  deploy  ");
    expect(store.get(filteredPlaybooksAtom)).toHaveLength(1);
  });

  it("resetPlaybookMarketStoreAtom clears all state", () => {
    const store = createStore();
    store.set(setPlaybookMarketAtom, [createPlaybookEntry({ id: "p1" })]);
    store.set(playbookSearchQueryAtom, "test");
    store.set(playbookCategoryFilterAtom, "testing");

    store.set(resetPlaybookMarketStoreAtom);

    expect(store.get(playbookMarketAtom)).toHaveLength(0);
    expect(store.get(playbookSearchQueryAtom)).toBe("");
    expect(store.get(playbookCategoryFilterAtom)).toBe("");
  });
});
