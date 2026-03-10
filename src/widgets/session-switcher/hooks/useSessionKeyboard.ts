import { type default as React, useCallback, useEffect, useRef } from "react";

export interface UseSessionKeyboardOptions {
  /** Total number of results currently shown. */
  resultCount: number;
  /** Current focus index. */
  focusIndex: number;
  /** Setter for focus index. */
  setFocusIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Called when the user presses Enter on a focused result. */
  onSelect: (index: number) => void;
  /** Called when the user triggers the "new session" shortcut. */
  onNewSession: () => void;
}

/**
 * Keyboard navigation for the session switcher list.
 * Handles ArrowUp/Down, Enter, and Cmd/Ctrl+N.
 */
export function useSessionKeyboard({
  resultCount,
  focusIndex,
  setFocusIndex,
  onSelect,
  onNewSession,
}: UseSessionKeyboardOptions) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((prev) => Math.min(prev + 1, Math.max(resultCount - 1, 0)));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          onSelect(focusIndex);
          break;
        case "n":
        case "N":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onNewSession();
          }
          break;
      }
    },
    [resultCount, focusIndex, setFocusIndex, onSelect, onNewSession],
  );

  // Scroll focused item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[focusIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusIndex]);

  return { handleKeyDown, listRef };
}
