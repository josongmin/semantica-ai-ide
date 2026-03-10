import React, { memo, useCallback, useMemo, useState } from "react";

import { getVscodeApi } from "~shared/lib/vscodeApi";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

/** The file whose symbols are displayed (in a real implementation, driven by active editor) */
const ACTIVE_FILE = "src/core/engine/SemanticParser.ts";

// ─── Types ──────────────────────────────────────────────

type SymbolKind = "function" | "class" | "interface" | "variable" | "type";

interface SymbolEntry {
  readonly name: string;
  readonly kind: SymbolKind;
  readonly line: number;
  readonly detail?: string;
}

// ─── Symbol Kind Config ─────────────────────────────────

const SYMBOL_KIND_CONFIG: Record<SymbolKind, { icon: string; label: string; color: string }> = {
  function: { icon: "symbol-method", label: "Functions", color: "text-vsc-accent" },
  class: { icon: "symbol-class", label: "Classes", color: "text-vsc-warning" },
  interface: { icon: "symbol-interface", label: "Interfaces", color: "text-vsc-info" },
  variable: { icon: "symbol-variable", label: "Variables", color: "text-vsc-info" },
  type: { icon: "symbol-key", label: "Types", color: "text-vsc-success" },
};

const KIND_ORDER: SymbolKind[] = ["class", "interface", "type", "function", "variable"];

// ─── Mock Data ──────────────────────────────────────────

const MOCK_SYMBOLS: SymbolEntry[] = [
  { name: "SemanticEngine", kind: "class", line: 12, detail: "extends BaseEngine" },
  { name: "GraphResolver", kind: "class", line: 88, detail: "implements IResolver" },
  { name: "INodeVisitor", kind: "interface", line: 4 },
  { name: "ITransformResult", kind: "interface", line: 28 },
  { name: "ISemanticContext", kind: "interface", line: 45 },
  { name: "NodeKind", kind: "type", line: 8 },
  { name: "TransformOptions", kind: "type", line: 34 },
  { name: "ResolverConfig", kind: "type", line: 62 },
  { name: "parseAST", kind: "function", line: 15 },
  { name: "resolveImports", kind: "function", line: 52 },
  { name: "buildDependencyGraph", kind: "function", line: 97 },
  { name: "visitNode", kind: "function", line: 134 },
  { name: "transformTree", kind: "function", line: 167 },
  { name: "emitDiagnostic", kind: "function", line: 201 },
  { name: "DEFAULT_CONFIG", kind: "variable", line: 3 },
  { name: "CACHE_TTL_MS", kind: "variable", line: 7 },
  { name: "globalRegistry", kind: "variable", line: 23 },
  { name: "activeVisitors", kind: "variable", line: 41 },
];

// ─── Symbol Row ─────────────────────────────────────────

const SymbolRow = memo(function SymbolRow({ symbol }: { symbol: SymbolEntry }) {
  const config = SYMBOL_KIND_CONFIG[symbol.kind];

  const handleClick = useCallback(() => {
    getVscodeApi().postMessage({
      type: "OPEN_FILE_AT_LINE",
      file_path: ACTIVE_FILE,
      line: symbol.line,
    });
  }, [symbol.line]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 w-full px-4 h-6 text-left bg-transparent border-none cursor-pointer",
        "hover:bg-vsc-list-hover/50 transition-colors duration-fast group",
      )}
    >
      <Icon name={config.icon} tokenSize="2xs" className={cn("shrink-0", config.color)} />
      <span className="text-2xs text-vsc-fg truncate min-w-0">{symbol.name}</span>
      {symbol.detail && (
        <span className="text-3xs text-vsc-text-ghost/40 truncate min-w-0 hidden group-hover:inline">
          {symbol.detail}
        </span>
      )}
      <span className="ml-auto text-3xs text-vsc-text-ghost/40 tabular-nums shrink-0">
        :{symbol.line}
      </span>
    </button>
  );
});

// ─── Symbol Group ───────────────────────────────────────

const SymbolGroup = memo(function SymbolGroup({
  kind,
  symbols,
}: {
  kind: SymbolKind;
  symbols: readonly SymbolEntry[];
}) {
  const [open, setOpen] = useState(true);
  const config = SYMBOL_KIND_CONFIG[kind];

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 h-7 text-left bg-transparent border-none cursor-pointer",
          "hover:bg-vsc-list-hover/50 transition-colors duration-fast",
        )}
      >
        <Icon
          name="chevron-right"
          tokenSize="2xs"
          className={cn(
            "shrink-0 transition-transform duration-normal text-vsc-text-tertiary",
            open && "rotate-90",
          )}
        />
        <Icon name={config.icon} tokenSize="2xs" className={config.color} />
        <span className="text-2xs text-vsc-fg font-medium">{config.label}</span>
        <span className="ml-auto text-3xs text-vsc-text-ghost/50 tabular-nums shrink-0">
          {symbols.length}
        </span>
      </button>
      {open && symbols.map((s) => <SymbolRow key={`${s.kind}-${s.name}`} symbol={s} />)}
    </div>
  );
});

// ─── Main Panel ─────────────────────────────────────────

export const SymbolsView = React.memo(function SymbolsView() {
  const [filter, setFilter] = useState("");

  const filteredSymbols = useMemo(() => {
    if (!filter.trim()) return MOCK_SYMBOLS;
    const lower = filter.toLowerCase();
    return MOCK_SYMBOLS.filter((s) => s.name.toLowerCase().includes(lower));
  }, [filter]);

  const grouped = useMemo(() => {
    const map = new Map<SymbolKind, SymbolEntry[]>();
    for (const s of filteredSymbols) {
      const arr = map.get(s.kind) ?? [];
      arr.push(s);
      map.set(s.kind, arr);
    }
    return map;
  }, [filteredSymbols]);

  return (
    <div className="flex flex-col h-full select-none text-xs">
      {/* ── Header ── */}
      <div className="shrink-0 px-2 pt-2.5 pb-2 space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-2xs font-semibold text-vsc-fg">Symbols</span>
          <span className="text-3xs text-vsc-text-ghost/40 tabular-nums">
            {filteredSymbols.length} symbol{filteredSymbols.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filter input */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 h-6 rounded-md",
            "bg-vsc-input-bg border border-vsc-accent/15",
            "focus-within:border-vsc-accent/30 transition-colors duration-fast",
          )}
        >
          <Icon name="filter" tokenSize="2xs" className="text-vsc-accent/40 shrink-0" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter symbols..."
            className="flex-1 bg-transparent border-none outline-none text-2xs text-vsc-fg placeholder:text-vsc-text-ghost/50 min-w-0"
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter("")}
              className="bg-transparent border-none cursor-pointer p-0 text-vsc-text-tertiary hover:text-vsc-fg transition-colors duration-fast"
            >
              <Icon name="close" tokenSize="2xs" />
            </button>
          )}
        </div>

        {/* Source file indicator */}
        <div className="flex items-center gap-1.5 px-0.5">
          <Icon name="file" tokenSize="2xs" className="text-vsc-text-ghost/30" />
          <span className="text-3xs text-vsc-text-ghost/40 truncate">
            src/core/engine/SemanticParser.ts
          </span>
        </div>
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-vsc-border/15 to-transparent shrink-0" />

      {/* ── Symbol Tree ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pt-1">
        {filteredSymbols.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
            <Icon name="symbol-class" tokenSize="lg" className="text-vsc-text-ghost/20" />
            <span className="text-2xs text-vsc-text-ghost/40 text-center">
              {filter ? `No symbols matching "${filter}"` : "No symbols found"}
            </span>
          </div>
        ) : (
          KIND_ORDER.filter((k) => grouped.has(k)).map((kind) => (
            <SymbolGroup key={kind} kind={kind} symbols={grouped.get(kind) ?? []} />
          ))
        )}
      </div>
    </div>
  );
});

/** @deprecated Use SymbolsView instead */
export { SymbolsView as SymbolsPanel };
