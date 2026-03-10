import React from "react";

import { STATUS_COLORS, STATUS_ICONS } from "../../shared/lib";
import type { PlanChecklistItem } from "../../shared/protocol";
import { cn, Icon, Spinner, Text } from "../../shared/ui";

interface PlanChecklistItemRowProps {
  item: PlanChecklistItem;
}

export const PlanChecklistItemRow = React.memo(
  function PlanChecklistItemRow({ item }: PlanChecklistItemRowProps) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 py-0.5 px-1 rounded-md text-xs",
          "transition-colors duration-fast",
          item.status === "completed" && "opacity-70",
        )}
        role="listitem"
        aria-label={`${item.label}: ${item.status}`}
      >
        {item.status === "in_progress" ? (
          <Spinner size="sm" className="text-vsc-info shrink-0" />
        ) : (
          <Icon
            name={STATUS_ICONS[item.status]}
            tokenSize="2xs"
            className={cn("shrink-0", STATUS_COLORS[item.status])}
          />
        )}
        <Text
          size="xs"
          tone={item.status === "completed" ? "tertiary" : "primary"}
          className={cn(item.status === "completed" && "line-through")}
        >
          {item.label}
        </Text>
      </div>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.status === next.item.status &&
    prev.item.label === next.item.label,
);
