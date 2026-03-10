import { createStore } from "jotai";

import { createPromptTemplate, resetIdCounter } from "../../../shared/lib/mocks";
import {
  createTemplateDialogOpenAtom,
  filteredTemplatesAtom,
  promptTemplatesAtom,
  resetPromptTemplatesStoreAtom,
  setPromptTemplatesAtom,
  templateCategoriesAtom,
  templateLibraryOpenAtom,
  templateScopeFilterAtom,
  templateSearchQueryAtom,
} from "../model/promptTemplateAtoms";
beforeEach(() => {
  resetIdCounter();
});

describe("promptTemplateAtoms", () => {
  it("has correct initial values", () => {
    const store = createStore();

    expect(store.get(templateLibraryOpenAtom)).toBe(false);
    expect(store.get(createTemplateDialogOpenAtom)).toBe(false);
    expect(store.get(promptTemplatesAtom)).toEqual([]);
    expect(store.get(templateSearchQueryAtom)).toBe("");
    expect(store.get(templateScopeFilterAtom)).toBe("personal");
  });

  it("setPromptTemplatesAtom populates templates", () => {
    const store = createStore();
    const templates = [
      createPromptTemplate({ id: "tpl-1", scope: "personal" }),
      createPromptTemplate({ id: "tpl-2", scope: "team" }),
    ];

    store.set(setPromptTemplatesAtom, templates);

    expect(store.get(promptTemplatesAtom)).toHaveLength(2);
  });

  it("filteredTemplatesAtom filters by scope", () => {
    const store = createStore();
    const templates = [
      createPromptTemplate({ id: "tpl-1", name: "Personal A", scope: "personal" }),
      createPromptTemplate({ id: "tpl-2", name: "Team B", scope: "team" }),
      createPromptTemplate({ id: "tpl-3", name: "Personal C", scope: "personal" }),
    ];

    store.set(setPromptTemplatesAtom, templates);
    store.set(templateScopeFilterAtom, "personal");

    expect(store.get(filteredTemplatesAtom)).toHaveLength(2);
    expect(store.get(filteredTemplatesAtom).map((t) => t.id)).toEqual(["tpl-1", "tpl-3"]);

    store.set(templateScopeFilterAtom, "team");
    expect(store.get(filteredTemplatesAtom)).toHaveLength(1);
    expect(store.get(filteredTemplatesAtom)[0]?.id).toBe("tpl-2");
  });

  it("filteredTemplatesAtom filters by search query", () => {
    const store = createStore();
    const templates = [
      createPromptTemplate({ id: "tpl-1", name: "Code Review", scope: "personal" }),
      createPromptTemplate({ id: "tpl-2", name: "Bug Fix", scope: "personal" }),
      createPromptTemplate({
        id: "tpl-3",
        name: "Refactoring",
        scope: "personal",
        description: "Code cleanup",
      }),
    ];

    store.set(setPromptTemplatesAtom, templates);
    store.set(templateScopeFilterAtom, "personal");
    store.set(templateSearchQueryAtom, "code");

    const results = store.get(filteredTemplatesAtom);
    expect(results).toHaveLength(2);
    expect(results.map((t) => t.id)).toEqual(["tpl-1", "tpl-3"]);
  });

  it("filteredTemplatesAtom filters by category in search", () => {
    const store = createStore();
    const templates = [
      createPromptTemplate({ id: "tpl-1", name: "A", scope: "personal", category: "testing" }),
      createPromptTemplate({ id: "tpl-2", name: "B", scope: "personal", category: "docs" }),
    ];

    store.set(setPromptTemplatesAtom, templates);
    store.set(templateSearchQueryAtom, "testing");

    const results = store.get(filteredTemplatesAtom);
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("tpl-1");
  });

  it("templateCategoriesAtom returns unique sorted categories", () => {
    const store = createStore();
    const templates = [
      createPromptTemplate({ id: "1", category: "testing" }),
      createPromptTemplate({ id: "2", category: "docs" }),
      createPromptTemplate({ id: "3", category: "testing" }),
      createPromptTemplate({ id: "4" }), // no category
    ];

    store.set(setPromptTemplatesAtom, templates);

    const categories = store.get(templateCategoriesAtom);
    expect(categories).toEqual(["docs", "testing"]);
  });

  it("resetPromptTemplatesStoreAtom resets all state", () => {
    const store = createStore();

    store.set(templateLibraryOpenAtom, true);
    store.set(createTemplateDialogOpenAtom, true);
    store.set(setPromptTemplatesAtom, [createPromptTemplate()]);
    store.set(templateSearchQueryAtom, "test");
    store.set(templateScopeFilterAtom, "team");

    store.set(resetPromptTemplatesStoreAtom);

    expect(store.get(templateLibraryOpenAtom)).toBe(false);
    expect(store.get(createTemplateDialogOpenAtom)).toBe(false);
    expect(store.get(promptTemplatesAtom)).toEqual([]);
    expect(store.get(templateSearchQueryAtom)).toBe("");
    expect(store.get(templateScopeFilterAtom)).toBe("personal");
  });
});
