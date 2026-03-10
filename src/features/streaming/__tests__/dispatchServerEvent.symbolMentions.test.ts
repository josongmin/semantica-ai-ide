import { createStore } from "jotai";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import { symbolMentionsAtom } from "../../../entities/semantic-index";
import { resetIdCounter } from "../../../shared/lib/mocks";
import type { SymbolMention } from "../../../shared/protocol";
function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

describe("SET_SYMBOL_MENTIONS serverEvent", () => {
  it("stores symbol mentions via dispatch", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    const symbols: readonly SymbolMention[] = [
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

    dispatch({ t: "SET_SYMBOL_MENTIONS", symbols });

    const result = store.get(symbolMentionsAtom);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("calculateTotal");
    expect(result[0]?.kind).toBe("function");
    expect(result[1]?.name).toBe("User");
    expect(result[1]?.kind).toBe("class");
  });

  it("replaces previous symbol mentions", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({
      t: "SET_SYMBOL_MENTIONS",
      symbols: [{ name: "foo", kind: "function", file_path: "a.ts", turn_id: "t1" }],
    });

    expect(store.get(symbolMentionsAtom)).toHaveLength(1);

    dispatch({
      t: "SET_SYMBOL_MENTIONS",
      symbols: [
        { name: "bar", kind: "variable", file_path: "b.ts", turn_id: "t2" },
        { name: "baz", kind: "type", file_path: "c.ts", turn_id: "t2" },
      ],
    });

    const result = store.get(symbolMentionsAtom);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("bar");
    expect(result[1]?.name).toBe("baz");
  });

  it("clears symbols on RESET_STORES", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({
      t: "SET_SYMBOL_MENTIONS",
      symbols: [{ name: "foo", kind: "function", file_path: "a.ts", turn_id: "t1" }],
    });

    expect(store.get(symbolMentionsAtom)).toHaveLength(1);

    dispatch({ t: "RESET_STORES" });

    expect(store.get(symbolMentionsAtom)).toHaveLength(0);
  });
});
