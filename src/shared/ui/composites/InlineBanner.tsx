import React from "react";

import { Icon } from "../primitives/Icon";
import { statusColor } from "../tokens";
import { cn } from "../variants";

const VARIANT_STYLES: Record<string, { container: string }> = {
  error: { container: `bg-vsc-error/5 ${statusColor.error}` },
  warning: { container: `bg-vsc-warning/5 ${statusColor.warning}` },
  info: { container: `bg-vsc-info/5 ${statusColor.info}` },
  success: { container: `bg-vsc-success/5 ${statusColor.success}` },
};

const BORDER_STYLES: Record<string, string> = {
  error: "border border-vsc-error/30",
  warning: "border border-vsc-warning/30",
  info: "border border-vsc-info/30",
  success: "border border-vsc-success/30",
};

const iconMap = {
  error: "error",
  warning: "warning",
  info: "info",
  success: "pass-filled",
} as const;

interface InlineBannerProps {
  variant: "error" | "warning" | "info" | "success";
  icon?: string;
  /** Optional action buttons rendered on the right side */
  actions?: React.ReactNode;
  /** Add a visible border matching the variant color */
  bordered?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const InlineBanner = React.memo(function InlineBanner({
  variant,
  icon,
  actions,
  bordered,
  children,
  className,
}: InlineBannerProps) {
  const styles = VARIANT_STYLES[variant] ?? { container: "" };

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "flex overflow-hidden rounded-lg text-xs animate-[slide-down-in_200ms_ease]",
        styles.container,
        bordered && BORDER_STYLES[variant],
        className,
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 min-w-0 flex-1">
        <Icon name={icon ?? iconMap[variant]} className="shrink-0 mt-px" tokenSize="sm" />
        <div className="min-w-0 flex-1">{children}</div>
        {Boolean(actions) && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      </div>
    </div>
  );
});
