import { createStore } from "jotai";

import { createMcpRegistryEntry, resetIdCounter } from "../../../shared/lib/mocks";
import {
  filteredRegistryEntriesAtom,
  mcpRegistryAtom,
  registryCategoriesAtom,
  registryCategoryFilterAtom,
  registrySearchQueryAtom,
  resetMcpRegistryAtom,
  setMcpRegistryAtom,
  toggleMcpInstallAtom,
} from "../model/mcpRegistryAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("mcpRegistryAtoms", () => {
  it("starts with an empty map", () => {
    const store = createStore();
    expect(store.get(mcpRegistryAtom).size).toBe(0);
  });

  it("setMcpRegistryAtom adds entries to the map", () => {
    const store = createStore();
    const entry1 = createMcpRegistryEntry({ id: "srv1", name: "Server One" });
    const entry2 = createMcpRegistryEntry({ id: "srv2", name: "Server Two" });

    store.set(setMcpRegistryAtom, [entry1, entry2]);

    const map = store.get(mcpRegistryAtom);
    expect(map.size).toBe(2);
    expect(map.get("srv1")?.name).toBe("Server One");
    expect(map.get("srv2")?.name).toBe("Server Two");
  });

  it("setMcpRegistryAtom merges with existing entries", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [createMcpRegistryEntry({ id: "srv1" })]);
    store.set(setMcpRegistryAtom, [createMcpRegistryEntry({ id: "srv2" })]);

    expect(store.get(mcpRegistryAtom).size).toBe(2);
  });

  it("setMcpRegistryAtom updates existing entry by id", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [
      createMcpRegistryEntry({ id: "srv1", name: "Original", installed: false }),
    ]);

    store.set(setMcpRegistryAtom, [
      createMcpRegistryEntry({ id: "srv1", name: "Updated", installed: true }),
    ]);

    const map = store.get(mcpRegistryAtom);
    expect(map.size).toBe(1);
    expect(map.get("srv1")?.name).toBe("Updated");
    expect(map.get("srv1")?.installed).toBe(true);
  });

  it("toggleMcpInstallAtom toggles the installed status", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [createMcpRegistryEntry({ id: "srv1", installed: false })]);

    store.set(toggleMcpInstallAtom, "srv1");
    expect(store.get(mcpRegistryAtom).get("srv1")?.installed).toBe(true);

    store.set(toggleMcpInstallAtom, "srv1");
    expect(store.get(mcpRegistryAtom).get("srv1")?.installed).toBe(false);
  });

  it("toggleMcpInstallAtom does nothing for unknown id", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [createMcpRegistryEntry({ id: "srv1" })]);

    store.set(toggleMcpInstallAtom, "unknown");
    expect(store.get(mcpRegistryAtom).size).toBe(1);
  });

  it("registryCategoriesAtom extracts unique categories", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [
      createMcpRegistryEntry({ id: "srv1", categories: ["tools", "testing"] }),
      createMcpRegistryEntry({ id: "srv2", categories: ["tools", "code"] }),
    ]);

    const categories = store.get(registryCategoriesAtom);
    expect(categories).toEqual(["code", "testing", "tools"]);
  });

  it("filteredRegistryEntriesAtom returns all entries without filters", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [
      createMcpRegistryEntry({ id: "srv1" }),
      createMcpRegistryEntry({ id: "srv2" }),
    ]);

    expect(store.get(filteredRegistryEntriesAtom)).toHaveLength(2);
  });

  it("filteredRegistryEntriesAtom filters by search query", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [
      createMcpRegistryEntry({ id: "srv1", name: "Code Analyzer" }),
      createMcpRegistryEntry({ id: "srv2", name: "Test Runner" }),
    ]);

    store.set(registrySearchQueryAtom, "analyzer");

    const results = store.get(filteredRegistryEntriesAtom);
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Code Analyzer");
  });

  it("filteredRegistryEntriesAtom filters by category", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [
      createMcpRegistryEntry({ id: "srv1", categories: ["tools"] }),
      createMcpRegistryEntry({ id: "srv2", categories: ["testing"] }),
    ]);

    store.set(registryCategoryFilterAtom, "testing");

    const results = store.get(filteredRegistryEntriesAtom);
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("srv2");
  });

  it("filteredRegistryEntriesAtom filters by both search and category", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [
      createMcpRegistryEntry({ id: "srv1", name: "Code Tool", categories: ["tools"] }),
      createMcpRegistryEntry({ id: "srv2", name: "Code Tests", categories: ["testing"] }),
      createMcpRegistryEntry({ id: "srv3", name: "Other Tool", categories: ["tools"] }),
    ]);

    store.set(registrySearchQueryAtom, "code");
    store.set(registryCategoryFilterAtom, "tools");

    const results = store.get(filteredRegistryEntriesAtom);
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("srv1");
  });

  it("filteredRegistryEntriesAtom sorts by rating descending", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [
      createMcpRegistryEntry({ id: "srv1", rating: 3.0 }),
      createMcpRegistryEntry({ id: "srv2", rating: 5.0 }),
      createMcpRegistryEntry({ id: "srv3", rating: 4.0 }),
    ]);

    const results = store.get(filteredRegistryEntriesAtom);
    expect(results[0]?.rating).toBe(5.0);
    expect(results[1]?.rating).toBe(4.0);
    expect(results[2]?.rating).toBe(3.0);
  });

  it("resetMcpRegistryAtom clears all state", () => {
    const store = createStore();
    store.set(setMcpRegistryAtom, [createMcpRegistryEntry({ id: "srv1" })]);
    store.set(registrySearchQueryAtom, "test");
    store.set(registryCategoryFilterAtom, "tools");

    store.set(resetMcpRegistryAtom);

    expect(store.get(mcpRegistryAtom).size).toBe(0);
    expect(store.get(registrySearchQueryAtom)).toBe("");
    expect(store.get(registryCategoryFilterAtom)).toBe("");
  });
});
