import React, { useCallback, useEffect, useRef, useState } from "react";

import { useSessionShare } from "../../features/session-share";
import { writeToClipboard } from "../../shared/lib";
import { Button, cn, Dialog, Icon, Text } from "../../shared/ui";

interface ExpiryOption {
  readonly label: string;
  readonly hours: number | null;
}

const COPY_FEEDBACK_MS = 2000;

const EXPIRY_OPTIONS: readonly ExpiryOption[] = [
  { label: "1 hour", hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
  { label: "Never", hours: null },
];

/**
 * Dialog for generating and managing session share links.
 * Supports expiry selection, secret masking toggle, link copy, and shared content preview.
 */
export const SessionShareDialog = React.memo(function SessionShareDialog() {
  const { shareSession, dialogOpen, closeDialog, currentLink, sessionId } = useSessionShare();

  const [selectedExpiryIdx, setSelectedExpiryIdx] = useState(1); // default: 24h
  const [maskSecrets, setMaskSecrets] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // `generating` is derived at render time: we are generating when a request
  // has been dispatched but the resulting link has not yet arrived.
  const generating = pendingGenerate && !currentLink;

  const handleGenerate = useCallback(() => {
    const expiry = EXPIRY_OPTIONS[selectedExpiryIdx];
    if (expiry === undefined) return;
    setPendingGenerate(true);
    shareSession(sessionId, {
      expires_in_hours: expiry.hours ?? undefined,
      mask_secrets: maskSecrets,
    });
  }, [shareSession, sessionId, selectedExpiryIdx, maskSecrets]);

  const handleCopy = useCallback(async () => {
    if (!currentLink) return;
    await writeToClipboard(currentLink.url);
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, [currentLink]);

  // Clean up the copy-feedback timer on unmount.
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  return (
    <Dialog
      open={dialogOpen}
      onClose={closeDialog}
      title="Share Session"
      description="Generate a read-only share link for this session."
    >
      <div className="flex flex-col gap-3">
        {/* Expiry selector */}
        <div>
          <Text size="xs" weight="medium" tone="secondary" className="mb-1.5">
            Link expiry
          </Text>
          <div className="flex flex-wrap gap-1.5">
            {EXPIRY_OPTIONS.map((option, idx) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setSelectedExpiryIdx(idx)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded border transition-colors duration-fast focus-ring",
                  idx === selectedExpiryIdx
                    ? "bg-vsc-accent text-vsc-fg border-vsc-accent"
                    : "bg-vsc-surface-1 text-vsc-text-secondary border-vsc-border hover:border-vsc-accent/50",
                )}
                data-testid={`expiry-option-${idx}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mask secrets toggle */}
        <label className="flex items-center gap-2 cursor-pointer" data-testid="mask-secrets-toggle">
          <input
            type="checkbox"
            checked={maskSecrets}
            onChange={(e) => setMaskSecrets(e.target.checked)}
            className="accent-vsc-accent"
          />
          <Text size="xs" tone="secondary">
            Mask secrets (.env values, API keys, tokens)
          </Text>
        </label>

        {/* Link display */}
        {currentLink && (
          <div
            className="flex items-center gap-2 p-2 rounded bg-vsc-surface-1 border border-vsc-border"
            data-testid="share-link-display"
          >
            <Icon name="link" tokenSize="sm" className="text-vsc-accent shrink-0" />
            <Text size="xs" className="flex-1 min-w-0 truncate font-mono select-all">
              {currentLink.url}
            </Text>
            <Button variant="ghost" size="sm" onClick={handleCopy} data-testid="copy-link-btn">
              <Icon name={copied ? "check" : "copy"} tokenSize="sm" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}

        {/* Preview section */}
        {currentLink && (
          <div className="text-xs text-vsc-text-tertiary" data-testid="share-preview">
            <Text size="xs" weight="medium" tone="secondary" className="mb-1">
              What will be shared:
            </Text>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Full conversation history (read-only)</li>
              <li>File changes and diffs</li>
              {currentLink.masked && <li>Secrets automatically masked</li>}
              {currentLink.expires_at_ms != null && currentLink.expires_at_ms > 0 && (
                <li>Expires: {new Date(currentLink.expires_at_ms).toLocaleDateString()}</li>
              )}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={closeDialog}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            data-testid="generate-link-btn"
          >
            <Icon name="link" tokenSize="sm" />
            {(() => { if (generating) return "Generating..."; if (currentLink) return "Regenerate Link"; return "Generate Link"; })()}
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
