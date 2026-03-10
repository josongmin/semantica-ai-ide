/**
 * Reasoning Surface — AI reasoning process visualization
 *
 * Thin tab container that delegates to RootCauseTab and IntentTab.
 */

import { memo, useState } from "react";
import { useAtomValue } from "jotai";

import { activeIntentSessionAtom } from "~features/intent-engine";
import {
  rootCauseAnalysisAtom,
  rootCauseLoadingAtom,
} from "~features/root-cause";
import { IS_MAC } from "~shared/lib/hooks/usePlatform";
import { Icon } from "~shared/ui/primitives/Icon";
import { Kbd } from "~shared/ui/primitives/Kbd";

import { IntentTab } from "./IntentTab";
import { RootCauseTab } from "./RootCauseTab";

// ─── Types ──────────────────────────────────────────────

type ReasoningTab = "root-cause" | "intent";

// ─── Main Component ─────────────────────────────────────

export const ReasoningSurface = memo(function ReasoningSurface() {
  const [activeTab, setActiveTab] = useState<ReasoningTab>("root-cause");
  const analysis = useAtomValue(rootCauseAnalysisAtom);
  const loading = useAtomValue(rootCauseLoadingAtom);
  const intentSession = useAtomValue(activeIntentSessionAtom);

  const modKey = IS_MAC ? "Cmd" : "Ctrl";
  const hasContent = analysis !== null || loading || intentSession !== null;

  return (
    <div className="flex flex-col h-full bg-vsc-bg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-vsc-border/30">
        <Icon name="lightbulb" size={16} className="text-(--color-lens-reasoning)" />
        <h2 className="text-sm font-semibold text-vsc-text-primary">
          AI Reasoning
        </h2>
      </div>

      {/* Tab selector */}
      <div className="flex items-center border-b border-vsc-border/30 px-4">
        <button
          className={`px-3 py-2 text-xs transition-colors border-b-2 ${
            activeTab === "root-cause"
              ? "border-vsc-text-primary text-vsc-text-primary"
              : "border-transparent text-vsc-text-ghost hover:text-vsc-text-secondary"
          }`}
          onClick={() => setActiveTab("root-cause")}
        >
          Root Cause
        </button>
        <button
          className={`px-3 py-2 text-xs transition-colors border-b-2 ${
            activeTab === "intent"
              ? "border-vsc-text-primary text-vsc-text-primary"
              : "border-transparent text-vsc-text-ghost hover:text-vsc-text-secondary"
          }`}
          onClick={() => setActiveTab("intent")}
        >
          Intent
        </button>
      </div>

      {/* Content */}
      {hasContent && activeTab === "root-cause" && (
        <RootCauseTab analysis={analysis} loading={loading} />
      )}
      {hasContent && activeTab !== "root-cause" && (
        <IntentTab session={intentSession} />
      )}
      {!hasContent && (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Icon
              name="lightbulb"
              size={48}
              className="mx-auto text-vsc-text-ghost/30"
            />
            <p className="text-sm text-vsc-text-secondary">
              No active reasoning process.
            </p>
            <div className="space-y-1">
              <p className="text-2xs text-vsc-text-ghost flex items-center justify-center gap-1">
                <Kbd>{modKey}+Shift+R</Kbd>
                <span>for Root Cause</span>
              </p>
              <p className="text-2xs text-vsc-text-ghost flex items-center justify-center gap-1">
                <Kbd>{modKey}+I</Kbd>
                <span>for Intent</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
