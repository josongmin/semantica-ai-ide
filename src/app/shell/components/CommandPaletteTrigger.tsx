import React from "react";
import { useSetAtom } from "jotai";

import { conversationSearchOpenAtom } from "~shared/lib/atoms/dialogAtoms";
import { cn, Icon } from "~shared/ui";

// ─── CommandPaletteTrigger ──────────────────────────────
// Compact search button that opens the search overlay modal.

export const CommandPaletteTrigger = React.memo(function CommandPaletteTrigger() {
  const setSearchOpen = useSetAtom(conversationSearchOpenAtom);

  return (
    <button
      type="button"
      onClick={() => setSearchOpen(true)}
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2 rounded-md",
        "cursor-pointer bg-vsc-surface-2/40 border border-vsc-border/15",
        "text-2xs text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/60",
        "transition-colors duration-fast focus-ring",
      )}
      title="Command Palette (Cmd+Shift+P)"
    >
      <Icon name="search" tokenSize="2xs" />
      <span>Search</span>
      <kbd className="ml-0.5 text-2xs text-vsc-text-ghost/50 font-mono">{"\u2318K"}</kbd>
    </button>
  );
});
