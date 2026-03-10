import { useCallback, useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { turnOrderSortedAtom } from "~entities/message/turns";
import { focusedTurnIndexAtom } from "~shared/lib";
import { activityFeedVisibleAtom } from "~shared/lib/atoms/dialogAtoms";

/** Custom DOM events used to bridge keyboard shortcuts → widget handlers */
export const COPY_CONVERSATION_EVENT = "app:copy-conversation";
export const OPEN_COMMAND_PALETTE_EVENT = "app:open-command-palette";
export const FOCUS_PROMPT_EVENT = "app:focus-prompt";

interface UseKeyboardNavigationOptions {
  scrollToIndex: (index: number) => void;
}

export function useKeyboardNavigation({ scrollToIndex }: UseKeyboardNavigationOptions) {
  const turnIds = useAtomValue(turnOrderSortedAtom);
  const [focusedIndex, setFocusedIndex] = useAtom(focusedTurnIndexAtom);
  const setFeedVisible = useSetAtom(activityFeedVisibleAtom);

  // Refs for stable closure — avoids listener churn on every state change
  const turnIdsRef = useRef(turnIds);
  const focusedIndexRef = useRef(focusedIndex);
  const scrollToIndexRef = useRef(scrollToIndex);

  useEffect(() => {
    turnIdsRef.current = turnIds;
    focusedIndexRef.current = focusedIndex;
    scrollToIndexRef.current = scrollToIndex;
  }, [turnIds, focusedIndex, scrollToIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl shortcuts work even in input fields
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "k": {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
            return;
          }
          case "/": {
            e.preventDefault();
            setFeedVisible((v) => !v);
            return;
          }
          case "l": {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent(FOCUS_PROMPT_EVENT));
            return;
          }
        }
        // Cmd+Shift+C → copy conversation (delegates to HeaderBar handler)
        if (e.shiftKey && (e.key === "C" || e.key === "c")) {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent(COPY_CONVERSATION_EVENT));
          return;
        }
      }

      // Ignore non-modifier keys when typing in input fields
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement).isContentEditable) return;

      const count = turnIdsRef.current.length;
      if (count === 0 && e.key !== "/") return;

      const idx = focusedIndexRef.current;
      switch (e.key) {
        case "j": {
          e.preventDefault();
          const next = idx < count - 1 ? idx + 1 : 0;
          setFocusedIndex(next);
          scrollToIndexRef.current(next);
          break;
        }
        case "k": {
          e.preventDefault();
          const prev = idx > 0 ? idx - 1 : count - 1;
          setFocusedIndex(prev);
          scrollToIndexRef.current(prev);
          break;
        }
        case "G": {
          e.preventDefault();
          const last = count - 1;
          setFocusedIndex(last);
          scrollToIndexRef.current(last);
          break;
        }
        case "/": {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent(FOCUS_PROMPT_EVENT));
          break;
        }
        case "Escape": {
          e.preventDefault();
          setFocusedIndex(-1);
          break;
        }
      }
    },
    // Only stable setter functions — no array/object deps that churn
    [setFocusedIndex, setFeedVisible],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { focusedIndex };
}
