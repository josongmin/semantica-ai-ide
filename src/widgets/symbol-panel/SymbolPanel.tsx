import React, { useMemo } from "react";
import { useAtomValue } from "jotai";

import { symbolMentionsAtom } from "../../entities/semantic-index";
import { symbolPanelVisibleAtom } from "../../shared/lib";
import type { SymbolKind, SymbolMention } from "../../shared/protocol";
import { Badge, Collapsible, Icon, Text } from "../../shared/ui";
import { SymbolRow } from "./SymbolRow";

// ─── Constants ───────────────────────────────────────────

const KIND_ORDER: readonly SymbolKind[] = ["class", "function", "type", "variable", "file"];

const KIND_LABELS: Readonly<Record<SymbolKind, string>> = {
  function: "Functions",
  class: "Classes",
  variable: "Variables",
  type: "Types",
  file: "Files",
};

const KIND_ICONS: Readonly<Record<SymbolKind, string>> = {
  function: "symbol-method",
  class: "symbol-class",
  variable: "symbol-variable",
  type: "symbol-interface",
  file: "file",
};

// ─── Types ───────────────────────────────────────────────

interface SymbolGroup {
  readonly kind: SymbolKind;
  readonly symbols: readonly SymbolMention[];
  readonly count: number;
}

// ─── Component ───────────────────────────────────────────

/**
 * SymbolPanel: Shows symbols mentioned/modified in the current session,
 * auto-grouped by kind (function, class, variable, type, file).
 * Each group is collapsible with a count badge.
 */
export const SymbolPanel = React.memo(function SymbolPanel() {
  const visible = useAtomValue(symbolPanelVisibleAtom);
  const symbols = useAtomValue(symbolMentionsAtom);

  const groups = useMemo<readonly SymbolGroup[]>(() => {
    const grouped = new Map<SymbolKind, SymbolMention[]>();

    // Deduplicate: use name+kind+file_path as key
    const seen = new Set<string>();
    for (const sym of symbols) {
      const key = `${sym.kind}::${sym.name}::${sym.file_path}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const list = grouped.get(sym.kind) ?? [];
      list.push(sym);
      grouped.set(sym.kind, list);
    }

    const result: SymbolGroup[] = [];
    for (const kind of KIND_ORDER) {
      const list = grouped.get(kind);
      if (list && list.length > 0) {
        list.sort((a, b) => a.name.localeCompare(b.name));
        result.push({ kind, symbols: list, count: list.length });
      }
    }
    return result;
  }, [symbols]);

  const totalCount = useMemo(() => groups.reduce((sum, g) => sum + g.count, 0), [groups]);

  if (!visible) return null;

  return (
    <div
      className="border-t border-vsc-border bg-vsc-surface-1 overflow-hidden max-h-[--panel-max-h-md]"
      role="region"
      aria-label="Symbol panel"
      data-testid="symbol-panel"
    >
      {/* Header */}
      <div className="px-3 py-1 text-2xs font-medium text-vsc-text-tertiary tracking-wide border-b border-vsc-border sticky top-0 bg-vsc-surface-1 z-[--z-sticky] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Icon name="symbol-class" tokenSize="2xs" />
          Symbols
        </span>
        {totalCount > 0 && <Badge text={totalCount} variant="default" />}
      </div>

      {groups.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <Text size="xs" tone="tertiary">
            No symbols referenced yet
          </Text>
        </div>
      ) : (
        <div className="overflow-y-auto scroll-shadow max-h-[--panel-max-h-md]">
          {groups.map((group) => (
            <Collapsible
              key={group.kind}
              title={KIND_LABELS[group.kind]}
              icon={KIND_ICONS[group.kind]}
              badge={group.count}
              defaultCollapsed={false}
            >
              <div role="list">
                {group.symbols.map((sym) => (
                  <SymbolRow key={`${sym.name}-${sym.file_path}-${sym.line ?? 0}`} symbol={sym} />
                ))}
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
});
