import React from "react";
import { useAtom, useAtomValue } from "jotai";

import { allFileChangesAtom } from "~entities/diff";
import { sessionMetricsFromTurnsAtom } from "~entities/message/turns";
import { sessionMetaAtom } from "~entities/session/state";

import { turnTocOpenAtom } from "../../shared/lib";
import { formatCost, formatTokens } from "../../shared/lib/formatters";
import { Button, cn, Icon, Text, Tooltip } from "../../shared/ui";
import { ForkIndicator } from "../fork-indicator";
import { CostSummaryBar } from "../resource-monitor";
import { SettingsMenu } from "../settings-menu";

/** Mock title for dev/demo when session has no summary */
const MOCK_TITLE = "New conversation";

/**
 * GNB: session context only — title/summary + stats + History (turns).
 * All feature toggles moved to FeatureBar.
 */
export const HeaderBar = React.memo(function HeaderBar() {
  const meta = useAtomValue(sessionMetaAtom);
  const fileChanges = useAtomValue(allFileChangesAtom);
  const [tocOpen, setTocOpen] = useAtom(turnTocOpenAtom);

  const {summary} = meta;
  const isRunning = meta.status === "running";

  const fromTurns = useAtomValue(sessionMetricsFromTurnsAtom);
  const tokensIn = Math.max(meta.tokens_in ?? 0, fromTurns.tokens_in);
  const tokensOut = Math.max(meta.tokens_out ?? 0, fromTurns.tokens_out);
  const costUsd = Math.max(meta.cost_usd ?? 0, fromTurns.cost_usd);
  const filesCount = fileChanges.length;
  const insertions = fileChanges.reduce((sum, fc) => sum + fc.insertions, 0);
  const deletions = fileChanges.reduce((sum, fc) => sum + fc.deletions, 0);
  const hasRealStats =
    tokensIn > 0 ||
    tokensOut > 0 ||
    costUsd > 0 ||
    filesCount > 0 ||
    insertions > 0 ||
    deletions > 0;
  const showMockStats = import.meta.env.DEV && import.meta.env.MODE !== "test" && !hasRealStats;
  const displayTokensIn = hasRealStats ? tokensIn : 12340;
  const displayTokensOut = hasRealStats ? tokensOut : 5680;
  const displayCost = hasRealStats ? costUsd : 0.0234;
  const displayFiles = hasRealStats ? filesCount : 4;
  const displayInsertions = hasRealStats ? insertions : 89;
  const displayDeletions = hasRealStats ? deletions : 12;
  const hasStats = hasRealStats || showMockStats;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-vsc-surface-1 text-xs" role="banner">
      {isRunning && (
        <span role="status" aria-live="polite">
          <Text size="2xs" tone="success" className="animate-pulse">
            running
          </Text>
        </span>
      )}

      <ForkIndicator />

      {/* Session summary — primary content (mock title when empty) */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <Text
          size="xs"
          tone={summary ? "primary" : "ghost"}
          truncate
          className="flex-1 min-w-0"
          title={summary ?? MOCK_TITLE}
        >
          {summary ?? MOCK_TITLE}
        </Text>
      </div>

      {/* Statistics summary — tokens, files, +/- lines, cost (mock in dev when no data) */}
      {hasStats && (
        <div
          className="flex items-center gap-2 text-vsc-text-tertiary shrink-0"
          role="status"
          aria-label={`Tokens: ${displayTokensIn + displayTokensOut}, Files: ${displayFiles}, +${displayInsertions} -${displayDeletions}, Cost: $${displayCost}`}
        >
          <Text size="2xs" tone="tertiary" className="tabular-nums">
            {formatTokens(displayTokensIn)}/{formatTokens(displayTokensOut)}
          </Text>
          <span className="flex items-center gap-1">
            <Icon name="symbol-file" tokenSize="2xs" />
            <Text size="2xs" tone="tertiary">
              {displayFiles}
            </Text>
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <Text size="2xs" tone="success">
              +{displayInsertions}
            </Text>
            <Text size="2xs" tone="error">
              -{displayDeletions}
            </Text>
          </span>
          <Text size="2xs" tone="tertiary" className="tabular-nums">
            {formatCost(displayCost)}
          </Text>
        </div>
      )}

      {/* Resource monitor cost summary */}
      <CostSummaryBar />

      {/* History + Settings — compact icon group */}
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip content={tocOpen ? "Hide turn list (⇧⌘O)" : "Turn list (⇧⌘O)"}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTocOpen((v) => !v)}
            aria-label={tocOpen ? "Hide turn list" : "Show turn list"}
            className={cn("w-6 h-6 rounded-sm", tocOpen && "bg-vsc-list-active")}
            title="Turn list"
          >
            <Icon
              name="history"
              tokenSize="xs"
              className={tocOpen ? "text-vsc-fg" : "text-vsc-text-tertiary"}
            />
          </Button>
        </Tooltip>
        <SettingsMenu compact className="shrink-0" />
      </div>
    </div>
  );
});
