import { useEffect } from "react";

/**
 * Locks body scrolling when active.
 * Reference-counted: multiple concurrent locks are safe.
 *
 * originalOverflow is captured once when the first lock activates and
 * restored only when the last lock releases, regardless of unmount order.
 */
let lockCount = 0;
let originalOverflow: string | null = null;

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    if (lockCount === 0) {
      // Capture original value only when going from 0 → 1
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow ?? "";
        originalOverflow = null;
      }
    };
  }, [active]);
}

/** @internal Test-only: reset the reference counter */
export function resetScrollLockState(): void {
  lockCount = 0;
  originalOverflow = null;
}
