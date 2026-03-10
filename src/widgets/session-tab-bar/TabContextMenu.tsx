import React, { useCallback, useMemo } from "react";

import { ContextMenu, type ContextMenuGroup } from "../../shared/ui";

export type ContextAction = "close" | "close-others" | "close-all" | "pin";

interface TabContextMenuProps {
  menu: { x: number; y: number };
  isPinned: boolean;
  onAction: (action: ContextAction) => void;
  onClose: () => void;
}

export const TabContextMenu = React.memo(function TabContextMenu({
  menu,
  isPinned,
  onAction,
  onClose,
}: TabContextMenuProps) {
  const groups: readonly ContextMenuGroup[] = useMemo(
    () => [
      {
        items: [
          { id: "close", label: "Close", icon: "close", shortcut: "⌘W" },
          { id: "close-others", label: "Close Others", icon: "close-all" },
          { id: "close-all", label: "Close All", icon: "clear-all" },
        ],
      },
      {
        items: [
          { id: "pin", label: isPinned ? "Unpin" : "Pin", icon: isPinned ? "pinned" : "pin" },
        ],
      },
    ],
    [isPinned],
  );

  const handleSelect = useCallback(
    (id: string) => {
      onAction(id as ContextAction);
    },
    [onAction],
  );

  return <ContextMenu position={menu} groups={groups} onSelect={handleSelect} onClose={onClose} />;
});
