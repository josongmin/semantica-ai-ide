import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import type { TurnId } from "../../shared/protocol";

interface UseTocKeyboardNavOptions {
  tocOpen: boolean;
  turnIds: readonly TurnId[];
  onNavigate: (turnId: TurnId) => void;
  onClose: () => void;
}

/**
 * Keyboard navigation for the Turn Table of Contents modal.
 * Handles ArrowUp/Down for focus, Enter for selection, Escape to close,
 * and auto-focuses the first card on open.
 */
export function useTocKeyboardNav({
  tocOpen,
  turnIds,
  onNavigate,
  onClose,
}: UseTocKeyboardNavOptions) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setCardRef = useCallback(
    (index: number) => (el: HTMLButtonElement | null) => {
      cardRefs.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    if (!tocOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const cards = cardRefs.current.filter(Boolean);
      if (cards.length === 0) return;
      const active = document.activeElement as HTMLButtonElement | null;
      const idx = active ? cards.indexOf(active) : -1;
      if (e.key === "ArrowDown" && idx < cards.length - 1) {
        e.preventDefault();
        cards[idx + 1]?.focus();
      } else if (e.key === "ArrowUp" && idx > 0) {
        e.preventDefault();
        cards[idx - 1]?.focus();
      } else if (e.key === "ArrowUp" && idx <= 0) {
        e.preventDefault();
        cards[0]?.focus();
      } else if (e.key === "Enter" && idx >= 0) {
        e.preventDefault();
        const tid = turnIds[idx];
        if (tid !== undefined) onNavigate(tid);
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [tocOpen, onClose, onNavigate, turnIds]);

  useLayoutEffect(() => {
    if (tocOpen && turnIds.length > 0) {
      cardRefs.current[0]?.focus();
    }
  }, [tocOpen, turnIds.length]);

  return { setCardRef };
}
