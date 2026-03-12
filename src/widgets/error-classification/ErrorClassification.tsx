import React from "react";

import type { ClassifiedError, ErrorCategory } from "../../shared/protocol";
import { cn, Icon } from "../../shared/ui";

interface ErrorClassificationProps {
  readonly error: ClassifiedError;
  readonly onRetry?: () => void;
}

type ErrorTone = "error" | "warning";

const TONE_CLASSES: Readonly<
  Record<
    ErrorTone,
    {
      border: string;
      bg: string;
      iconBg: string;
      icon: string;
      label: string;
      message: string;
      btnBase: string;
      btnHover: string;
      retryText: string;
      codeBg: string;
      codeFg: string;
    }
  >
> = {
  error: {
    border: "border-vsc-error/20",
    bg: "bg-vsc-error/[0.03]",
    iconBg: "bg-vsc-error/10",
    icon: "text-vsc-error",
    label: "text-vsc-error",
    message: "text-vsc-fg/85",
    btnBase: "bg-vsc-error/10 text-vsc-error border border-vsc-error/20",
    btnHover: "hover:bg-vsc-error/18 active:bg-vsc-error/25 transition-colors duration-fast",
    retryText: "text-vsc-text-tertiary",
    codeBg: "bg-vsc-error/8",
    codeFg: "text-vsc-error/80",
  },
  warning: {
    border: "border-vsc-warning/20",
    bg: "bg-vsc-warning/[0.03]",
    iconBg: "bg-vsc-warning/10",
    icon: "text-vsc-warning",
    label: "text-vsc-warning",
    message: "text-vsc-fg/85",
    btnBase: "bg-vsc-warning/10 text-vsc-warning border border-vsc-warning/20",
    btnHover: "hover:bg-vsc-warning/18 active:bg-vsc-warning/25 transition-colors duration-fast",
    retryText: "text-vsc-text-tertiary",
    codeBg: "bg-vsc-warning/8",
    codeFg: "text-vsc-warning/80",
  },
};

const CATEGORY_CONFIG: Record<ErrorCategory, { icon: string; tone: ErrorTone; label: string }> = {
  network: { icon: "globe", tone: "error", label: "Network Error" },
  model: { icon: "sparkle", tone: "warning", label: "Model Error" },
  tool: { icon: "tools", tone: "warning", label: "Tool Error" },
  permission: { icon: "lock", tone: "error", label: "Permission Denied" },
  rate_limit: { icon: "watch", tone: "warning", label: "Rate Limited" },
  context_overflow: { icon: "arrow-both", tone: "warning", label: "Context Overflow" },
  unknown: { icon: "warning", tone: "error", label: "Error" },
};

function getRetryLabel(
  strategy: NonNullable<ClassifiedError["retry_strategy"]>,
  retryAfterMs?: number,
): string {
  switch (strategy) {
    case "auto_retry":
      return "Retrying automatically…";
    case "retry_with_backoff":
      return retryAfterMs != null && retryAfterMs > 0
        ? `Retry in ${Math.ceil(retryAfterMs / 1000)}s`
        : "Retry with backoff";
    case "retry_after_fix":
      return "Fix the issue, then retry";
    case "non_retryable":
      return "Cannot be retried";
  }
}

export const ErrorClassification = React.memo(function ErrorClassification({
  error,
  onRetry,
}: ErrorClassificationProps) {
  const config = CATEGORY_CONFIG[error.category];
  const tone = TONE_CLASSES[config.tone];
  const canRetry = error.retry_strategy && error.retry_strategy !== "non_retryable";

  return (
    <div
      className={cn("rounded-lg border overflow-hidden", tone.border, tone.bg)}
      role="alert"
      data-testid="error-classification"
    >
      <div className="px-2.5 py-1.5">
        {/* Header: icon + label + error code */}
        <div className="flex items-center gap-1.5">
          <Icon name={config.icon} tokenSize="xs" className={tone.icon} />
          <span
            className={cn("text-2xs font-semibold tracking-wide", tone.label)}
            data-testid="error-label"
          >
            {config.label}
          </span>
          {error.code && (
            <span
              className={cn(
                "text-2xs px-1 rounded font-mono tabular-nums",
                tone.codeBg,
                tone.codeFg,
              )}
              data-testid="error-code"
            >
              {error.code}
            </span>
          )}
        </div>

        {/* Error message */}
        <p className={cn("text-xs mt-1 leading-snug", tone.message)} data-testid="error-message">
          {error.message}
        </p>

        {/* Retry row — compact inline */}
        {error.retry_strategy && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={cn("text-2xs", tone.retryText)} data-testid="retry-label">
              {getRetryLabel(error.retry_strategy, error.retry_after_ms)}
            </span>
            {canRetry && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  "inline-flex items-center gap-0.5 text-2xs font-medium",
                  "px-1.5 py-0.5 rounded transition-colors duration-fast cursor-pointer focus-ring",
                  tone.btnBase,
                  tone.btnHover,
                )}
                data-testid="retry-button"
                aria-label="Retry"
              >
                <Icon name="refresh" tokenSize="xs" />
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
