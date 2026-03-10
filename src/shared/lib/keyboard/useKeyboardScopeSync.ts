import { useEffect } from "react";
import { useAtomValue } from "jotai";

import { overlayStackAtom } from "../atoms/overlayAtoms";
import { setOverlayActive } from "./keyboardScope";

/**
 * Syncs external state (overlay stack) into the keyboard scope dispatcher.
 * Call once at the shell root (e.g., ShellLayout or StreamingBootstrap).
 */
export function useKeyboardScopeSync(): void {
  const overlayStack = useAtomValue(overlayStackAtom);

  useEffect(() => {
    setOverlayActive(overlayStack.length > 0);
  }, [overlayStack]);
}
