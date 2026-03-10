import React from "react";

import { useSessionLifecycle } from "~shared/bootstrap/session-lifecycle";

import { type ContextSegment, useContextBreakdown } from "../../features/context-breakdown";
import { useContextPressure } from "../../features/context-monitor";
import { Button, InlineBanner, Text } from "../../shared/ui";

/**
 * Inline banner that appears when context window pressure is elevated or critical.
 * Shows usage percentage, estimated remaining turns, and action buttons.
 */
/** Stacked horizontal bar showing context token distribution */
function ContextBreakdownBar({ segments }: { segments: readonly ContextSegment[] }) {
  if (segments.length === 0) return null;

  return (
    <div
      className="flex w-full h-1.5 rounded-full overflow-hidden mt-1"
      data-testid="context-breakdown-bar"
    >
      {segments.map((seg) => (
        <div
          key={seg.label}
          className="h-full transition-[width] duration-normal"
          style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
          title={`${seg.label}: ${seg.tokens.toLocaleString()} tokens (${seg.pct}%)`}
        />
      ))}
    </div>
  );
}

export const ContextBanner = React.memo(function ContextBanner() {
  const { usagePct, pressureLevel, estimatedTurns, requestCompaction } = useContextPressure();
  const { segments } = useContextBreakdown();
  const { createSession } = useSessionLifecycle();

  if (pressureLevel === "normal") return null;

  const turnsLabel = estimatedTurns !== null ? ` ~${estimatedTurns} turns remaining.` : "";

  if (pressureLevel === "critical") {
    return (
      <InlineBanner variant="error">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <Text size="xs">
              Context nearly full ({Math.round(usagePct)}%).{turnsLabel} Responses may degrade.
            </Text>
            <span className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={requestCompaction}>
                Compact
              </Button>
              <Button variant="ghost" size="sm" onClick={createSession}>
                New Session
              </Button>
            </span>
          </div>
          <ContextBreakdownBar segments={segments} />
        </div>
      </InlineBanner>
    );
  }

  return (
    <InlineBanner variant="warning">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Text size="xs">
            Context {Math.round(usagePct)}% used.{turnsLabel}
          </Text>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={requestCompaction}>
            Compact
          </Button>
        </div>
        <ContextBreakdownBar segments={segments} />
      </div>
    </InlineBanner>
  );
});
