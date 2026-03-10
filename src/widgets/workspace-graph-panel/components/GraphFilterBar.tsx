import React, { useCallback, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { graphFilterAtom } from "../../../entities/workspace-graph";
import type { GraphNodeKind } from "../../../shared/protocol";
import { cn, Icon } from "../../../shared/ui";
import { KIND_CONFIG } from "./kindConfig";

// ─── Filter Bar (minimal) ─────────────────────────────────────

export const GraphFilterBar = React.memo(function GraphFilterBar() {
  const filter = useAtomValue(graphFilterAtom);
  const setFilter = useSetAtom(graphFilterAtom);
  const [expanded, setExpanded] = useState(false);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilter((prev) => ({ ...prev, query: e.target.value }));
    },
    [setFilter],
  );

  const toggleKind = useCallback(
    (kind: GraphNodeKind) => {
      setFilter((prev) => {
        const kinds = prev.kinds.includes(kind)
          ? prev.kinds.filter((k) => k !== kind)
          : [...prev.kinds, kind];
        return { ...prev, kinds };
      });
    },
    [setFilter],
  );

  const activeCount = filter.kinds.length;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Icon
          name="search"
          tokenSize="xs"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-vsc-text-ghost pointer-events-none"
        />
        <input
          type="text"
          value={filter.query}
          onChange={handleSearch}
          placeholder="Search symbols..."
          aria-label="Search symbols"
          className="w-full h-7 pl-7 pr-2 rounded-md border border-vsc-border bg-vsc-bg
                     text-xs text-vsc-text-primary placeholder:text-vsc-text-ghost
                     focus-ring"
        />
      </div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex items-center gap-1 text-2xs text-vsc-text-ghost hover:text-vsc-text-secondary transition-colors duration-fast focus-ring"
      >
        {activeCount > 0 ? (
          <>
            <span>Filter: {filter.kinds.map((k) => KIND_CONFIG[k].label).join(", ")}</span>
            <Icon name="chevron-down" tokenSize="xs" className={cn("transition-transform duration-fast", expanded && "rotate-180")} />
          </>
        ) : (
          <>
            <span>Filter by type</span>
            <Icon name="chevron-down" tokenSize="xs" className={cn("transition-transform duration-fast", expanded && "rotate-180")} />
          </>
        )}
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {(Object.entries(KIND_CONFIG) as [GraphNodeKind, (typeof KIND_CONFIG)[GraphNodeKind]][]).map(
            ([kind, cfg]) => (
              <button
                key={kind}
                type="button"
                onClick={() => toggleKind(kind)}
                className={cn(
                  "h-5 px-1.5 rounded text-2xs transition-colors duration-fast cursor-pointer focus-ring",
                  filter.kinds.includes(kind)
                    ? "bg-vsc-info/20 text-vsc-info"
                    : "bg-vsc-surface-2/60 text-vsc-text-ghost hover:text-vsc-text-secondary transition-colors duration-fast",
                )}
              >
                {cfg.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
});
