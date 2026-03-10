import { useCallback } from "react";
import { useSetAtom } from "jotai";

import { clearFocusedTurnAtom, focusedTurnIdAtom } from "../../../shared/lib";
import { logger } from "../../../shared/lib/logger";
import type { TurnId } from "../../../shared/protocol";

export function useTurnNavigation() {
  const setFocusedTurn = useSetAtom(focusedTurnIdAtom);
  const clearFocus = useSetAtom(clearFocusedTurnAtom);

  const scrollToTurn = useCallback(
    (turnId: TurnId) => {
      setFocusedTurn(turnId);
      clearFocus(); // auto-clear after animation

      // Dispatch custom event for MessageList to handle scroll
      window.dispatchEvent(new CustomEvent("scroll-to-turn", { detail: { turnId } }));
    },
    [setFocusedTurn, clearFocus],
  );

  const copyTurnLink = useCallback((turnId: TurnId) => {
    // For VS Code webview, we create a conceptual anchor
    const link = `#turn-${turnId}`;
    navigator.clipboard.writeText(link).catch((err: unknown) => logger.warn("[clipboard] writeText failed:", err));
  }, []);

  return { scrollToTurn, copyTurnLink };
}
