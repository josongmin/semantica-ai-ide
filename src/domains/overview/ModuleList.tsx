import React, { useCallback, useState } from "react";

import type { ModuleInfo } from "~features/repo-explain";
import { cn, Icon } from "~shared/ui";

// ─── Types ────────────────────────────────────────────────

interface ModuleListProps {
  modules: ModuleInfo[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────

export const ModuleList = React.memo(function ModuleList({
  modules,
  className,
}: ModuleListProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggle = useCallback(
    (i: number) => setExpandedIdx((prev) => (prev === i ? null : i)),
    [],
  );

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {modules.map((mod, i) => {
        const isOpen = expandedIdx === i;

        return (
          <div
            key={mod.name}
            className="si-stagger-item"
            style={{ "--si-delay": `${i * 40}ms` } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={() => toggle(i)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left",
                "cursor-pointer border-none transition-colors duration-fast focus-ring",
                "hover:bg-vsc-surface-2/50 hover:text-vsc-fg",
                isOpen && "bg-vsc-surface-2/30",
              )}
            >
              <Icon
                name="chevron-right"
                tokenSize="2xs"
                className={cn(
                  "shrink-0 text-vsc-text-ghost transition-transform duration-fast",
                  isOpen && "rotate-90",
                )}
              />
              <span className="flex-1 text-sm text-vsc-fg font-medium truncate">
                {mod.name}
              </span>
              <span className="text-2xs text-vsc-text-ghost tabular-nums">
                {mod.fileCount} files
              </span>
            </button>

            {/* Expanded detail */}
            <div
              className={cn(
                "overflow-hidden transition-[max-height,opacity] duration-fast",
                isOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="pl-8 pr-3 pb-2 flex flex-col gap-1">
                <p className="text-2xs text-vsc-text-secondary leading-relaxed">
                  {mod.description}
                </p>
                <p className="text-2xs text-vsc-text-ghost font-mono">{mod.path}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
