import { createRef } from "react";
import { fireEvent, renderHook } from "@testing-library/react";

import { useClickOutside } from "../useClickOutside";

describe("useClickOutside", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function renderWithRef(onClickOutside: () => void, active: boolean) {
    const ref = createRef<HTMLElement>();
    // Assign the container as the ref current value
    Object.defineProperty(ref, "current", { value: container, writable: true });

    return renderHook(({ cb, isActive }) => useClickOutside(ref, cb, isActive), {
      initialProps: { cb: onClickOutside, isActive: active },
    });
  }

  it("calls onClickOutside when clicking outside the ref element", () => {
    const onClickOutside = vi.fn();
    renderWithRef(onClickOutside, true);

    fireEvent.mouseDown(document.body);

    expect(onClickOutside).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClickOutside when clicking inside", () => {
    const onClickOutside = vi.fn();
    renderWithRef(onClickOutside, true);

    fireEvent.mouseDown(container);

    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("does NOT listen when active is false", () => {
    const onClickOutside = vi.fn();
    renderWithRef(onClickOutside, false);

    fireEvent.mouseDown(document.body);

    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("cleans up listener on deactivation", () => {
    const onClickOutside = vi.fn();
    const { rerender } = renderWithRef(onClickOutside, true);

    rerender({ cb: onClickOutside, isActive: false });

    fireEvent.mouseDown(document.body);
    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", () => {
    const onClickOutside = vi.fn();
    const { unmount } = renderWithRef(onClickOutside, true);

    unmount();

    fireEvent.mouseDown(document.body);
    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("handles null ref gracefully (no crash)", () => {
    const onClickOutside = vi.fn();
    const ref = createRef<HTMLElement>();
    // ref.current is null by default

    renderHook(() => useClickOutside(ref, onClickOutside, true));

    // Should not throw
    expect(() => fireEvent.mouseDown(document.body)).not.toThrow();
    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("uses mousedown event (not click)", () => {
    const onClickOutside = vi.fn();
    const addSpy = vi.spyOn(document, "addEventListener");

    renderWithRef(onClickOutside, true);

    expect(addSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    // click should not trigger
    fireEvent.click(document.body);
    expect(onClickOutside).not.toHaveBeenCalled();

    // mousedown should trigger
    fireEvent.mouseDown(document.body);
    expect(onClickOutside).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
  });
});
