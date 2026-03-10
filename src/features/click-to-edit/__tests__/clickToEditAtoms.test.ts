import { createStore } from "jotai";

import type { ElementMapping } from "../../../shared/protocol";
import {
  clickToEditEnabledAtom,
  elementMappingsAtom,
  resetClickToEditStoreAtom,
  setElementMappingsAtom,
} from "../model/clickToEditAtoms";
describe("clickToEditAtoms", () => {
  it("starts with empty mappings and disabled", () => {
    const store = createStore();

    expect(store.get(elementMappingsAtom)).toEqual([]);
    expect(store.get(clickToEditEnabledAtom)).toBe(false);
  });

  it("setElementMappingsAtom stores mappings", () => {
    const store = createStore();

    const mappings: ElementMapping[] = [
      { selector: ".btn", file_path: "src/Button.tsx", line: 5, column: 1 },
      { selector: "#header", file_path: "src/Header.tsx", line: 12, column: 3 },
    ];

    store.set(setElementMappingsAtom, mappings);

    const result = store.get(elementMappingsAtom);
    expect(result).toHaveLength(2);
    expect(result[0]?.selector).toBe(".btn");
    expect(result[1]?.file_path).toBe("src/Header.tsx");
  });

  it("setElementMappingsAtom replaces all previous mappings", () => {
    const store = createStore();

    store.set(setElementMappingsAtom, [
      { selector: ".old", file_path: "src/Old.tsx", line: 1, column: 1 },
    ]);

    store.set(setElementMappingsAtom, [
      { selector: ".new", file_path: "src/New.tsx", line: 2, column: 2 },
    ]);

    const result = store.get(elementMappingsAtom);
    expect(result).toHaveLength(1);
    expect(result[0]?.selector).toBe(".new");
  });

  it("clickToEditEnabledAtom can be toggled", () => {
    const store = createStore();

    store.set(clickToEditEnabledAtom, true);
    expect(store.get(clickToEditEnabledAtom)).toBe(true);

    store.set(clickToEditEnabledAtom, false);
    expect(store.get(clickToEditEnabledAtom)).toBe(false);
  });

  it("resetClickToEditStoreAtom clears mappings and disables", () => {
    const store = createStore();

    store.set(setElementMappingsAtom, [
      { selector: ".test", file_path: "src/Test.tsx", line: 1, column: 1 },
    ]);
    store.set(clickToEditEnabledAtom, true);

    store.set(resetClickToEditStoreAtom);

    expect(store.get(elementMappingsAtom)).toEqual([]);
    expect(store.get(clickToEditEnabledAtom)).toBe(false);
  });
});
