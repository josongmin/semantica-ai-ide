import { type RefObject, useCallback, useEffect, useRef } from "react";

/** Standard CSS selector for focusable elements */
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface UseFocusTrapReturn {
  /** onKeyDown handler to attach to the trap container */
  handleTabKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Focus trap with auto-focus and focus restoration.
 * Extracted from Dialog's inline implementation.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: { autoFocus?: boolean; restoreFocus?: boolean } = {},
): UseFocusTrapReturn {
  const { autoFocus = true, restoreFocus = true } = options;
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save focus, auto-focus first element
  useEffect(() => {
    if (!active) return;

    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    let rafId: number | undefined;
    if (autoFocus) {
      rafId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const focusable = el.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        (focusable ?? el).focus();
      });
    }

    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      if (restoreFocus) {
        previousFocusRef.current?.focus();
      }
    };
  }, [active, autoFocus, restoreFocus, containerRef]);

  // Tab wrapping handler
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const el = containerRef.current;
      if (!el) return;

      const focusables = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;

      const first = focusables[0] as HTMLElement | undefined;
      const last = focusables[focusables.length - 1] as HTMLElement | undefined;
      if (first === undefined || last === undefined) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [containerRef],
  );

  return { handleTabKeyDown };
}
