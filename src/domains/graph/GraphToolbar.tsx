import React from "react";
import { useAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import {
  type GraphFilter,
  graphFilterAtom,
  type GraphLayout,
  graphLayoutAtom,
  graphSearchAtom,
  graphZoomAtom,
} from "./graphAtoms";

const LAYOUTS: { id: GraphLayout; label: string }[] = [
  { id: "force", label: "Force" },
  { id: "hierarchy", label: "Hierarchy" },
  { id: "radial", label: "Radial" },
  { id: "grid", label: "Grid" },
];

const FILTERS: { id: GraphFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "functions", label: "Functions" },
  { id: "classes", label: "Classes" },
  { id: "modules", label: "Modules" },
  { id: "services", label: "Services" },
];

const iconBtnClass = cn(
  "inline-flex items-center justify-center w-6 h-6 rounded-sm",
  "cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring",
  "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-list-hover",
);

const selectClass = cn(
  "text-xs bg-vsc-input-bg text-vsc-fg border border-vsc-border",
  "rounded-sm px-1.5 py-0.5 cursor-pointer focus-ring",
);

export const GraphToolbar = React.memo(function GraphToolbar() {
  const [layout, setLayout] = useAtom(graphLayoutAtom);
  const [filter, setFilter] = useAtom(graphFilterAtom);
  const [search, setSearch] = useAtom(graphSearchAtom);
  const [zoom, setZoom] = useAtom(graphZoomAtom);

  return (
    <div className="flex items-center gap-3 px-4 h-9 border-b border-vsc-border bg-vsc-surface-1 shrink-0 flex-wrap">
      {/* Layout Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-2xs text-vsc-text-tertiary uppercase tracking-wider font-medium">Layout</span>
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value as GraphLayout)}
          className={selectClass}
        >
          {LAYOUTS.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Filter Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-2xs text-vsc-text-tertiary uppercase tracking-wider font-medium">Filter</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as GraphFilter)}
          className={selectClass}
        >
          {FILTERS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 flex-1 min-w-[120px] max-w-[240px]">
        <Icon name="search" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes…"
          className={cn(
            "flex-1 text-xs bg-vsc-input-bg text-vsc-fg border border-vsc-border",
            "rounded-sm px-2 py-0.5 placeholder:text-vsc-text-ghost focus-ring",
          )}
        />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 ml-auto">
        <button type="button" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className={iconBtnClass} title="Zoom out" aria-label="Zoom out">
          <Icon name="zoom-out" tokenSize="sm" />
        </button>
        <span className="text-2xs text-vsc-text-tertiary tabular-nums w-8 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" onClick={() => setZoom(Math.min(5, zoom + 0.1))} className={iconBtnClass} title="Zoom in" aria-label="Zoom in">
          <Icon name="zoom-in" tokenSize="sm" />
        </button>
        <button type="button" onClick={() => setZoom(1)} className={iconBtnClass} title="Fit to view" aria-label="Fit to view">
          <Icon name="screen-full" tokenSize="sm" />
        </button>
      </div>
    </div>
  );
});
