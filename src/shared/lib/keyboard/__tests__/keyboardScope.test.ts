import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  registerBinding,
  resetKeyboardScope,
  setOverlayActive,
} from "../keyboardScope";

beforeEach(() => {
  resetKeyboardScope();
});

function fireKey(key: string, opts?: Partial<KeyboardEventInit>) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  window.dispatchEvent(event);
  return event;
}

describe("keyboardScope dispatcher", () => {
  it("panel handler fires before global when zone matches", () => {
    const order: string[] = [];

    // Set up zone element for activeElement detection
    const zone = document.createElement("div");
    zone.dataset.keyboardZone = "test-panel";
    const btn = document.createElement("button");
    zone.appendChild(btn);
    document.body.appendChild(zone);
    btn.focus();

    registerBinding({
      id: "global-handler",
      scope: "global",
      handler: () => { order.push("global"); return true; },
    });

    registerBinding({
      id: "panel-handler",
      scope: "panel",
      panelId: "test-panel",
      handler: () => { order.push("panel"); return true; },
    });

    fireKey("k", { metaKey: true });

    // Panel fires first (scope order: overlay > panel > global)
    expect(order).toEqual(["panel"]);
    // Global should NOT have fired — panel claimed the event

    document.body.removeChild(zone);
  });

  it("global handler fires when panel does NOT claim", () => {
    const order: string[] = [];

    const zone = document.createElement("div");
    zone.dataset.keyboardZone = "test-panel";
    const btn = document.createElement("button");
    zone.appendChild(btn);
    document.body.appendChild(zone);
    btn.focus();

    registerBinding({
      id: "global-handler",
      scope: "global",
      handler: () => { order.push("global"); return true; },
    });

    registerBinding({
      id: "panel-handler",
      scope: "panel",
      panelId: "test-panel",
      handler: () => { order.push("panel"); return undefined; /* don't claim */ },
    });

    fireKey("b", { metaKey: true });

    // Panel runs first but doesn't claim → global gets it
    expect(order).toEqual(["panel", "global"]);

    document.body.removeChild(zone);
  });

  it("global handler fires when no zone is focused", () => {
    const order: string[] = [];

    // Focus body (no zone)
    (document.activeElement as HTMLElement).blur();

    registerBinding({
      id: "global-handler",
      scope: "global",
      handler: () => { order.push("global"); return true; },
    });

    registerBinding({
      id: "panel-handler",
      scope: "panel",
      panelId: "agent-panel",
      handler: () => { order.push("panel"); return true; },
    });

    fireKey("k", { metaKey: true });

    // No zone match → panel skipped → global handles it
    expect(order).toEqual(["global"]);
  });

  it("overlay blocks panel handlers", () => {
    const order: string[] = [];

    const zone = document.createElement("div");
    zone.dataset.keyboardZone = "test-panel";
    const btn = document.createElement("button");
    zone.appendChild(btn);
    document.body.appendChild(zone);
    btn.focus();

    setOverlayActive(true);

    registerBinding({
      id: "overlay-handler",
      scope: "overlay",
      handler: () => { order.push("overlay"); return true; },
    });

    registerBinding({
      id: "panel-handler",
      scope: "panel",
      panelId: "test-panel",
      handler: () => { order.push("panel"); return true; },
    });

    registerBinding({
      id: "global-handler",
      scope: "global",
      handler: () => { order.push("global"); return true; },
    });

    fireKey("Escape");

    // Overlay claims → panel and global never fire
    expect(order).toEqual(["overlay"]);

    document.body.removeChild(zone);
  });

  it("higher priority within same scope fires first", () => {
    const order: string[] = [];

    registerBinding({
      id: "low-priority",
      scope: "global",
      priority: 0,
      handler: () => { order.push("low"); return true; },
    });

    registerBinding({
      id: "high-priority",
      scope: "global",
      priority: 10,
      handler: () => { order.push("high"); return true; },
    });

    fireKey("x");

    expect(order).toEqual(["high"]);
  });

  it("unregister removes binding from dispatch", () => {
    const spy = vi.fn(() => true as const);
    const unregister = registerBinding({
      id: "temp",
      scope: "global",
      handler: spy,
    });

    fireKey("a");
    expect(spy).toHaveBeenCalledTimes(1);

    unregister();
    fireKey("a");
    expect(spy).toHaveBeenCalledTimes(1); // no second call
  });
});
