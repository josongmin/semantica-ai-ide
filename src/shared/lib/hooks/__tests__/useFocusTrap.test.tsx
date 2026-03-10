import { createRef } from "react";
import { act, renderHook } from "@testing-library/react";

import { useFocusTrap } from "../useFocusTrap";
// Stub requestAnimationFrame to run synchronously in tests
beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createContainer(...buttonLabels: string[]) {
  const container = document.createElement("div");
  container.tabIndex = -1; // make container focusable as fallback
  for (const label of buttonLabels) {
    const btn = document.createElement("button");
    btn.textContent = label;
    container.appendChild(btn);
  }
  document.body.appendChild(container);
  return container;
}

function getButtons(container: HTMLElement) {
  return Array.from(container.querySelectorAll("button"));
}

describe("useFocusTrap", () => {
  let container: HTMLElement;

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("auto-focuses first focusable element when active", () => {
    container = createContainer("First", "Second", "Third");
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    renderHook(() => useFocusTrap(ref, true));

    const buttons = getButtons(container);
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("falls back to container focus when no focusable children", () => {
    container = document.createElement("div");
    container.tabIndex = -1;
    document.body.appendChild(container);

    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    renderHook(() => useFocusTrap(ref, true));

    expect(document.activeElement).toBe(container);
  });

  it("does not auto-focus when autoFocus is false", () => {
    container = createContainer("First", "Second");
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    // Focus something else before rendering
    const externalBtn = document.createElement("button");
    document.body.appendChild(externalBtn);
    externalBtn.focus();

    renderHook(() => useFocusTrap(ref, true, { autoFocus: false }));

    expect(document.activeElement).toBe(externalBtn);

    document.body.removeChild(externalBtn);
  });

  it("Tab wraps from last to first focusable element", () => {
    container = createContainer("First", "Second", "Third");
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    const { result } = renderHook(() => useFocusTrap(ref, true));

    const buttons = getButtons(container);
    // Focus the last button
    buttons[2]?.focus();
    expect(document.activeElement).toBe(buttons[2]);

    // Simulate Tab on the last element
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      result.current.handleTabKeyDown(tabEvent as unknown as React.KeyboardEvent);
    });

    expect(document.activeElement).toBe(buttons[0]);
  });

  it("Shift+Tab wraps from first to last", () => {
    container = createContainer("First", "Second", "Third");
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    const { result } = renderHook(() => useFocusTrap(ref, true));

    const buttons = getButtons(container);
    // Focus is already on the first button (auto-focus)
    expect(document.activeElement).toBe(buttons[0]);

    // Simulate Shift+Tab on the first element
    const shiftTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      result.current.handleTabKeyDown(shiftTabEvent as unknown as React.KeyboardEvent);
    });

    expect(document.activeElement).toBe(buttons[2]);
  });

  it("Tab does nothing when zero focusable elements", () => {
    container = document.createElement("div");
    container.tabIndex = -1;
    document.body.appendChild(container);

    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    const { result } = renderHook(() => useFocusTrap(ref, true));

    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });

    // Should not throw
    expect(() => {
      act(() => {
        result.current.handleTabKeyDown(tabEvent as unknown as React.KeyboardEvent);
      });
    }).not.toThrow();
  });

  it("saves focus on activation (previous activeElement)", () => {
    container = createContainer("First");
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    // Focus an external element before activating
    const externalBtn = document.createElement("button");
    externalBtn.textContent = "External";
    document.body.appendChild(externalBtn);
    externalBtn.focus();
    expect(document.activeElement).toBe(externalBtn);

    const { unmount } = renderHook(() => useFocusTrap(ref, true));

    // After activation, focus moves inside the trap
    expect(document.activeElement).not.toBe(externalBtn);

    // On cleanup, focus should restore
    unmount();

    expect(document.activeElement).toBe(externalBtn);

    document.body.removeChild(externalBtn);
  });

  it("restores focus on deactivation", () => {
    container = createContainer("First");
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    const externalBtn = document.createElement("button");
    externalBtn.textContent = "External";
    document.body.appendChild(externalBtn);
    externalBtn.focus();

    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useFocusTrap(ref, active),
      { initialProps: { active: true } },
    );

    expect(document.activeElement).not.toBe(externalBtn);

    rerender({ active: false });

    expect(document.activeElement).toBe(externalBtn);

    document.body.removeChild(externalBtn);
  });

  it("does not restore focus when restoreFocus is false", () => {
    container = createContainer("First");
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    const externalBtn = document.createElement("button");
    externalBtn.textContent = "External";
    document.body.appendChild(externalBtn);
    externalBtn.focus();

    const { unmount } = renderHook(() => useFocusTrap(ref, true, { restoreFocus: false }));

    unmount();

    // Focus should NOT have been restored to externalBtn
    expect(document.activeElement).not.toBe(externalBtn);

    document.body.removeChild(externalBtn);
  });

  it("does nothing when active is false", () => {
    container = createContainer("First", "Second");
    const ref = createRef<HTMLElement>();
    Object.defineProperty(ref, "current", { value: container, writable: true });

    const externalBtn = document.createElement("button");
    externalBtn.textContent = "External";
    document.body.appendChild(externalBtn);
    externalBtn.focus();

    renderHook(() => useFocusTrap(ref, false));

    // Focus should remain on the external button (no auto-focus)
    expect(document.activeElement).toBe(externalBtn);

    document.body.removeChild(externalBtn);
  });
});
