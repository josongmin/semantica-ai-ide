import { createStore } from "jotai";

import type { TurnId, WikiPage } from "../../../shared/protocol";
import {
  activeWikiPageAtom,
  activeWikiPageIdAtom,
  resetDeepWikiStoreAtom,
  setWikiPagesAtom,
  wikiPagesAtom,
  wikiTreeAtom,
} from "../model/deepWikiAtoms";
const makePage = (overrides: Partial<WikiPage> = {}): WikiPage => ({
  id: "page_1",
  title: "Test Page",
  content: "Content here",
  updated_at_ms: Date.now(),
  ...overrides,
});

describe("deepWikiAtoms", () => {
  it("starts with empty pages", () => {
    const store = createStore();
    expect(store.get(wikiPagesAtom).size).toBe(0);
  });

  it("setWikiPagesAtom stores pages in Map keyed by id", () => {
    const store = createStore();

    const pages = [
      makePage({ id: "p1", title: "Page 1" }),
      makePage({ id: "p2", title: "Page 2" }),
    ];

    store.set(setWikiPagesAtom, pages);

    const result = store.get(wikiPagesAtom);
    expect(result.size).toBe(2);
    expect(result.get("p1")?.title).toBe("Page 1");
    expect(result.get("p2")?.title).toBe("Page 2");
  });

  it("setWikiPagesAtom replaces all previous pages", () => {
    const store = createStore();

    store.set(setWikiPagesAtom, [makePage({ id: "old", title: "Old" })]);
    store.set(setWikiPagesAtom, [makePage({ id: "new", title: "New" })]);

    const result = store.get(wikiPagesAtom);
    expect(result.size).toBe(1);
    expect(result.has("old")).toBe(false);
    expect(result.get("new")?.title).toBe("New");
  });

  it("activeWikiPageAtom derives from activeWikiPageIdAtom", () => {
    const store = createStore();

    store.set(setWikiPagesAtom, [makePage({ id: "p1", title: "Active Page" })]);
    expect(store.get(activeWikiPageAtom)).toBeNull();

    store.set(activeWikiPageIdAtom, "p1");
    expect(store.get(activeWikiPageAtom)?.title).toBe("Active Page");
  });

  it("activeWikiPageAtom returns null for non-existent id", () => {
    const store = createStore();

    store.set(activeWikiPageIdAtom, "nonexistent");
    expect(store.get(activeWikiPageAtom)).toBeNull();
  });

  it("wikiTreeAtom builds tree from flat pages", () => {
    const store = createStore();

    store.set(setWikiPagesAtom, [
      makePage({ id: "root", title: "Root" }),
      makePage({ id: "child1", title: "Child 1", parent_id: "root" }),
      makePage({ id: "child2", title: "Child 2", parent_id: "root" }),
      makePage({ id: "grandchild", title: "Grandchild", parent_id: "child1" }),
    ]);

    const tree = store.get(wikiTreeAtom);

    // One root node
    expect(tree).toHaveLength(1);
    expect(tree[0]?.page.title).toBe("Root");

    // Two children
    expect(tree[0]?.children).toHaveLength(2);

    // One grandchild under child1
    const child1 = tree[0]?.children.find((c) => c.page.id === "child1");
    expect(child1?.children).toHaveLength(1);
    expect(child1?.children[0]?.page.title).toBe("Grandchild");
  });

  it("wikiTreeAtom returns empty array when no pages", () => {
    const store = createStore();
    expect(store.get(wikiTreeAtom)).toHaveLength(0);
  });

  it("wikiTreeAtom handles multiple root-level pages", () => {
    const store = createStore();

    store.set(setWikiPagesAtom, [
      makePage({ id: "r1", title: "Root 1" }),
      makePage({ id: "r2", title: "Root 2" }),
    ]);

    const tree = store.get(wikiTreeAtom);
    expect(tree).toHaveLength(2);
  });

  it("pages can have source_turn_id", () => {
    const store = createStore();

    store.set(setWikiPagesAtom, [
      makePage({ id: "p1", title: "Auth Docs", source_turn_id: "turn_5" as TurnId }),
    ]);

    expect(store.get(wikiPagesAtom).get("p1")?.source_turn_id).toBe("turn_5");
  });

  it("resetDeepWikiStoreAtom clears pages and active page", () => {
    const store = createStore();

    store.set(setWikiPagesAtom, [makePage({ id: "p1" })]);
    store.set(activeWikiPageIdAtom, "p1");

    store.set(resetDeepWikiStoreAtom);

    expect(store.get(wikiPagesAtom).size).toBe(0);
    expect(store.get(activeWikiPageIdAtom)).toBeNull();
    expect(store.get(activeWikiPageAtom)).toBeNull();
  });
});
