/**
 * TemplateListPanel — Browse and filter workflow templates
 *
 * Renders grouped template cards with keyboard navigation and search filtering.
 */

import { memo, useCallback, useMemo, useRef, useState } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { WorkflowTemplate } from "../model/workflowTypes";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "./workflowConstants";

// ─── Public Interface ────────────────────────────────────────

export interface TemplateListPanelProps {
  templates: readonly WorkflowTemplate[];
  filterQuery: string;
  onFilterChange: (q: string) => void;
  onSelectTemplate: (t: WorkflowTemplate) => void;
}

export const TemplateListPanel = memo(function TemplateListPanel({
  templates,
  filterQuery,
  onFilterChange,
  onSelectTemplate,
}: TemplateListPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [prevFilteredLen, setPrevFilteredLen] = useState(0);

  const filtered = useMemo(() => {
    if (!filterQuery.trim()) return templates;
    const q = filterQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.includes(q) ||
        t.tags?.some((tag) => tag.includes(q)),
    );
  }, [templates, filterQuery]);

  // Reset focusedIndex when filtered list changes length (state adjustment during render)
  if (prevFilteredLen !== filtered.length) {
    setPrevFilteredLen(filtered.length);
    if (focusedIndex !== 0) {
      setFocusedIndex(0);
    }
  }

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, WorkflowTemplate[]>();
    for (const t of filtered) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [filtered]);

  // Flat list for keyboard nav
  const flatList = useMemo(() => [...filtered], [filtered]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => (i < flatList.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => (i > 0 ? i - 1 : flatList.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const t = flatList[focusedIndex];
        if (t) onSelectTemplate(t);
      }
    },
    [flatList, focusedIndex, onSelectTemplate],
  );

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border/30 shrink-0">
        <Icon name="search" size={13} className="text-vsc-text-ghost shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={filterQuery}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Filter workflows..."
          className="flex-1 bg-transparent text-2xs text-vsc-fg placeholder:text-vsc-text-ghost/60 outline-none"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-3">
        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center text-2xs text-vsc-text-ghost">
            No matching workflows
          </div>
        ) : (
          Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-1.5 px-1 pb-1 text-3xs font-medium text-vsc-text-ghost uppercase tracking-wider">
                <Icon
                  name={CATEGORY_ICONS[category] ?? "extensions"}
                  size={11}
                  className={CATEGORY_COLORS[category] ?? "text-vsc-text-ghost"}
                />
                {category}
              </div>
              <div className="grid grid-cols-1 gap-1">
                {items.map((t) => {
                  const idx = flatList.indexOf(t);
                  return (
                    <WorkflowCard
                      key={t.id}
                      template={t}
                      focused={focusedIndex === idx}
                      onSelect={() => onSelectTemplate(t)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

// ─── Workflow Card (internal) ────────────────────────────────

interface WorkflowCardProps {
  template: WorkflowTemplate;
  focused: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

const WorkflowCard = memo(function WorkflowCard({
  template,
  focused,
  onSelect,
  onMouseEnter,
}: WorkflowCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex items-start gap-2.5 w-full px-2.5 py-2 rounded-md text-left",
        "transition-colors duration-100",
        focused
          ? "bg-vsc-accent/12 ring-1 ring-vsc-accent/30"
          : "hover:bg-vsc-surface-2/60",
      )}
      aria-label={`${template.name}: ${template.description}`}
    >
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-md flex items-center justify-center mt-0.5",
          "bg-vsc-surface-2 border border-vsc-border/40",
        )}
      >
        <Icon
          name={template.icon}
          size={14}
          className={CATEGORY_COLORS[template.category] ?? "text-vsc-text-ghost"}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-2xs font-medium text-vsc-fg truncate">
            {template.name}
          </span>
          {template.params.length > 0 && (
            <span className="shrink-0 text-3xs text-vsc-text-ghost bg-vsc-surface-2 px-1 py-px rounded">
              {template.params.length} param{template.params.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-3xs text-vsc-text-ghost leading-relaxed mt-0.5 line-clamp-2">
          {template.description}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-3xs text-vsc-text-ghost tabular-nums">
            {template.steps.length} step{template.steps.length !== 1 ? "s" : ""}
          </span>
          {template.tags && template.tags.length > 0 && (
            <>
              <span className="text-vsc-text-ghost/40">|</span>
              {template.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-3xs text-vsc-text-ghost/70 bg-vsc-surface-2/80 px-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      <Icon name="chevron-right" size={12} className="shrink-0 text-vsc-text-ghost mt-1.5" />
    </button>
  );
});
