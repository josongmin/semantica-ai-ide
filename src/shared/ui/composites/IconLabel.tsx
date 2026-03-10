import React from "react";

import { Icon } from "../primitives/Icon";
import { Text, type TextProps } from "../primitives/Text";
import { cn } from "../variants";

interface IconLabelProps {
  icon: string;
  text: string;
  iconClassName?: string;
  size?: TextProps["size"];
  tone?: TextProps["tone"];
  weight?: TextProps["weight"];
  className?: string;
}

export const IconLabel = React.memo(function IconLabel({
  icon,
  text,
  iconClassName,
  size = "xs",
  tone = "secondary",
  weight,
  className,
}: IconLabelProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Icon name={icon} className={cn("shrink-0", iconClassName)} />
      <Text size={size} tone={tone} weight={weight}>
        {text}
      </Text>
    </span>
  );
});
