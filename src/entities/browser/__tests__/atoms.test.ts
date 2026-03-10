import { createStore } from "jotai";

import type { BrowserConsoleEntry } from "../../../shared/protocol";
import {
  browserConsoleEntriesAtom,
  browserStateAtom,
  clearBrowserConsoleAtom,
  MAX_CONSOLE_ENTRIES,
  pushBrowserConsoleAtom,
  resetBrowserStoreAtom,
  updateBrowserStateAtom,
} from "../model/atoms";

let entryCounter = 0;

function createConsoleEntry(overrides: Partial<BrowserConsoleEntry> = {}): BrowserConsoleEntry {
  return {
    id: `entry_${++entryCounter}`,
    timestamp_ms: Date.now(),
    level: "log",
    message: "test message",
    ...overrides,
  };
}

beforeEach(() => {
  entryCounter = 0;
});

describe("initial state", () => {
  it("has empty url and not loading", () => {
    const store = createStore();
    const state = store.get(browserStateAtom);
    expect(state.url).toBe("");
    expect(state.loading).toBe(false);
  });

  it("has empty console entries", () => {
    const store = createStore();
    expect(store.get(browserConsoleEntriesAtom)).toEqual([]);
  });
});

describe("updateBrowserStateAtom", () => {
  it("merges partial state without overwriting other fields", () => {
    const store = createStore();
    store.set(updateBrowserStateAtom, { url: "http://localhost:3000" });

    const state = store.get(browserStateAtom);
    expect(state.url).toBe("http://localhost:3000");
    expect(state.loading).toBe(false);
  });

  it("updates loading flag independently", () => {
    const store = createStore();
    store.set(updateBrowserStateAtom, { url: "http://example.com" });
    store.set(updateBrowserStateAtom, { loading: true });

    const state = store.get(browserStateAtom);
    expect(state.url).toBe("http://example.com");
    expect(state.loading).toBe(true);
  });

  it("updates optional fields like title and error", () => {
    const store = createStore();
    store.set(updateBrowserStateAtom, {
      url: "http://example.com",
      title: "Example Domain",
      error: undefined,
    });

    const state = store.get(browserStateAtom);
    expect(state.title).toBe("Example Domain");
  });

  it("applies multiple updates cumulatively", () => {
    const store = createStore();
    store.set(updateBrowserStateAtom, { url: "http://a.com", loading: true });
    store.set(updateBrowserStateAtom, { loading: false, title: "Loaded" });

    const state = store.get(browserStateAtom);
    expect(state.url).toBe("http://a.com");
    expect(state.loading).toBe(false);
    expect(state.title).toBe("Loaded");
  });
});

describe("pushBrowserConsoleAtom", () => {
  it("appends entries in order", () => {
    const store = createStore();
    const e1 = createConsoleEntry({ message: "first" });
    const e2 = createConsoleEntry({ message: "second" });

    store.set(pushBrowserConsoleAtom, e1);
    store.set(pushBrowserConsoleAtom, e2);

    const entries = store.get(browserConsoleEntriesAtom);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.message).toBe("first");
    expect(entries[1]?.message).toBe("second");
  });

  it(`trims to MAX_CONSOLE_ENTRIES (${MAX_CONSOLE_ENTRIES}) when capacity is exceeded`, () => {
    const store = createStore();

    for (let i = 0; i < MAX_CONSOLE_ENTRIES + 10; i++) {
      store.set(pushBrowserConsoleAtom, createConsoleEntry({ message: `msg_${i}` }));
    }

    const entries = store.get(browserConsoleEntriesAtom);
    expect(entries).toHaveLength(MAX_CONSOLE_ENTRIES);
    // Should keep the most recent entries
    expect(entries[entries.length - 1]?.message).toBe(`msg_${MAX_CONSOLE_ENTRIES + 9}`);
  });

  it("keeps exactly the last MAX_CONSOLE_ENTRIES entries when trimming", () => {
    const store = createStore();
    const overflow = 5;

    for (let i = 0; i < MAX_CONSOLE_ENTRIES + overflow; i++) {
      store.set(
        pushBrowserConsoleAtom,
        createConsoleEntry({ id: `entry_id_${i}`, message: `m${i}` }),
      );
    }

    const entries = store.get(browserConsoleEntriesAtom);
    expect(entries).toHaveLength(MAX_CONSOLE_ENTRIES);
    expect(entries[0]?.message).toBe(`m${overflow}`);
  });
});

describe("clearBrowserConsoleAtom", () => {
  it("empties the console entries", () => {
    const store = createStore();
    store.set(pushBrowserConsoleAtom, createConsoleEntry());
    store.set(pushBrowserConsoleAtom, createConsoleEntry());

    store.set(clearBrowserConsoleAtom);

    expect(store.get(browserConsoleEntriesAtom)).toEqual([]);
  });
});

describe("resetBrowserStoreAtom", () => {
  it("resets browser state and console entries to defaults", () => {
    const store = createStore();
    store.set(updateBrowserStateAtom, { url: "http://example.com", loading: true, title: "Test" });
    store.set(pushBrowserConsoleAtom, createConsoleEntry({ message: "test log" }));

    store.set(resetBrowserStoreAtom);

    const state = store.get(browserStateAtom);
    expect(state.url).toBe("");
    expect(state.loading).toBe(false);
    expect(state.title).toBeUndefined();

    expect(store.get(browserConsoleEntriesAtom)).toEqual([]);
  });
});
