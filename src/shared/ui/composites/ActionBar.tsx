import React from "react";

import { Button } from "../primitives/Button";
import { cn } from "../variants";

interface Action {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ActionBarProps {
  actions: Action[];
  /** 'always' shows all the time, 'hover' shows only on parent hover */
  visible?: "always" | "hover";
  className?: string;
}

export const ActionBar = React.memo(function ActionBar({
  actions,
  visible = "hover",
  className,
}: ActionBarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1",
        visible === "hover" &&
          "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-fast",
        className,
      )}
    >
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="ghost"
          size="icon"
          icon={action.icon}
          aria-label={action.label}
          title={action.label}
          onClick={action.onClick}
          disabled={action.disabled}
        />
      ))}
    </div>
  );
});
