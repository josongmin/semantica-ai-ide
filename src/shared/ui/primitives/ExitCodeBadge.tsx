/**
 * ExitCodeBadge — Displays a command exit code with color semantics.
 *
 * - 0: green (success)
 * - non-zero: red (error) with code displayed
 * - undefined/null: neutral (running or unknown)
 */

import { memo } from "react";

import { cn } from "../variants";

export interface ExitCodeBadgeProps {
  exitCode: number | undefined | null;
  className?: string;
}

export const ExitCodeBadge = memo(function ExitCodeBadge({
  exitCode,
  className,
}: ExitCodeBadgeProps) {
  if (exitCode === null || exitCode === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-sm px-1.5 py-0.5 text-3xs font-mono",
          "bg-vsc-text-tertiary/10 text-vsc-text-tertiary",
          className,
        )}
      >
        ...
      </span>
    );
  }

  const isSuccess = exitCode === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-3xs font-mono font-medium",
        isSuccess ? "bg-vsc-success/15 text-vsc-success" : "bg-vsc-error/15 text-vsc-error",
        className,
      )}
    >
      {isSuccess ? "0" : exitCode}
    </span>
  );
});
