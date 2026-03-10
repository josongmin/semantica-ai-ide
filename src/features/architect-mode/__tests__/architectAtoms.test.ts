import { createStore } from "jotai";

import { createArchitectState, resetIdCounter } from "../../../shared/lib/mocks";
import {
  architectStateAtom,
  resetArchitectStateAtom,
  setArchitectStateAtom,
} from "../model/architectAtoms";

beforeEach(() => {
  resetIdCounter();
});

describe("architectAtoms", () => {
  it("starts with null state", () => {
    const store = createStore();
    expect(store.get(architectStateAtom)).toBeNull();
  });

  it("setArchitectStateAtom sets the architect state", () => {
    const store = createStore();
    const state = createArchitectState({ active_role: "planner", model_name: "Opus" });

    store.set(setArchitectStateAtom, state);

    expect(store.get(architectStateAtom)).toEqual(state);
  });

  it("setArchitectStateAtom replaces previous state", () => {
    const store = createStore();
    store.set(
      setArchitectStateAtom,
      createArchitectState({ active_role: "planner", model_name: "Opus" }),
    );

    const updated = createArchitectState({ active_role: "coder", model_name: "Sonnet" });
    store.set(setArchitectStateAtom, updated);

    expect(store.get(architectStateAtom)?.active_role).toBe("coder");
    expect(store.get(architectStateAtom)?.model_name).toBe("Sonnet");
  });

  it("setArchitectStateAtom preserves task_description", () => {
    const store = createStore();
    const state = createArchitectState({
      active_role: "critic",
      model_name: "Opus",
      task_description: "Review the authentication flow",
    });

    store.set(setArchitectStateAtom, state);

    expect(store.get(architectStateAtom)?.task_description).toBe("Review the authentication flow");
  });

  it("resetArchitectStateAtom clears state", () => {
    const store = createStore();
    store.set(setArchitectStateAtom, createArchitectState({ active_role: "planner" }));
    expect(store.get(architectStateAtom)).not.toBeNull();

    store.set(resetArchitectStateAtom);
    expect(store.get(architectStateAtom)).toBeNull();
  });
});
