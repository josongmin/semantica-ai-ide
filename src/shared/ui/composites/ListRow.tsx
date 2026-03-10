import React from "react";

import { cn } from "../variants";

interface ListRowProps {
  left?: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ListRow = React.memo(function ListRow({
  left,
  children,
  right,
  onClick,
  className,
}: ListRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 py-1 px-1 rounded-md text-xs",
        "hover:bg-vsc-list-hover transition-colors duration-fast",
        onClick && "cursor-pointer active:scale-[0.99] focus-ring",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {left !== undefined && left !== null && <span className="inline-flex items-center gap-1 shrink-0">{left}</span>}
      <span className="min-w-0 flex-1 flex items-center gap-1">{children}</span>
      {right !== undefined && right !== null && <span className="inline-flex items-center gap-1 shrink-0 ml-auto">{right}</span>}
    </div>
  );
});
