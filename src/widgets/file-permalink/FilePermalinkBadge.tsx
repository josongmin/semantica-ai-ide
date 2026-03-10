import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { fileTurnLabelAtom } from "../../features/file-permalink";
import { clearFocusedTurnAtom, focusedTurnIdAtom } from "../../shared/lib";
import { Button } from "../../shared/ui";

interface FilePermalinkBadgeProps {
  filePath: string;
}

/**
 * FilePermalinkBadge: Small badge next to file names showing "Turn N" link.
 * Click to scroll to the turn that touched this file and highlight it.
 */
export const FilePermalinkBadge = React.memo(function FilePermalinkBadge({
  filePath,
}: FilePermalinkBadgeProps) {
  const getTurnLabel = useAtomValue(fileTurnLabelAtom);
  const setFocusedTurnId = useSetAtom(focusedTurnIdAtom);
  const clearFocusedTurn = useSetAtom(clearFocusedTurnAtom);

  const turnInfo = getTurnLabel(filePath);

  const handleClick = useCallback(() => {
    if (!turnInfo) return;
    setFocusedTurnId(turnInfo.turnId);
    clearFocusedTurn();
  }, [turnInfo, setFocusedTurnId, clearFocusedTurn]);

  if (!turnInfo) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="shrink-0 px-1 py-0.5 rounded text-2xs bg-vsc-badge-bg text-vsc-badge-fg hover:bg-vsc-info/20 transition-colors duration-fast h-auto"
      title={`Jump to ${turnInfo.label}`}
      aria-label={`Jump to ${turnInfo.label} for ${filePath}`}
      data-testid={`permalink-badge-${filePath}`}
    >
      {turnInfo.label}
    </Button>
  );
});
