import { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { promptHistoryAtom, pushPromptHistoryAtom } from "./promptHistoryAtoms";

interface PromptHistoryResult {
  /** Push a new entry to history (call on send) */
  push: (text: string) => void;
  /**
   * Navigate history. Returns the text to set in the input, or null if no navigation occurred.
   * @param direction "up" for older, "down" for newer
   * @param currentText the current input text (saved as draft when entering history)
   */
  navigate: (direction: "up" | "down", currentText: string) => string | null;
  /** Reset navigation index (call when user manually types) */
  resetNavigation: () => void;
}

/**
 * Hook for ↑/↓ arrow prompt history recall.
 *
 * -1 = not navigating (showing current draft)
 *  0 = most recent history entry
 *  N = Nth history entry
 */
export function usePromptHistory(): PromptHistoryResult {
  const history = useAtomValue(promptHistoryAtom);
  const pushHistory = useSetAtom(pushPromptHistoryAtom);

  // Navigation state kept in refs to avoid re-renders on every arrow press
  const indexRef = useRef(-1);
  const draftRef = useRef("");

  const push = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed) pushHistory(trimmed);
      indexRef.current = -1;
      draftRef.current = "";
    },
    [pushHistory],
  );

  const navigate = useCallback(
    (direction: "up" | "down", currentText: string): string | null => {
      if (history.length === 0) return null;

      const currentIndex = indexRef.current;

      if (direction === "up") {
        if (currentIndex === -1) {
          // Entering history: save current text as draft
          draftRef.current = currentText;
          indexRef.current = 0;
          return history[0] ?? null;
        }
        if (currentIndex < history.length - 1) {
          indexRef.current = currentIndex + 1;
          return history[currentIndex + 1] ?? null;
        }
        // Already at oldest entry
        return null;
      }

      // direction === "down"
      if (currentIndex <= -1) return null; // Already at draft
      if (currentIndex === 0) {
        // Return to draft
        indexRef.current = -1;
        return draftRef.current;
      }
      indexRef.current = currentIndex - 1;
      return history[currentIndex - 1] ?? null;
    },
    [history],
  );

  const resetNavigation = useCallback(() => {
    indexRef.current = -1;
    draftRef.current = "";
  }, []);

  return { push, navigate, resetNavigation };
}
