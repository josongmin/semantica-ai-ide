import React, { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import { diagnosticCountsAtom } from "~features/diagnostics/model/diagnosticAtoms";
import {
  hasActiveAgentsAtom,
  runningAgentsCountAtom,
} from "~shared/entities/agent-instance/model/atoms";
import { cn, Icon } from "~shared/ui";

import { indexProgressAtom, indexStatusAtom } from "../../entities/semantic-index/model/atoms";
import { notificationsAtom } from "../../features/notifications/model/notificationAtoms";
import { activeTrayViewAtom, trayVisibleAtom } from "./model/shellAtoms";
import { getViewsForFrame } from "./model/viewRegistry";

// ─── Constants ──────────────────────────────────────────

const BAR_H = 32;

// ─── Helpers ────────────────────────────────────────────

function getGraphVariant(status: string): "danger" | "active" | "success" | "muted" {
  if (status === "error") return "danger";
  if (status === "indexing") return "active";
  if (status === "ready") return "success";
  return "muted";
}

// ─── Hooks ──────────────────────────────────────────────

/** Tray visibility + active view switching logic. */
function useTrayControls() {
  const trayViews = getViewsForFrame("tray");
  const [activeView, setActiveView] = useAtom(activeTrayViewAtom);
  const [trayVisible, setTrayVisible] = useAtom(trayVisibleAtom);

  const handleTrayViewClick = useCallback(
    (viewId: string) => {
      if (trayVisible && activeView === viewId) {
        setTrayVisible(false);
      } else {
        setTrayVisible(true);
        setActiveView(viewId);
      }
    },
    [trayVisible, activeView, setTrayVisible, setActiveView],
  );

  return { trayViews, activeView, trayVisible, handleTrayViewClick };
}

/** Reads all cross-domain status data consumed by the bar. */
function useStatusBarData() {
  // Notifications
  const notifications = useAtomValue(notificationsAtom);
  const unreadCount = notifications.length;

  // Agent
  const hasActive = useAtomValue(hasActiveAgentsAtom);
  const runningCount = useAtomValue(runningAgentsCountAtom);

  // Graph / Index
  const indexStatus = useAtomValue(indexStatusAtom);
  const indexProgress = useAtomValue(indexProgressAtom);

  // Diagnostics
  const { errors, warnings } = useAtomValue(diagnosticCountsAtom);

  // Derived agent labels
  const agentLabel = hasActive ? `Agent Running (${runningCount})` : "Agent Idle";
  const agentIcon = hasActive ? "sync~spin" : "check";
  const agentVariant: PillVariant = hasActive ? "active" : "muted";

  // Derived graph labels
  let graphLabel: string;
  let graphIcon: string;
  if (indexStatus === "indexing") {
    graphLabel = `Indexing ${indexProgress}%`;
    graphIcon = "loading~spin";
  } else if (indexStatus === "ready") {
    graphLabel = "Indexed";
    graphIcon = "database";
  } else if (indexStatus === "error") {
    graphLabel = "Index Error";
    graphIcon = "warning";
  } else {
    graphLabel = "Index Idle";
    graphIcon = "circle-outline";
  }
  const graphVariant = getGraphVariant(indexStatus);

  return {
    unreadCount,
    agentLabel,
    agentIcon,
    agentVariant,
    graphLabel,
    graphIcon,
    graphVariant,
    errors,
    warnings,
  };
}

// ─── Status Bar ─────────────────────────────────────────

export const ShellStatusBar = React.memo(function ShellStatusBar() {
  const { trayViews, activeView, trayVisible, handleTrayViewClick } = useTrayControls();
  const {
    unreadCount,
    agentLabel,
    agentIcon,
    agentVariant,
    graphLabel,
    graphIcon,
    graphVariant,
    errors,
    warnings,
  } = useStatusBarData();

  return (
    <div className="relative shrink-0 select-none" style={{ height: BAR_H }}>
      {/* ─── Floating Tray Tab Bar ─── */}
      <div
        className={cn(
          "absolute left-1.5 z-10",
          "inline-flex items-center gap-0.5 px-1 rounded-md",
          "bg-vsc-surface-2/80 backdrop-blur-sm",
          "border border-vsc-border/15",
          "shadow-sm",
        )}
        style={{ top: -12, height: 24 }}
      >
        {trayViews.map((view) => {
          const isActive = trayVisible && activeView === view.id;
          return (
            <TrayToggleButton
              key={view.id}
              icon={view.icon}
              label={view.title}
              isActive={isActive}
              onClick={() => handleTrayViewClick(view.id)}
            />
          );
        })}
      </div>

      {/* ─── Status Bar ─── */}
      <footer
        role="contentinfo"
        className="absolute inset-0 flex items-center border-t border-vsc-border/20 bg-vsc-surface-1"
      >
        <div className="flex-1" />

        {/* Right: AI status + diagnostics + git + notifications */}
        <div className="flex items-center gap-px pr-1">
          <StatusPill icon={agentIcon} label={agentLabel} variant={agentVariant} />

          <Separator />

          <StatusPill icon={graphIcon} label={graphLabel} variant={graphVariant} />

          <Divider />

          <DiagnosticChip errors={errors} warnings={warnings} />

          <Separator />
          {unreadCount > 0 ? (
            <MetaChip icon="bell-dot" label={String(unreadCount)} accent />
          ) : (
            <MetaChip icon="bell" label="0" />
          )}
        </div>
      </footer>
    </div>
  );
});

// ─── Sub-components ─────────────────────────────────────

const Divider = React.memo(function Divider() {
  return <span className="w-px h-3.5 bg-vsc-border/50 mx-1.5 shrink-0" />;
});

const Separator = React.memo(function Separator() {
  return <span className="w-px h-3 bg-vsc-border/20 mx-0.5 shrink-0" />;
});

type PillVariant = "muted" | "active" | "success" | "danger";

const pillStyles: Record<PillVariant, string> = {
  muted: "text-vsc-text-ghost",
  active: "text-vsc-text-secondary",
  success: "text-vsc-text-secondary",
  danger: "text-vsc-error",
};

const StatusPill = React.memo(function StatusPill({
  icon,
  label,
  variant = "muted",
}: {
  icon: string;
  label: string;
  variant?: PillVariant;
}) {
  const isSpin = icon.endsWith("~spin");
  const iconName = isSpin ? icon.replace("~spin", "") : icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 rounded-full cursor-default text-xs tracking-wide",
        pillStyles[variant],
      )}
      style={{ height: BAR_H - 6 }}
    >
      <Icon name={iconName} size={12} className={cn("shrink-0", isSpin && "animate-spin")} />
      <span className="truncate max-w-[140px]">{label}</span>
    </span>
  );
});

const DiagnosticChip = React.memo(function DiagnosticChip({
  errors,
  warnings,
}: {
  errors: number;
  warnings: number;
}) {
  const hasErrors = errors > 0;
  const hasWarnings = warnings > 0;
  const clean = !hasErrors && !hasWarnings;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 rounded-full cursor-default text-xs tracking-wide",
        clean && "text-vsc-text-ghost",
      )}
      style={{ height: BAR_H - 6 }}
    >
      {/* Errors */}
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          hasErrors ? "text-vsc-error" : "text-vsc-text-ghost",
        )}
      >
        <Icon name="error" size={12} className="shrink-0" />
        <span>{errors}</span>
      </span>
      {/* Warnings */}
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          hasWarnings ? "text-vsc-warning" : "text-vsc-text-ghost",
        )}
      >
        <Icon name="warning" size={12} className="shrink-0" />
        <span>{warnings}</span>
      </span>
    </span>
  );
});

const TrayToggleButton = React.memo(function TrayToggleButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 rounded border-none cursor-pointer",
        "text-2xs tracking-[0.01em] transition-colors duration-fast",
        isActive
          ? "text-vsc-fg font-medium bg-vsc-surface-3/50"
          : "text-vsc-text-tertiary bg-transparent hover:text-vsc-text-secondary hover:bg-vsc-surface-3/30",
      )}
      style={{ height: 18 }}
      title={label}
      aria-pressed={isActive}
    >
      <Icon
        name={icon}
        size={11}
        className={cn("shrink-0", isActive ? "text-vsc-fg" : "opacity-60")}
      />
      <span className="leading-none">{label}</span>
    </button>
  );
});

const MetaChip = React.memo(function MetaChip({
  icon,
  label,
  accent,
}: {
  icon: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full cursor-default",
        accent
          ? "px-2 bg-vsc-error/12 text-vsc-error hover:bg-vsc-error/20"
          : "px-2 text-vsc-text-ghost hover:bg-vsc-surface-2/60",
      )}
      style={{ height: BAR_H - 6 }}
    >
      <Icon
        name={icon}
        size={13}
        className={cn("shrink-0", accent ? "text-vsc-error" : "opacity-70")}
      />
      {accent && (
        <span className="min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-vsc-error text-vsc-surface-0 text-2xs font-bold leading-none">
          {label}
        </span>
      )}
      {!accent && <span className="truncate max-w-[100px] text-xs tracking-[0.01em]">{label}</span>}
    </span>
  );
});
