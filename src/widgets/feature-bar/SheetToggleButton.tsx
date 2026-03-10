import React, { useCallback } from "react";

import type { FeatureSheetId } from "../../shared/lib";
import { Button, Icon, Text, Tooltip } from "../../shared/ui";
import { BadgeIndicator, DotIndicator, toolbarBtnClass } from "./ToolbarPrimitives";

export interface FeatureButton {
  readonly id: FeatureSheetId;
  readonly label: string;
  readonly icon: string;
  readonly showDot?: boolean;
  readonly badgeCount?: number;
}

/** Individual sheet toggle button -- avoids inline arrow in .map() */
export const SheetToggleButton = React.memo(function SheetToggleButton({
  btn,
  isActive,
  onToggle,
}: {
  btn: FeatureButton;
  isActive: boolean;
  onToggle: (id: FeatureSheetId) => void;
}) {
  const handleClick = useCallback(() => onToggle(btn.id), [onToggle, btn.id]);
  return (
    <Tooltip content={btn.label}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={toolbarBtnClass(isActive)}
        aria-label={btn.label}
        aria-pressed={isActive}
        data-testid={`feature-btn-${btn.id}`}
      >
        <Icon name={btn.icon} />
        <Text size="xs">{btn.label}</Text>
        {btn.badgeCount != null && btn.badgeCount > 0
          ? <BadgeIndicator count={btn.badgeCount} />
          : <DotIndicator show={btn.showDot ?? false} />}
      </Button>
    </Tooltip>
  );
});
