import React from "react";
import { useAtomValue } from "jotai";

import {
  currentIntentAtom,
  intentRootsAtom,
  intentTimelineAtom,
} from "../../entities/intent-timeline";
import type { IntentEntry, IntentStatus } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

// ─── Intent Node ─────────────────────────────────────────────

const STATUS_STYLES: Record<IntentStatus, { ring: string; bg: string; icon: string }> = {
  active: {
    ring: "ring-2 ring-vsc-info/40",
    bg: "bg-vsc-info/20 border-vsc-info",
    icon: "play",
  },
  completed: {
    ring: "",
    bg: "bg-vsc-success/20 border-vsc-success",
    icon: "check",
  },
  abandoned: {
    ring: "",
    bg: "bg-vsc-surface-2 border-vsc-border",
    icon: "close",
  },
  branched: {
    ring: "ring-1 ring-vsc-warning/30",
    bg: "bg-vsc-warning/20 border-vsc-warning",
    icon: "git-branch",
  },
};

interface IntentNodeProps {
  readonly entry: IntentEntry;
  readonly isLast: boolean;
}

const IntentNode = React.memo(function IntentNode({ entry, isLast }: IntentNodeProps) {
  const styles = STATUS_STYLES[entry.status];

  return (
    <div className="flex items-start gap-3" role="listitem">
      {/* Timeline connector */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            "size-7 rounded-full border-2 flex items-center justify-center",
            styles.bg,
            styles.ring,
            entry.status === "active" && "animate-pulse",
          )}
        >
          <Icon
            name={styles.icon}
            tokenSize="xs"
            className={cn(
              entry.status === "completed" && "text-vsc-success animate-[check-pop_0.3s_ease]",
              entry.status === "active" && "text-vsc-info",
              entry.status === "abandoned" && "text-vsc-text-ghost line-through",
              entry.status === "branched" && "text-vsc-warning",
            )}
          />
        </div>
        {!isLast && <div className="w-0.5 flex-1 min-h-[16px] bg-vsc-border/40" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-3">
        <Text
          size="sm"
          weight="medium"
          tone={entry.status === "abandoned" ? "ghost" : "primary"}
          className={cn(entry.status === "abandoned" && "line-through")}
        >
          {entry.summary}
        </Text>

        {entry.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {entry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-2xs bg-vsc-surface-2 text-vsc-text-ghost"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {entry.relatedFiles.length > 0 && (
          <Text size="2xs" tone="tertiary" className="mt-1">
            {entry.relatedFiles.length} files affected
          </Text>
        )}

        {entry.turnIds.length > 0 && (
          <Text size="2xs" tone="ghost" className="mt-0.5">
            {entry.turnIds.length} turns
          </Text>
        )}
      </div>
    </div>
  );
});

// ─── Intent Breadcrumb (for Subheader) ───────────────────────

export const IntentBreadcrumb = React.memo(function IntentBreadcrumb() {
  const current = useAtomValue(currentIntentAtom);
  if (!current) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1" data-testid="intent-breadcrumb">
      <Icon name="target" tokenSize="xs" className="text-vsc-info shrink-0" />
      <Text size="xs" tone="secondary" truncate>
        {current.summary}
      </Text>
      {current.tags.length > 0 && (
        <span className="text-2xs text-vsc-text-ghost">({current.tags[0]})</span>
      )}
    </div>
  );
});

// ─── Main Panel ──────────────────────────────────────────────

export const IntentTimelinePanel = React.memo(function IntentTimelinePanel() {
  const timeline = useAtomValue(intentTimelineAtom);
  const roots = useAtomValue(intentRootsAtom);

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-vsc-text-ghost">
        <Icon name="target" tokenSize="lg" className="mb-2 opacity-40" />
        <Text size="sm" tone="ghost">No intents tracked yet</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3" data-testid="intent-timeline-panel">
      <div className="flex items-center gap-2">
        <Icon name="target" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="bold">Intent Timeline</Text>
        <Text size="2xs" tone="ghost" className="ml-auto">
          {timeline.length} intents
        </Text>
      </div>

      <div role="list" aria-label="Intent timeline">
        {roots.map((entry, i) => (
          <IntentNode key={entry.id} entry={entry} isLast={i === roots.length - 1} />
        ))}
      </div>
    </div>
  );
});
