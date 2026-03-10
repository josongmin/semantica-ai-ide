import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { keyboardNavAdapterAtom } from "~shared/lib";

import { useKeyboardNavigation } from "./useKeyboardNavigation";

/**
 * Hydrates the shared-layer `keyboardNavAdapterAtom` so that widget
 * code can consume the keyboard-navigation hook without importing this
 * feature directly (DIP / FSD compliance).
 *
 * Mount this once near the app root.
 */
export function useHydrateKeyboardNavAdapter(): void {
  const setAdapter = useSetAtom(keyboardNavAdapterAtom);

  useEffect(() => {
    setAdapter(() => useKeyboardNavigation);
    return () => setAdapter(null);
  }, [setAdapter]);
}
