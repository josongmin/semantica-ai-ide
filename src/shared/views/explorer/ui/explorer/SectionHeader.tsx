import { memo } from "react";

import { Badge, cn, Icon } from "~shared/ui";

export const SectionHeader = memo(function SectionHeader({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center w-full h-[--height-row-md] pl-1.5 pr-3 gap-1",
        "bg-transparent border-none cursor-pointer text-left",
        "text-xs font-semibold text-vsc-text-secondary",
        "hover:bg-vsc-list-hover/50 transition-colors duration-fast focus-ring",
      )}
      aria-expanded={open}
    >
      <Icon
        name="chevron-right"
        tokenSize="2xs"
        className={cn(
          "transition-transform duration-normal text-vsc-text-tertiary shrink-0",
          open && "rotate-90",
        )}
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <Badge text={count} variant="default" className="scale-90 text-vsc-text-tertiary" />
      )}
    </button>
  );
});
