import { memo } from "react";

import { cn, Icon } from "~shared/ui";

export const TinyButton = memo(function TinyButton({
  icon,
  title,
  onClick,
}: {
  icon: string;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded",
        "bg-transparent border-none cursor-pointer",
        "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-list-hover",
        "transition-colors duration-fast focus-ring",
      )}
      title={title}
      aria-label={title}
    >
      <Icon name={icon} tokenSize="2xs" />
    </button>
  );
});
