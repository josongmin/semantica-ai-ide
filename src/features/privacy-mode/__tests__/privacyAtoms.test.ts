import { createStore } from "jotai";

import { createPrivacyState, resetIdCounter } from "../../../shared/lib/mocks";
import {
  privacyStateAtom,
  resetPrivacyStateAtom,
  setPrivacyStateAtom,
} from "../model/privacyAtoms";

beforeEach(() => {
  resetIdCounter();
});

describe("privacyAtoms", () => {
  it("starts with null state", () => {
    const store = createStore();
    expect(store.get(privacyStateAtom)).toBeNull();
  });

  it("setPrivacyStateAtom sets the privacy state", () => {
    const store = createStore();
    const state = createPrivacyState({ mode: "local", details: "All local" });

    store.set(setPrivacyStateAtom, state);

    expect(store.get(privacyStateAtom)).toEqual(state);
  });

  it("setPrivacyStateAtom replaces previous state", () => {
    const store = createStore();
    store.set(setPrivacyStateAtom, createPrivacyState({ mode: "local" }));

    const updated = createPrivacyState({
      mode: "shared",
      details: "Data shared with model provider",
    });
    store.set(setPrivacyStateAtom, updated);

    expect(store.get(privacyStateAtom)?.mode).toBe("shared");
    expect(store.get(privacyStateAtom)?.details).toBe("Data shared with model provider");
  });

  it("setPrivacyStateAtom preserves policy_url", () => {
    const store = createStore();
    const state = createPrivacyState({
      mode: "stored",
      details: "Data may be stored",
      policy_url: "https://example.com/privacy",
    });

    store.set(setPrivacyStateAtom, state);

    expect(store.get(privacyStateAtom)?.policy_url).toBe("https://example.com/privacy");
  });

  it("setPrivacyStateAtom handles all three modes", () => {
    const store = createStore();

    store.set(setPrivacyStateAtom, createPrivacyState({ mode: "local" }));
    expect(store.get(privacyStateAtom)?.mode).toBe("local");

    store.set(setPrivacyStateAtom, createPrivacyState({ mode: "shared" }));
    expect(store.get(privacyStateAtom)?.mode).toBe("shared");

    store.set(setPrivacyStateAtom, createPrivacyState({ mode: "stored" }));
    expect(store.get(privacyStateAtom)?.mode).toBe("stored");
  });

  it("resetPrivacyStateAtom clears state", () => {
    const store = createStore();
    store.set(setPrivacyStateAtom, createPrivacyState({ mode: "local" }));
    expect(store.get(privacyStateAtom)).not.toBeNull();

    store.set(resetPrivacyStateAtom);
    expect(store.get(privacyStateAtom)).toBeNull();
  });
});
