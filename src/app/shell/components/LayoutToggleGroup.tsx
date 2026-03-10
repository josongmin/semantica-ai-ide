import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import {
  agentPanelVisibleAtom,
  sidebarVisibleAtom,
  toggleAgentPanelAtom,
  toggleSidebarAtom,
  toggleTrayAtom,
  trayVisibleAtom,
} from "../model/shellAtoms";

// ─── LayoutToggleGroup ──────────────────────────────────
// Sidebar / Bottom-panel / Agent-panel toggle buttons.

export const LayoutToggleGroup = React.memo(function LayoutToggleGroup() {
  const toggleSidebar = useSetAtom(toggleSidebarAtom);
  const toggleTray = useSetAtom(toggleTrayAtom);
  const toggleAgent = useSetAtom(toggleAgentPanelAtom);
  const sidebarOn = useAtomValue(sidebarVisibleAtom);
  const trayOn = useAtomValue(trayVisibleAtom);
  const agentOn = useAtomValue(agentPanelVisibleAtom);

  const handleToggleSidebar = useCallback(() => toggleSidebar(), [toggleSidebar]);
  const handleToggleBottom = useCallback(() => toggleTray(), [toggleTray]);
  const handleToggleAgent = useCallback(() => toggleAgent(), [toggleAgent]);

  return (
    <>
      <LayoutToggle
        icon="layout-sidebar-left"
        label="Sidebar"
        shortcut={"\u2318B"}
        isOn={sidebarOn}
        onToggle={handleToggleSidebar}
      />
      <LayoutToggle
        icon="layout-panel"
        label="Panel"
        shortcut={"\u2318J"}
        isOn={trayOn}
        onToggle={handleToggleBottom}
      />
      <LayoutToggle
        icon="layout-sidebar-right"
        label="Agent"
        shortcut={"\u2318K\u2318K"}
        isOn={agentOn}
        onToggle={handleToggleAgent}
      />
    </>
  );
});

// ─── Individual toggle button ───────────────────────────

const LayoutToggle = React.memo(function LayoutToggle({
  icon,
  label,
  shortcut,
  isOn,
  onToggle,
}: {
  icon: string;
  label: string;
  shortcut?: string;
  isOn: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-md",
        "cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring",
        isOn
          ? "text-vsc-accent bg-vsc-accent/10"
          : "text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
      )}
      title={`${isOn ? "Hide" : "Show"} ${label}${shortcut ? ` (${shortcut})` : ""}`}
      aria-label={`Toggle ${label}`}
      aria-pressed={isOn}
    >
      <Icon name={icon} tokenSize="xs" className="min-w-[1em] min-h-[1em]" />
    </button>
  );
});
