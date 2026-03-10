import React, { useCallback, useState } from "react";

import { Button, cn, Icon, Text } from "../../shared/ui";
import type { DateGroup } from "./helpers";

interface GroupSectionProps {
  readonly label: DateGroup;
  readonly children: React.ReactNode;
}

export const GroupSection = React.memo(function GroupSection({
  label,
  children,
}: GroupSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="mt-1" data-testid={`session-group-${label}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleCollapse}
        className={cn(
          "flex w-full items-center gap-1 px-2 py-0.5 justify-start",
          "text-2xs font-medium uppercase tracking-wide text-vsc-text-ghost",
          "hover:text-vsc-fg transition-colors duration-fast",
        )}
        aria-expanded={!collapsed}
      >
        <Icon
          name="chevron-right"
          tokenSize="2xs"
          className={cn(
            "transition-transform duration-normal",
            !collapsed && "rotate-90",
          )}
        />
        {label === "Pinned" && (
          <Icon name="pin" tokenSize="2xs" className="text-vsc-text-ghost" />
        )}
        <Text as="span" size="2xs">{label}</Text>
      </Button>
      {!collapsed && <div className="mt-0.5">{children}</div>}
    </div>
  );
});
