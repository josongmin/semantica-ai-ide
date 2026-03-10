import { createStore } from "jotai";

import { createPRSummary, resetIdCounter } from "../../../shared/lib/mocks";
import {
  prSummaryContentAtom,
  prSummaryDialogOpenAtom,
  resetPrSummaryStoreAtom,
  setPrSummaryContentAtom,
} from "../model/prSummaryAtoms";

beforeEach(() => {
  resetIdCounter();
});

describe("prSummaryAtoms", () => {
  it("prSummaryDialogOpenAtom defaults to false", () => {
    const store = createStore();
    expect(store.get(prSummaryDialogOpenAtom)).toBe(false);
  });

  it("prSummaryContentAtom defaults to null", () => {
    const store = createStore();
    expect(store.get(prSummaryContentAtom)).toBeNull();
  });

  it("setPrSummaryContentAtom sets the summary", () => {
    const store = createStore();
    const summary = createPRSummary();

    store.set(setPrSummaryContentAtom, summary);

    const result = store.get(prSummaryContentAtom);
    expect(result).toEqual(summary);
    expect(result?.title).toBe("Add authentication flow");
    expect(result?.changes).toHaveLength(2);
    expect(result?.intent).toBeTruthy();
    expect(result?.todos).toHaveLength(2);
  });

  it("setPrSummaryContentAtom replaces existing summary", () => {
    const store = createStore();
    const summary1 = createPRSummary({ title: "First PR" });
    const summary2 = createPRSummary({ title: "Second PR" });

    store.set(setPrSummaryContentAtom, summary1);
    store.set(setPrSummaryContentAtom, summary2);

    expect(store.get(prSummaryContentAtom)?.title).toBe("Second PR");
  });

  it("resetPrSummaryStoreAtom clears all state", () => {
    const store = createStore();
    const summary = createPRSummary();

    store.set(prSummaryDialogOpenAtom, true);
    store.set(setPrSummaryContentAtom, summary);

    expect(store.get(prSummaryDialogOpenAtom)).toBe(true);
    expect(store.get(prSummaryContentAtom)).not.toBeNull();

    store.set(resetPrSummaryStoreAtom);

    expect(store.get(prSummaryDialogOpenAtom)).toBe(false);
    expect(store.get(prSummaryContentAtom)).toBeNull();
  });

  it("summary with empty changes and todos", () => {
    const store = createStore();
    const summary = createPRSummary({
      title: "Refactoring",
      changes: [],
      todos: [],
      intent: "Clean up code",
    });

    store.set(setPrSummaryContentAtom, summary);

    const result = store.get(prSummaryContentAtom);
    expect(result?.changes).toHaveLength(0);
    expect(result?.todos).toHaveLength(0);
    expect(result?.intent).toBe("Clean up code");
  });
});
