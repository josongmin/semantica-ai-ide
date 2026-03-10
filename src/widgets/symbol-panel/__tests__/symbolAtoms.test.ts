import { createStore } from "jotai";

import { setSymbolMentionsAtom, symbolMentionsAtom } from "../../../entities/semantic-index";
import type { SymbolMention } from "../../../shared/protocol";
describe("symbol mention atoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("initializes with empty array", () => {
    expect(store.get(symbolMentionsAtom)).toEqual([]);
  });

  it("sets symbol mentions via write atom", () => {
    const symbols: SymbolMention[] = [
      {
        name: "calculateTotal",
        kind: "function",
        file_path: "src/utils.ts",
        line: 42,
        turn_id: "turn_1",
      },
      {
        name: "User",
        kind: "class",
        file_path: "src/models.ts",
        line: 10,
        turn_id: "turn_1",
      },
    ];

    store.set(setSymbolMentionsAtom, symbols);
    expect(store.get(symbolMentionsAtom)).toEqual(symbols);
  });

  it("replaces previous symbols on update", () => {
    const initial: SymbolMention[] = [
      { name: "foo", kind: "function", file_path: "a.ts", turn_id: "turn_1" },
    ];
    const updated: SymbolMention[] = [
      { name: "bar", kind: "variable", file_path: "b.ts", turn_id: "turn_2" },
    ];

    store.set(setSymbolMentionsAtom, initial);
    expect(store.get(symbolMentionsAtom)).toHaveLength(1);

    store.set(setSymbolMentionsAtom, updated);
    expect(store.get(symbolMentionsAtom)).toHaveLength(1);
    expect(store.get(symbolMentionsAtom)[0]?.name).toBe("bar");
  });

  it("handles all symbol kinds", () => {
    const symbols: SymbolMention[] = [
      { name: "fn", kind: "function", file_path: "a.ts", turn_id: "t1" },
      { name: "Cls", kind: "class", file_path: "b.ts", turn_id: "t1" },
      { name: "val", kind: "variable", file_path: "c.ts", turn_id: "t1" },
      { name: "Typ", kind: "type", file_path: "d.ts", turn_id: "t1" },
      { name: "file.ts", kind: "file", file_path: "e.ts", turn_id: "t1" },
    ];

    store.set(setSymbolMentionsAtom, symbols);
    const result = store.get(symbolMentionsAtom);
    expect(result).toHaveLength(5);
    expect(new Set(result.map((s) => s.kind))).toEqual(
      new Set(["function", "class", "variable", "type", "file"]),
    );
  });
});
