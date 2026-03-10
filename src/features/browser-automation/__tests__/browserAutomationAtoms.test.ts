import { createStore } from "jotai";

import type { BrowserAction } from "../../../shared/protocol";
import {
  browserActionsAtom,
  latestScreenshotAtom,
  resetBrowserAutomationStoreAtom,
  setBrowserActionsAtom,
  sortedBrowserActionsAtom,
} from "../model/browserAutomationAtoms";
function createBrowserAction(overrides: Partial<BrowserAction> = {}): BrowserAction {
  return {
    id: `action_${Math.random().toString(36).slice(2, 8)}`,
    type: "click",
    timestamp_ms: Date.now(),
    ...overrides,
  };
}

describe("browserAutomationAtoms", () => {
  it("starts with empty actions", () => {
    const store = createStore();
    expect(store.get(browserActionsAtom)).toHaveLength(0);
  });

  it("setBrowserActionsAtom adds actions", () => {
    const store = createStore();
    const a1 = createBrowserAction({ id: "a1", type: "click", target: "#btn" });
    const a2 = createBrowserAction({ id: "a2", type: "type", value: "hello" });

    store.set(setBrowserActionsAtom, [a1, a2]);

    expect(store.get(browserActionsAtom)).toHaveLength(2);
  });

  it("setBrowserActionsAtom merges with existing actions", () => {
    const store = createStore();
    const a1 = createBrowserAction({ id: "a1", type: "click" });
    store.set(setBrowserActionsAtom, [a1]);

    const a2 = createBrowserAction({ id: "a2", type: "navigate" });
    store.set(setBrowserActionsAtom, [a2]);

    expect(store.get(browserActionsAtom)).toHaveLength(2);
  });

  it("setBrowserActionsAtom updates existing actions by id", () => {
    const store = createStore();
    const a1 = createBrowserAction({ id: "a1", type: "click", target: "#old" });
    store.set(setBrowserActionsAtom, [a1]);

    const a1Updated = createBrowserAction({ id: "a1", type: "click", target: "#new" });
    store.set(setBrowserActionsAtom, [a1Updated]);

    const actions = store.get(browserActionsAtom);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.target).toBe("#new");
  });

  it("latestScreenshotAtom returns the last action with screenshot_url", () => {
    const store = createStore();
    store.set(setBrowserActionsAtom, [
      createBrowserAction({ id: "a1", type: "screenshot", screenshot_url: "https://img1.png" }),
      createBrowserAction({ id: "a2", type: "click" }),
      createBrowserAction({ id: "a3", type: "screenshot", screenshot_url: "https://img2.png" }),
    ]);

    expect(store.get(latestScreenshotAtom)).toBe("https://img2.png");
  });

  it("latestScreenshotAtom returns undefined when no screenshots", () => {
    const store = createStore();
    store.set(setBrowserActionsAtom, [createBrowserAction({ id: "a1", type: "click" })]);

    expect(store.get(latestScreenshotAtom)).toBeUndefined();
  });

  it("sortedBrowserActionsAtom returns actions sorted by timestamp", () => {
    const store = createStore();
    store.set(setBrowserActionsAtom, [
      createBrowserAction({ id: "a1", timestamp_ms: 3000 }),
      createBrowserAction({ id: "a2", timestamp_ms: 1000 }),
      createBrowserAction({ id: "a3", timestamp_ms: 2000 }),
    ]);

    const sorted = store.get(sortedBrowserActionsAtom);
    expect(sorted[0]?.id).toBe("a2");
    expect(sorted[1]?.id).toBe("a3");
    expect(sorted[2]?.id).toBe("a1");
  });

  it("resetBrowserAutomationStoreAtom clears all actions", () => {
    const store = createStore();
    store.set(setBrowserActionsAtom, [
      createBrowserAction({ id: "a1" }),
      createBrowserAction({ id: "a2" }),
    ]);
    expect(store.get(browserActionsAtom)).toHaveLength(2);

    store.set(resetBrowserAutomationStoreAtom);
    expect(store.get(browserActionsAtom)).toHaveLength(0);
  });

  it("handles all action types", () => {
    const store = createStore();
    const actions: BrowserAction[] = [
      createBrowserAction({ id: "a1", type: "click", target: "#btn" }),
      createBrowserAction({ id: "a2", type: "type", value: "hello world" }),
      createBrowserAction({ id: "a3", type: "navigate", value: "https://example.com" }),
      createBrowserAction({ id: "a4", type: "screenshot", screenshot_url: "https://img.png" }),
      createBrowserAction({ id: "a5", type: "scroll", target: "body" }),
    ];

    store.set(setBrowserActionsAtom, actions);
    expect(store.get(browserActionsAtom)).toHaveLength(5);
  });
});
