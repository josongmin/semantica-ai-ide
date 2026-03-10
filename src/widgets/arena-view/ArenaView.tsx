import React from "react";

import { useArenaMode } from "../../features/arena-mode";
import { Button, Text } from "../../shared/ui";
import { ArenaResponsePanel } from "./ArenaResponsePanel";

export const ArenaView = React.memo(function ArenaView() {
  const { slotA, slotB, winner, isStreaming, selectWinner } = useArenaMode();

  return (
    <div className="flex flex-col h-full gap-2 p-3" role="region" aria-label="Arena comparison">
      <div className="flex flex-row gap-2 flex-1 min-h-0">
        <ArenaResponsePanel response={slotA} slot="A" />
        <ArenaResponsePanel response={slotB} slot="B" />
      </div>

      <div className="flex items-center justify-center gap-2 py-2 border-t border-vsc-border">
        {winner !== null && (
          <Text size="xs" tone="secondary" className="mr-2">
            Winner: {winner === "tie" ? "Tie" : `Slot ${winner}`}
          </Text>
        )}
        <Button
          size="sm"
          variant={winner === "A" ? "primary" : "ghost"}
          onClick={() => selectWinner("A")}
          disabled={isStreaming}
          aria-label="A wins"
        >
          A Wins
        </Button>
        <Button
          size="sm"
          variant={winner === "tie" ? "primary" : "ghost"}
          onClick={() => selectWinner("tie")}
          disabled={isStreaming}
          aria-label="Tie"
        >
          Tie
        </Button>
        <Button
          size="sm"
          variant={winner === "B" ? "primary" : "ghost"}
          onClick={() => selectWinner("B")}
          disabled={isStreaming}
          aria-label="B wins"
        >
          B Wins
        </Button>
      </div>
    </div>
  );
});
