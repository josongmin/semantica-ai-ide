import React, { useCallback, useRef, useState } from "react";
import { useAtomValue } from "jotai";

import { privacyStateAtom } from "../../features/privacy-mode";
import type { PrivacyMode } from "../../shared/protocol";
import { cn, Icon, Popover, Text, Tooltip } from "../../shared/ui";

// ─── Privacy mode styling ────────────────────────────────────
const MODE_COLORS: Record<PrivacyMode, { icon: string; label: string }> = {
  local: {
    icon: "text-vsc-success",
    label: "Local only - code stays on your machine",
  },
  shared: {
    icon: "text-vsc-warning",
    label: "Data shared with model provider",
  },
  stored: {
    icon: "text-vsc-error",
    label: "Data may be stored externally",
  },
};

const MODE_LABELS: Record<PrivacyMode, string> = {
  local: "Local Only",
  shared: "Shared",
  stored: "Stored",
};

/**
 * PrivacyIndicator: Lock icon in the header bar showing current privacy status.
 * Green = local only, Yellow = shared with model, Red = data stored.
 * Click to see popover with privacy policy details.
 */
export const PrivacyIndicator = React.memo(function PrivacyIndicator() {
  const state = useAtomValue(privacyStateAtom);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    setPopoverOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setPopoverOpen(false);
  }, []);

  if (!state) return null;

  const {mode} = state;
  const colors = MODE_COLORS[mode];

  return (
    <>
      <Tooltip content={colors.label}>
        <button
          ref={anchorRef}
          type="button"
          onClick={handleToggle}
          aria-label={`Privacy: ${MODE_LABELS[mode]}`}
          className={cn(
            "flex items-center justify-center min-w-6 min-h-6 px-1.5 py-1 rounded-md",
            "hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring",
          )}
          data-testid="privacy-indicator-button"
        >
          <Icon name="lock" tokenSize="sm" className={colors.icon} />
        </button>
      </Tooltip>

      <Popover
        open={popoverOpen}
        onClose={handleClose}
        anchorRef={anchorRef}
        placement="bottom"
        align="end"
      >
        <div
          className="flex flex-col gap-2 min-w-[200px] max-w-[300px]"
          data-testid="privacy-indicator-popover"
        >
          {/* Header with mode badge */}
          <div className="flex items-center gap-2">
            <Icon name="lock" tokenSize="sm" className={colors.icon} />
            <Text size="sm" weight="medium">
              {MODE_LABELS[mode]}
            </Text>
          </div>

          {/* Description */}
          <Text size="xs" tone="secondary">
            {state.details}
          </Text>

          {/* Policy link */}
          {state.policy_url && (
            <a
              href={state.policy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-vsc-link hover:underline"
              data-testid="privacy-policy-link"
            >
              <Icon name="link-external" tokenSize="2xs" />
              <Text size="2xs">View Privacy Policy</Text>
            </a>
          )}

          {/* Mode indicator bar */}
          <div className="flex items-center gap-1 pt-1 border-t border-vsc-border">
            {(["local", "shared", "stored"] as PrivacyMode[]).map((m) => (
              <div
                key={m}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors duration-fast",
                  m !== mode && "bg-vsc-border",
                  m === mode && m === "local" && "bg-vsc-success",
                  m === mode && m === "shared" && "bg-vsc-warning",
                  m === mode && m === "stored" && "bg-vsc-error",
                )}
                aria-label={`${MODE_LABELS[m]}${m === mode ? " (active)" : ""}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Text size="2xs" tone="ghost">
              Local
            </Text>
            <Text size="2xs" tone="ghost">
              Stored
            </Text>
          </div>
        </div>
      </Popover>
    </>
  );
});
