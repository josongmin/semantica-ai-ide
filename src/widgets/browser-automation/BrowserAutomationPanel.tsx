import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { latestScreenshotAtom, sortedBrowserActionsAtom } from "../../features/browser-automation";
import { browserPanelVisibleAtom } from "../../shared/lib/atoms/sidebarPanelAtoms";
import type { BrowserAction } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

// ─── Action Icon Map ─────────────────────────────────────────

const ACTION_ICON_MAP: Record<BrowserAction["type"], string> = {
  click: "target",
  type: "edit",
  navigate: "globe",
  screenshot: "device-camera",
  scroll: "fold",
};

const ACTION_LABEL_MAP: Record<BrowserAction["type"], string> = {
  click: "Click",
  type: "Type",
  navigate: "Navigate",
  screenshot: "Screenshot",
  scroll: "Scroll",
};

// ─── Action Item ─────────────────────────────────────────────

const ActionItem = React.memo(function ActionItem({ action }: { action: BrowserAction }) {
  const iconName = ACTION_ICON_MAP[action.type];
  const label = ACTION_LABEL_MAP[action.type];

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 border-b border-vsc-border last:border-b-0"
      data-testid={`browser-action-${action.id}`}
    >
      <Icon name={iconName} tokenSize="sm" className="text-vsc-text-secondary shrink-0" />
      <div className="flex flex-col min-w-0 flex-1">
        <Text size="xs" weight="medium">
          {label}
          {action.target && (
            <span className="text-vsc-text-tertiary ml-1 font-normal">{action.target}</span>
          )}
        </Text>
        {action.value && (
          <Text size="xs" tone="secondary" className="truncate min-w-0">
            {action.value}
          </Text>
        )}
      </div>
      <Text size="xs" tone="tertiary" className="shrink-0 tabular-nums">
        {formatTimestamp(action.timestamp_ms)}
      </Text>
    </div>
  );
});

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Screenshot Viewer ──────────────────────────────────────

const ScreenshotViewer = React.memo(function ScreenshotViewer({
  url,
  actions,
}: {
  url: string;
  actions: readonly BrowserAction[];
}) {
  // Find actions with click/type indicators to overlay
  const overlayActions = actions.filter((a) => a.type === "click" || a.type === "type");

  return (
    <div
      className="relative border border-vsc-border rounded overflow-hidden"
      data-testid="screenshot-viewer"
    >
      <img
        src={url}
        alt="Browser screenshot"
        className="w-full h-auto object-contain bg-vsc-bg-secondary"
        loading="lazy"
      />
      {overlayActions.length > 0 && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          {overlayActions.slice(-3).map((a) => (
            <span
              key={a.id}
              className={cn(
                "inline-flex items-center gap-1 px-1 py-0.5 rounded text-2xs",
                a.type === "click"
                  ? "bg-vsc-info/20 text-vsc-info"
                  : "bg-vsc-warning/20 text-vsc-warning",
              )}
            >
              <Icon name={ACTION_ICON_MAP[a.type]} tokenSize="2xs" />
              {a.target && <span className="truncate min-w-0 max-w-[60px]">{a.target}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Console Log Panel ──────────────────────────────────────

const ConsoleLogPanel = React.memo(function ConsoleLogPanel({
  actions,
}: {
  actions: readonly BrowserAction[];
}) {
  const navigateActions = actions.filter((a) => a.type === "navigate");

  if (navigateActions.length === 0) return null;

  return (
    <div
      className="border border-vsc-border rounded bg-vsc-bg-secondary"
      data-testid="console-log-panel"
    >
      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-vsc-border">
        <Icon name="terminal" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="xs" weight="medium">
          Navigation Log
        </Text>
      </div>
      <div className="max-h-32 overflow-y-auto">
        {navigateActions.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-1.5 px-2 py-0.5 text-2xs font-mono text-vsc-text-secondary"
          >
            <Icon name="arrow-right" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
            <span className="truncate min-w-0">{a.value ?? a.target ?? "unknown"}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Main Panel ─────────────────────────────────────────────

/**
 * BrowserAutomationPanel - Visualizes browser automation actions.
 *
 * Shows screenshot viewer with action overlays, navigation console,
 * and action timeline.
 */
export const BrowserAutomationPanel = React.memo(function BrowserAutomationPanel() {
  const actions = useAtomValue(sortedBrowserActionsAtom);
  const latestScreenshot = useAtomValue(latestScreenshotAtom);
  const panelVisible = useAtomValue(browserPanelVisibleAtom);

  const [collapsed, setCollapsed] = React.useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  if (actions.length === 0 || !panelVisible) return null;

  return (
    <div
      className="flex flex-col gap-2 p-2 border border-vsc-border rounded bg-vsc-bg"
      data-testid="browser-automation-panel"
      role="region"
      aria-label="Browser automation"
    >
      {/* Header */}
      <button
        className="flex items-center gap-1.5 w-full text-left focus-ring"
        onClick={toggleCollapse}
        aria-expanded={!collapsed}
        data-testid="browser-automation-header"
      >
        <Icon
          name={collapsed ? "chevron-right" : "chevron-down"}
          tokenSize="sm"
          className="text-vsc-text-secondary"
        />
        <Icon name="globe" tokenSize="sm" className="text-vsc-text-primary" />
        <Text size="xs" weight="medium" className="flex-1">
          Browser Automation
        </Text>
        <Text size="xs" tone="tertiary">
          {actions.length} action{actions.length !== 1 ? "s" : ""}
        </Text>
      </button>

      {!collapsed && (
        <>
          {/* Screenshot */}
          {latestScreenshot && <ScreenshotViewer url={latestScreenshot} actions={actions} />}

          {/* Console */}
          <ConsoleLogPanel actions={actions} />

          {/* Action Timeline */}
          <div className="flex flex-col" data-testid="action-timeline">
            {actions.map((action) => (
              <ActionItem key={action.id} action={action} />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
