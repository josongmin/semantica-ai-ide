import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { getVscodeApi } from "../../shared/lib";
import { Icon, Text, Tooltip } from "../../shared/ui";

/**
 * Small badge in header showing "Forked from Session X, Turn Y" with link.
 * Only renders when the current session was forked from another.
 */
export const ForkIndicator = React.memo(function ForkIndicator() {
  const meta = useAtomValue(sessionMetaAtom);

  const handleNavigateToSource = useCallback(() => {
    if (!meta.forked_from) return;
    getVscodeApi().postMessage({
      type: "RESUME_SESSION",
      session_id: meta.forked_from.session_id,
    });
  }, [meta.forked_from]);

  if (!meta.forked_from) return null;

  const sourceId = meta.forked_from.session_id;
  const sourceTurn = meta.forked_from.turn_id;
  const shortSessionId =
    typeof sourceId === "string" && sourceId.length > 8 ? `${sourceId.slice(0, 8)}...` : sourceId;

  return (
    <Tooltip content={`Forked from Session ${sourceId}, Turn ${sourceTurn} — click to open source`}>
      <button
        type="button"
        onClick={handleNavigateToSource}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded
                   border border-vsc-border bg-vsc-surface-2 text-vsc-text-secondary text-2xs
                   hover:bg-vsc-list-hover hover:text-vsc-fg transition-colors duration-fast cursor-pointer focus-ring"
        aria-label={`Forked from Session ${sourceId}, Turn ${sourceTurn}`}
        data-testid="fork-indicator"
      >
        <Icon name="git-compare" tokenSize="2xs" />
        <Text size="2xs" weight="medium">
          Forked from {shortSessionId}
        </Text>
      </button>
    </Tooltip>
  );
});
