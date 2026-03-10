/**
 * TerminalBlockAttachPreview — RFC-TERMINAL-016 §2.4
 *
 * Compact preview of a terminal block for embedding in the agent chat.
 * Shows command, status, diagnostic count, and a small output preview.
 */

import { memo } from "react";

import { DurationLabel } from "~shared/ui/primitives/DurationLabel";
import { ExitCodeBadge } from "~shared/ui/primitives/ExitCodeBadge";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { TerminalBlockAttachment } from "../model/intentTypes";

// ─── Types ───────────────────────────────────────────────

export interface TerminalBlockAttachPreviewProps {
  attachment: TerminalBlockAttachment;
  onReveal?: () => void;
  className?: string;
}

// ─── Component ───────────────────────────────────────────

export const TerminalBlockAttachPreview = memo(function TerminalBlockAttachPreview({
  attachment,
  onReveal,
  className,
}: TerminalBlockAttachPreviewProps) {
  const isFailed = attachment.status === "failed";
  const errCount = attachment.diagnostics.length;
  const testFailCount = attachment.testResults.filter((t) => t.status === "fail").length;

  return (
    <div
      className={cn(
        "rounded-md overflow-hidden",
        "border",
        isFailed ? "border-vsc-error/30" : "border-vsc-border/30",
        "bg-vsc-code-bg/60",
        className,
      )}
      data-testid="terminal-block-attach-preview"
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5",
          "bg-vsc-surface-1/80",
          "border-b border-vsc-border/20",
        )}
      >
        <Icon
          name="terminal"
          size={12}
          className="text-vsc-text-ghost shrink-0"
        />
        <span className="flex-1 min-w-0 truncate font-mono text-2xs text-vsc-text-primary">
          <span className="text-vsc-accent/50 mr-1">$</span>
          {attachment.command}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <ExitCodeBadge exitCode={attachment.exitCode} />
          <DurationLabel durationMs={attachment.duration} />
        </div>
      </div>

      {/* Summary row */}
      {(errCount > 0 || testFailCount > 0 || attachment.summary) && (
        <div className="flex items-center gap-2 px-2.5 py-1 text-3xs font-mono text-vsc-text-ghost">
          {errCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-vsc-error">
              <Icon name="error" size={10} />
              {errCount} error{errCount !== 1 ? "s" : ""}
            </span>
          )}
          {testFailCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-vsc-error">
              <Icon name="close" size={10} />
              {testFailCount} failed
            </span>
          )}
          {attachment.summary?.text && errCount === 0 && testFailCount === 0 && (
            <span className="text-vsc-text-secondary">{attachment.summary.text}</span>
          )}
        </div>
      )}

      {/* Diagnostics preview (max 3) */}
      {errCount > 0 && (
        <div className="px-2.5 py-1 border-t border-vsc-border/10">
          {attachment.diagnostics.slice(0, 3).map((d, i) => (
            <div
              key={`${d.file}:${d.line}:${i}`}
              className="flex items-center gap-1 text-3xs font-mono text-vsc-text-secondary truncate"
            >
              <Icon
                name={d.severity === "error" ? "error" : "warning"}
                size={10}
                className={d.severity === "error" ? "text-vsc-error" : "text-vsc-warning"}
              />
              <span className="text-vsc-accent/70">{d.file}:{d.line}</span>
              <span className="truncate opacity-70">{d.message}</span>
            </div>
          ))}
          {errCount > 3 && (
            <div className="text-3xs text-vsc-text-ghost mt-0.5">
              +{errCount - 3} more
            </div>
          )}
        </div>
      )}

      {/* Reveal button */}
      {onReveal && (
        <button
          type="button"
          className={cn(
            "w-full flex items-center justify-center gap-1 px-2 py-1",
            "border-t border-vsc-border/15",
            "text-3xs text-vsc-text-ghost",
            "hover:text-vsc-accent hover:bg-vsc-accent/5",
            "transition-colors duration-fast",
          )}
          onClick={onReveal}
        >
          <Icon name="go-to-file" size={10} />
          <span>Reveal in terminal</span>
        </button>
      )}
    </div>
  );
});
