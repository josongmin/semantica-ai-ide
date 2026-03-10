import React from "react";
import { useAtomValue } from "jotai";

import { turnOrderSortedAtom } from "~entities/message/turns";

import type { TurnId } from "../../shared/protocol";
import { ErrorBoundary, Text } from "../../shared/ui";
import { TurnPipelineSection } from "../turn-container";

/**
 * Pipeline overview shown in the feature popup.
 * Lists all turns with their pipeline sections.
 */
export const PipelineOverviewPanel = React.memo(function PipelineOverviewPanel() {
  const turnIds = useAtomValue(turnOrderSortedAtom);

  if (turnIds.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <Text size="xs" tone="tertiary">
          No turns yet
        </Text>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto p-2 space-y-3 scroll-shadow">
      {turnIds.map((turnId: TurnId) => (
        <ErrorBoundary key={turnId} fallback={null}>
          <TurnPipelineSection turnId={turnId} />
        </ErrorBoundary>
      ))}
    </div>
  );
});
