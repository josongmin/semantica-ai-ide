import React from "react";

import { Badge } from "../primitives/Badge";
import { StatusDot, type StatusDotProps } from "../primitives/StatusDot";
import { Text } from "../primitives/Text";
import { cn } from "../variants";

interface StatusLineProps {
  status: StatusDotProps["status"];
  label: string;
  badge?: string | number;
  timestamp?: string;
  className?: string;
}

export const StatusLine = React.memo(function StatusLine({
  status,
  label,
  badge,
  timestamp,
  className,
}: StatusLineProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <StatusDot status={status} />
      <Text size="xs" weight="medium">
        {label}
      </Text>
      {badge !== undefined && <Badge text={badge} />}
      {timestamp && (
        <Text size="2xs" tone="tertiary" mono>
          {timestamp}
        </Text>
      )}
    </span>
  );
});
