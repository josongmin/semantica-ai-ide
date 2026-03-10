import { renderHook } from "@testing-library/react";

import { resetScrollLockState, useBodyScrollLock } from "../useBodyScrollLock";

describe("useBodyScrollLock", () => {
  beforeEach(() => {
    resetScrollLockState();
    document.body.style.overflow = "";
  });

  it('sets body.style.overflow = "hidden" when active', () => {
    renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores original overflow on deactivation", () => {
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useBodyScrollLock(active),
      { initialProps: { active: true } },
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender({ active: false });

    expect(document.body.style.overflow).toBe("");
  });

  it("does nothing when active is false", () => {
    renderHook(() => useBodyScrollLock(false));

    expect(document.body.style.overflow).toBe("");
  });

  it("reference counting: two active locks, one deactivates, body stays locked", () => {
    const hook1 = renderHook(({ active }: { active: boolean }) => useBodyScrollLock(active), {
      initialProps: { active: true },
    });
    renderHook(() => useBodyScrollLock(true));

    hook1.rerender({ active: false });

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("reference counting: both deactivate, body unlocks", () => {
    const hook1 = renderHook(({ active }: { active: boolean }) => useBodyScrollLock(active), {
      initialProps: { active: true },
    });
    const hook2 = renderHook(({ active }: { active: boolean }) => useBodyScrollLock(active), {
      initialProps: { active: true },
    });

    hook1.rerender({ active: false });
    hook2.rerender({ active: false });

    expect(document.body.style.overflow).toBe("");
  });

  it("preserves non-empty original overflow value", () => {
    document.body.style.overflow = "scroll";

    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useBodyScrollLock(active),
      { initialProps: { active: true } },
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender({ active: false });

    expect(document.body.style.overflow).toBe("scroll");
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });
});
