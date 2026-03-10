import React, { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";

import { previewStateAtom } from "../../features/live-preview";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import type { PreviewStatus } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";

/** Only allow http/https URLs pointing to localhost dev servers. */
function isSafePreviewUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    /* Invalid URL string — treat as unsafe */
    return false;
  }
}

// ─── Status helpers ──────────────────────────────────────────

interface StatusConfig {
  readonly label: string;
  readonly icon: string;
  readonly colorClass: string;
  readonly pulse: boolean;
}

const STATUS_CONFIGS: Record<PreviewStatus, StatusConfig> = {
  disconnected: {
    label: "Disconnected",
    icon: "debug-disconnect",
    colorClass: "text-vsc-text-tertiary",
    pulse: false,
  },
  connected: {
    label: "Connected",
    icon: "pass",
    colorClass: "text-vsc-success",
    pulse: false,
  },
  updating: {
    label: "Updating...",
    icon: "sync",
    colorClass: "text-vsc-warning",
    pulse: true,
  },
  error: {
    label: "Error",
    icon: "error",
    colorClass: "text-vsc-error",
    pulse: false,
  },
};

// ─── HMR Status Indicator ────────────────────────────────────

interface HmrStatusProps {
  status: PreviewStatus;
}

const HmrStatus = React.memo(function HmrStatus({ status }: HmrStatusProps) {
  const config = STATUS_CONFIGS[status];

  return (
    <div
      className="flex items-center gap-1.5"
      data-testid="hmr-status"
      role="status"
      aria-label={`HMR status: ${config.label}`}
    >
      <Icon
        name={config.icon}
        tokenSize="xs"
        className={cn(config.colorClass, config.pulse && "animate-[spin_1s_linear_infinite]")}
      />
      <Text size="2xs" tone="secondary">
        {config.label}
      </Text>
    </div>
  );
});

// ─── LivePreviewPanel ────────────────────────────────────────

/**
 * AS-06: Live Preview panel with HMR status.
 * Embeds an iframe for the preview, URL bar, HMR status indicator,
 * and refresh/open-in-browser buttons.
 */
export const LivePreviewPanel = React.memo(function LivePreviewPanel() {
  const state = useAtomValue(previewStateAtom);
  const safeUrl = useMemo(() => (isSafePreviewUrl(state.url) ? state.url : null), [state.url]);
  const hasUrl = safeUrl !== null;

  const handleRefresh = useCallback(() => {
    getVscodeApi().postMessage({ type: "REFRESH_PREVIEW" });
  }, []);

  const handleOpenExternal = useCallback(() => {
    if (safeUrl) {
      getVscodeApi().postMessage({ type: "OPEN_PREVIEW_EXTERNAL", url: safeUrl });
    }
  }, [safeUrl]);

  return (
    <div
      className="flex flex-col h-full min-h-0"
      data-testid="live-preview-panel"
      role="region"
      aria-label="Live preview"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-vsc-panel-border bg-vsc-bg shrink-0">
        {/* URL bar */}
        <div
          className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded border border-vsc-panel-border bg-vsc-input-bg text-xs min-w-0"
          data-testid="preview-url-bar"
        >
          <Icon name="globe" tokenSize="xs" className="text-vsc-text-tertiary shrink-0" />
          <span className="truncate min-w-0 text-vsc-text-secondary">
            {(() => { if (hasUrl) return safeUrl; if (state.url) return "Blocked: non-localhost URL"; return "No preview URL"; })()}
          </span>
        </div>

        {/* HMR status */}
        <HmrStatus status={state.status} />

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            title="Refresh preview"
            data-testid="preview-refresh-btn"
          >
            <Icon name="refresh" tokenSize="xs" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            disabled={!hasUrl}
            title="Open in browser"
            data-testid="preview-open-external-btn"
          >
            <Icon name="link-external" tokenSize="xs" />
          </Button>
        </div>
      </div>

      {/* Preview iframe container */}
      <div className="flex-1 min-h-0 relative bg-vsc-bg">
        {hasUrl ? (
          <iframe
            src={safeUrl}
            className="w-full h-full border-none"
            title="Live preview"
            sandbox="allow-scripts allow-forms"
            data-testid="preview-iframe"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-vsc-bg">
            <div className="text-center">
              <Icon name="browser" tokenSize="lg" className="mb-2 text-vsc-text-tertiary opacity-40" />
              <Text size="sm" tone="tertiary" as="div">
                No preview available
              </Text>
              <Text size="2xs" tone="tertiary" as="div" className="mt-1">
                Start a dev server to see a live preview
              </Text>
            </div>
          </div>
        )}

        {/* Updating overlay */}
        {state.status === "updating" && (
          <div
            className="absolute inset-0 bg-vsc-bg/30 flex items-center justify-center pointer-events-none"
            data-testid="preview-updating-overlay"
          >
            <div className="flex items-center gap-2 bg-vsc-bg border border-vsc-panel-border rounded px-3 py-2 shadow-lg">
              <Icon
                name="sync"
                tokenSize="xs"
                className="text-vsc-warning animate-[spin_1s_linear_infinite]"
              />
              <Text size="xs" tone="secondary">
                Updating...
              </Text>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {state.status === "error" && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-vsc-error/10 border-t border-vsc-error/30 px-3 py-2"
            data-testid="preview-error-overlay"
          >
            <div className="flex items-center gap-1.5">
              <Icon name="error" tokenSize="xs" className="text-vsc-error" />
              <Text size="xs" tone="error">
                Preview error. Try refreshing.
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Last update timestamp */}
      {state.last_update_ms != null && state.last_update_ms > 0 && (
        <div className="flex items-center gap-1 px-3 py-1 border-t border-vsc-panel-border text-2xs text-vsc-text-tertiary shrink-0">
          <Icon name="history" tokenSize="2xs" />
          <span>Last update: {new Date(state.last_update_ms).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
});
