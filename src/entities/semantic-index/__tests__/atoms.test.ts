import { createStore } from "jotai";

import type { SemanticSearchResult, SymbolMention } from "../../../shared/protocol";
import {
  indexFileCountAtom,
  indexProgressAtom,
  indexStatusAtom,
  indexStatusLabelAtom,
  isIndexReadyAtom,
  resetSemanticIndexStoreAtom,
  searchResultsAtom,
  setIndexStatusAtom,
  setSearchResultsAtom,
  setSymbolMentionsAtom,
  symbolMentionsAtom,
} from "../model/atoms";

describe("initial state", () => {
  it("has idle status and zero counters", () => {
    const store = createStore();
    expect(store.get(indexStatusAtom)).toBe("idle");
    expect(store.get(indexProgressAtom)).toBe(0);
    expect(store.get(indexFileCountAtom)).toBe(0);
    expect(store.get(searchResultsAtom)).toEqual([]);
    expect(store.get(symbolMentionsAtom)).toEqual([]);
  });
});

describe("setIndexStatusAtom", () => {
  it("sets status only", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "indexing" });
    expect(store.get(indexStatusAtom)).toBe("indexing");
    expect(store.get(indexProgressAtom)).toBe(0);
  });

  it("sets status with progress", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "indexing", progress: 42 });
    expect(store.get(indexStatusAtom)).toBe("indexing");
    expect(store.get(indexProgressAtom)).toBe(42);
  });

  it("sets status with file_count", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "ready", file_count: 12345 });
    expect(store.get(indexStatusAtom)).toBe("ready");
    expect(store.get(indexFileCountAtom)).toBe(12345);
  });

  it("sets status to error", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "error" });
    expect(store.get(indexStatusAtom)).toBe("error");
  });
});

describe("setSearchResultsAtom", () => {
  it("sets search results", () => {
    const store = createStore();
    const results: SemanticSearchResult[] = [
      { file_path: "src/index.ts", line_number: 10, snippet: "export default", score: 0.9 },
      { file_path: "src/app.ts", line_number: 5, snippet: "import React", score: 0.8 },
    ];

    store.set(setSearchResultsAtom, { query: "export default", results });

    expect(store.get(searchResultsAtom)).toHaveLength(2);
    expect(store.get(searchResultsAtom)[0]?.file_path).toBe("src/index.ts");
  });

  it("replaces previous results", () => {
    const store = createStore();
    const first: SemanticSearchResult[] = [
      { file_path: "src/a.ts", line_number: 1, snippet: "a", score: 0.5 },
    ];
    const second: SemanticSearchResult[] = [
      { file_path: "src/b.ts", line_number: 2, snippet: "b", score: 0.7 },
    ];

    store.set(setSearchResultsAtom, { query: "a", results: first });
    store.set(setSearchResultsAtom, { query: "b", results: second });

    expect(store.get(searchResultsAtom)).toHaveLength(1);
    expect(store.get(searchResultsAtom)[0]?.file_path).toBe("src/b.ts");
  });
});

describe("setSymbolMentionsAtom", () => {
  it("sets symbol mentions", () => {
    const store = createStore();
    const mentions: SymbolMention[] = [
      { name: "MyClass", kind: "class", file_path: "src/MyClass.ts", turn_id: "turn_1" },
    ];

    store.set(setSymbolMentionsAtom, mentions);

    expect(store.get(symbolMentionsAtom)).toHaveLength(1);
    expect(store.get(symbolMentionsAtom)[0]?.name).toBe("MyClass");
  });
});

describe("resetSemanticIndexStoreAtom", () => {
  it("resets all atoms to their initial values", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "ready", progress: 100, file_count: 999 });
    store.set(setSearchResultsAtom, {
      query: "test",
      results: [{ file_path: "x.ts", line_number: 1, snippet: "x", score: 1 }],
    });
    store.set(setSymbolMentionsAtom, [
      { name: "Foo", kind: "class", file_path: "Foo.ts", turn_id: "turn_1" },
    ]);

    store.set(resetSemanticIndexStoreAtom);

    expect(store.get(indexStatusAtom)).toBe("idle");
    expect(store.get(indexProgressAtom)).toBe(0);
    expect(store.get(indexFileCountAtom)).toBe(0);
    expect(store.get(searchResultsAtom)).toEqual([]);
    expect(store.get(symbolMentionsAtom)).toEqual([]);
  });
});

describe("indexStatusLabelAtom", () => {
  it("returns 'Idle' when status is idle", () => {
    const store = createStore();
    expect(store.get(indexStatusLabelAtom)).toBe("Idle");
  });

  it("returns 'Indexing... (42%)' when indexing at 42%", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "indexing", progress: 42 });
    expect(store.get(indexStatusLabelAtom)).toBe("Indexing... (42%)");
  });

  it("returns formatted ready label with file count", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "ready", file_count: 12345 });
    expect(store.get(indexStatusLabelAtom)).toBe("Ready (12,345 files)");
  });

  it("returns 'Error' when status is error", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "error" });
    expect(store.get(indexStatusLabelAtom)).toBe("Error");
  });
});

describe("isIndexReadyAtom", () => {
  it("returns false when idle", () => {
    const store = createStore();
    expect(store.get(isIndexReadyAtom)).toBe(false);
  });

  it("returns true when ready", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "ready" });
    expect(store.get(isIndexReadyAtom)).toBe(true);
  });

  it("returns false when indexing", () => {
    const store = createStore();
    store.set(setIndexStatusAtom, { status: "indexing" });
    expect(store.get(isIndexReadyAtom)).toBe(false);
  });
});
