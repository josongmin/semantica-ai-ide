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

// ─── Status Bar ─────────────────────────────────────────

const BAR_H = 28;

function getGraphVariant(status: string): "danger" | "active" | "success" | "muted" {
  if (status === "error") return "danger";
  if (status === "indexing") return "active";
  if (status === "ready") return "success";
  return "muted";
}

export const ShellStatusBar = React.memo(function ShellStatusBar() {
  const notifications = useAtomValue(notificationsAtom);
  const unreadCount = notifications.length;
  const trayViews = getViewsForFrame("tray");
  const [activeView, setActiveView] = useAtom(activeTrayViewAtom);
  const [trayVisible, setTrayVisible] = useAtom(trayVisibleAtom);

  // P0: Agent
  const hasActive = useAtomValue(hasActiveAgentsAtom);
  const runningCount = useAtomValue(runningAgentsCountAtom);

  // P0: Graph / Index
  const indexStatus = useAtomValue(indexStatusAtom);
  const indexProgress = useAtomValue(indexProgressAtom);

  // P0: Diagnostics
  const { errors, warnings } = useAtomValue(diagnosticCountsAtom);

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

  // ─── Derived labels ──────────────────────────────────
  const agentLabel = hasActive ? `Agent Running (${runningCount})` : "Agent Idle";
  const agentIcon = hasActive ? "sync~spin" : "check";

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

  return (
    <footer
      role="contentinfo"
      className="relative z-40 flex items-center border-t border-vsc-border/20 select-none shrink-0"
      style={{ height: BAR_H }}
    >
      {/* ─── Tray Buttons Zone ─── */}
      <div className="flex items-center gap-px pl-1 pr-1 self-stretch bg-vsc-surface-2/60">
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

      {/* ─── Meta Info Zone ─── */}
      <div className="flex-1 flex items-center justify-between bg-vsc-surface-1 self-stretch">
        {/* Left: empty spacer */}
        <div />

        {/* Right: AI status + diagnostics + git + notifications */}
        <div className="flex items-center gap-px pr-1">
          <StatusPill
            icon={agentIcon}
            label={agentLabel}
            variant={hasActive ? "active" : "muted"}
          />

          <Separator />

          <StatusPill icon={graphIcon} label={graphLabel} variant={getGraphVariant(indexStatus)} />

          <Divider />

          <DiagnosticChip errors={errors} warnings={warnings} />

          {unreadCount > 0 && (
            <>
              <Separator />
              <MetaChip icon="bell-dot" label={String(unreadCount)} accent />
            </>
          )}
        </div>
      </div>
    </footer>
  );
});

// ─── Sub-components ─────────────────────────────────────

function Divider() {
  return <span className="w-px h-3.5 bg-vsc-border/50 mx-1.5 shrink-0" />;
}

function Separator() {
  return <span className="w-px h-3 bg-vsc-border/20 mx-0.5 shrink-0" />;
}

type PillVariant = "muted" | "active" | "success" | "danger";

const pillStyles: Record<PillVariant, string> = {
  muted: "text-vsc-text-ghost",
  active: "text-vsc-text-secondary",
  success: "text-vsc-text-secondary",
  danger: "text-rose-500",
};

function StatusPill({
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
}

function DiagnosticChip({ errors, warnings }: { errors: number; warnings: number }) {
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
          hasErrors ? "text-rose-400" : "text-vsc-text-ghost",
        )}
      >
        <Icon name="error" size={12} className="shrink-0" />
        <span>{errors}</span>
      </span>
      {/* Warnings */}
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          hasWarnings ? "text-amber-400" : "text-vsc-text-ghost",
        )}
      >
        <Icon name="warning" size={12} className="shrink-0" />
        <span>{warnings}</span>
      </span>
    </span>
  );
}

function TrayToggleButton({
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
        "inline-flex items-center gap-1 px-2 rounded-md border-none cursor-pointer",
        "text-xs tracking-[0.01em]",
        isActive
          ? "text-white bg-vsc-fg/80 rounded-full"
          : "text-vsc-text-secondary bg-transparent hover:text-vsc-text-primary hover:bg-vsc-surface-3/60",
      )}
      style={{ height: BAR_H - 7 }}
      title={label}
      aria-pressed={isActive}
    >
      <Icon
        name={icon}
        size={12}
        className={cn("shrink-0", isActive ? "text-white" : "opacity-70")}
      />
      <span>{label}</span>
    </button>
  );
}

function MetaChip({ icon, label, accent }: { icon: string; label: string; accent?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full cursor-default",
        accent
          ? "px-2 bg-rose-500/12 text-rose-500 hover:bg-rose-500/20"
          : "px-2 text-vsc-text-ghost hover:bg-vsc-surface-2/60",
      )}
      style={{ height: BAR_H - 6 }}
    >
      <Icon
        name={icon}
        size={13}
        className={cn("shrink-0", accent ? "text-rose-500" : "opacity-70")}
      />
      {accent && (
        <span className="min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-2xs font-bold leading-none">
          {label}
        </span>
      )}
      {!accent && <span className="truncate max-w-[100px] text-xs tracking-[0.01em]">{label}</span>}
    </span>
  );
}
