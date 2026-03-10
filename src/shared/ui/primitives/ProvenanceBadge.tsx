/**
 * ProvenanceBadge — Shows who initiated a command/session.
 *
 * Renders a small colored badge with icon indicating the source:
 * - user: no badge (default, clean)
 * - agent: robot icon + agent label
 * - task: task icon
 * - system: gear icon
 */

import { memo } from "react";

import { cn } from "../variants";
import { Icon } from "./Icon";

export type ProvenanceSource = "user" | "agent" | "task" | "system";

export interface ProvenanceBadgeProps {
  source: ProvenanceSource;
  label?: string;
  className?: string;
}

const CONFIG: Record<
  Exclude<ProvenanceSource, "user">,
  { iconName: string; bg: string; text: string; defaultLabel: string }
> = {
  agent: {
    iconName: "hubot",
    bg: "bg-vsc-info/15",
    text: "text-vsc-info",
    defaultLabel: "Agent",
  },
  task: {
    iconName: "tasklist",
    bg: "bg-vsc-warning/15",
    text: "text-vsc-warning",
    defaultLabel: "Task",
  },
  system: {
    iconName: "gear",
    bg: "bg-vsc-text-tertiary/15",
    text: "text-vsc-text-tertiary",
    defaultLabel: "System",
  },
};

export const ProvenanceBadge = memo(function ProvenanceBadge({
  source,
  label,
  className,
}: ProvenanceBadgeProps) {
  if (source === "user") return null;

  const config = CONFIG[source];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-3xs font-medium",
        config.bg,
        config.text,
        className,
      )}
    >
      <Icon name={config.iconName} size={11} />
      <span>{label ?? config.defaultLabel}</span>
    </span>
  );
});
