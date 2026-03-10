import React from "react";

import { STATUS_COLOR, STATUS_ICON } from "../lib/statusHelpers";
import type { TurnStatus } from "../protocol";
import { Icon } from "./primitives";
import { cn } from "./variants";

interface StatusIconProps {
  status: TurnStatus;
  className?: string;
}

export const StatusIcon = React.memo(function StatusIcon({ status, className }: StatusIconProps) {
  return <Icon name={STATUS_ICON[status]} tokenSize="xs" className={cn(STATUS_COLOR[status], className)} />;
});
