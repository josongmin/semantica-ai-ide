import React from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { Icon } from "~shared/ui";

import { activeIntentAtom, clearIntentAtom } from "../useIntentRouter";

// ─── IntentIndicator ────────────────────────────────────
// Animated pill showing the current intent-driven routing mode.
// Clicking it clears the intent and returns to manual navigation.

export const IntentIndicator = React.memo(function IntentIndicator() {
  const activeIntent = useAtomValue(activeIntentAtom);
  const clearIntent = useSetAtom(clearIntentAtom);

  if (!activeIntent) return null;

  return (
    <button
      type="button"
      onClick={() => clearIntent()}
      className="inline-flex items-center gap-1 ml-2 px-2 h-[--height-row-sm] rounded-full
                 bg-vsc-accent/15 text-vsc-accent text-2xs font-medium
                 hover:bg-vsc-accent/25 cursor-pointer transition-colors duration-fast"
      style={{ animation: "slide-up-in 150ms var(--ease-spring) both" }}
      title="Click to clear intent (return to manual navigation)"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-vsc-accent" style={{ animation: "pulse 2s ease-in-out infinite" }} />
      <span>{activeIntent.replace(/-/g, " ")}</span>
      <Icon name="close" tokenSize="2xs" className="opacity-60" />
    </button>
  );
});
