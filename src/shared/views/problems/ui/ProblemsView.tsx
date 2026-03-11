import React, { useCallback, useMemo, useState } from "react";
import { atom, useAtomValue } from "jotai";

import { Badge, cn, Icon, Text } from "~shared/ui";

// ─── Problem Model ───────────────────────────────────────

export interface Diagnostic {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  readonly col: number;
  readonly severity: "error" | "warning" | "info" | "hint";
  readonly message: string;
  readonly source?: string;
  /** Optional error code (e.g. TS2345) */
  readonly code?: string;
  /** Optional quick-fix available flag */
  readonly fixable?: boolean;
}

/** Global diagnostics atom — updated by LSP bridge or agent */
// eslint-disable-next-line react-refresh/only-export-components
export const diagnosticsAtom = atom<Diagnostic[]>([]);

// ─── Sample Data (dev-only) ─────────────────────────────

const SAMPLE_DIAGNOSTICS: Diagnostic[] = [
  {
    id: "1",
    file: "src/app/shell/frames/AgentFrame.tsx",
    line: 42,
    col: 18,
    severity: "error",
    message: "Type 'string | undefined' is not assignable to type 'string'.",
    source: "ts",
    code: "TS2322",
    fixable: true,
  },
  {
    id: "2",
    file: "src/app/shell/frames/AgentFrame.tsx",
    line: 87,
    col: 5,
    severity: "warning",
    message: "'selectedModel' is declared but its value is never read.",
    source: "ts",
    code: "TS6133",
    fixable: true,
  },
  {
    id: "3",
    file: "src/features/explorer/ui/ExplorerView.tsx",
    line: 15,
    col: 3,
    severity: "error",
    message: "Property 'onSelect' is missing in type '{}' but required in type 'TreeProps'.",
    source: "ts",
    code: "TS2741",
  },
  {
    id: "4",
    file: "src/features/explorer/ui/ExplorerView.tsx",
    line: 33,
    col: 12,
    severity: "warning",
    message: "Unexpected any. Specify a different type.",
    source: "eslint",
    code: "@typescript-eslint/no-explicit-any",
    fixable: true,
  },
  {
    id: "5",
    file: "src/features/explorer/ui/ExplorerView.tsx",
    line: 71,
    col: 1,
    severity: "info",
    message: "This async function has no 'await' expression.",
    source: "eslint",
    code: "require-await",
  },
  {
    id: "6",
    file: "src/shared/ui/primitives/FileIcon.tsx",
    line: 24,
    col: 9,
    severity: "error",
    message: "Type 'IconDef | undefined' is not assignable to type 'IconDef'.",
    source: "ts",
    code: "TS2322",
    fixable: true,
  },
  {
    id: "7",
    file: "src/widgets/prompt-box/hooks/usePromptBoxLogic.ts",
    line: 112,
    col: 7,
    severity: "warning",
    message: "React Hook useEffect has a missing dependency: 'resetScroll'.",
    source: "eslint",
    code: "react-hooks/exhaustive-deps",
  },
  {
    id: "8",
    file: "src/widgets/prompt-box/hooks/usePromptBoxLogic.ts",
    line: 145,
    col: 22,
    severity: "hint",
    message: "Consider using optional chaining instead of a ternary expression.",
    source: "eslint",
    code: "prefer-optional-chain",
    fixable: true,
  },
  {
    id: "9",
    file: "src/domains/editor/CodeMirrorEditor.tsx",
    line: 8,
    col: 10,
    severity: "warning",
    message: "'useRef' is defined but never used.",
    source: "ts",
    code: "TS6133",
    fixable: true,
  },
  {
    id: "10",
    file: "src/domains/editor/CodeMirrorEditor.tsx",
    line: 56,
    col: 34,
    severity: "info",
    message: "Prefer 'interface' over 'type' for object definitions.",
    source: "eslint",
    code: "consistent-type-definitions",
    fixable: true,
  },
  {
    id: "11",
    file: "tailwind.config.ts",
    line: 23,
    col: 5,
    severity: "hint",
    message: "Consider extracting repeated color values into a shared token.",
    source: "stylelint",
  },
];

const SEV_ORDER: Record<Diagnostic["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
  hint: 3,
};

const SEV_ICON: Record<Diagnostic["severity"], string> = {
  error: "error",
  warning: "warning",
  info: "info",
  hint: "lightbulb",
};

const SEV_COLOR: Record<Diagnostic["severity"], string> = {
  error: "text-vsc-error",
  warning: "text-vsc-warning",
  info: "text-vsc-info",
  hint: "text-vsc-success",
};

const SEV_BG: Record<Diagnostic["severity"], string> = {
  error: "bg-vsc-error/8",
  warning: "bg-vsc-warning/8",
  info: "bg-vsc-info/8",
  hint: "bg-vsc-success/8",
};

type SevFilter = Diagnostic["severity"] | "all";

// ─── Problems View ──────────────────────────────────────

export const ProblemsView = React.memo(function ProblemsView() {
  const lspDiagnostics = useAtomValue(diagnosticsAtom);
  const diagnostics = lspDiagnostics.length > 0 ? lspDiagnostics : SAMPLE_DIAGNOSTICS;

  const [filter, setFilter] = useState<SevFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, info: 0, hint: 0 };
    for (const d of diagnostics) c[d.severity]++;
    return c;
  }, [diagnostics]);

  const grouped = useMemo(() => {
    let items = filter === "all" ? diagnostics : diagnostics.filter((d) => d.severity === filter);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (d) =>
          d.message.toLowerCase().includes(q) ||
          d.file.toLowerCase().includes(q) ||
          (d.source?.toLowerCase().includes(q) ?? false) ||
          (d.code?.toLowerCase().includes(q) ?? false),
      );
    }

    const sorted = [...items].sort((a, b) =>
      SEV_ORDER[a.severity] - SEV_ORDER[b.severity] !== 0
        ? SEV_ORDER[a.severity] - SEV_ORDER[b.severity]
        : a.line - b.line,
    );

    const byFile = new Map<string, Diagnostic[]>();
    for (const d of sorted) {
      const list = byFile.get(d.file) ?? [];
      list.push(d);
      byFile.set(d.file, list);
    }
    return byFile;
  }, [diagnostics, filter, searchQuery]);

  const totalFiltered = useMemo(() => {
    let sum = 0;
    for (const items of grouped.values()) sum += items.length;
    return sum;
  }, [grouped]);

  return (
    <div className="flex flex-col h-full">
      {/* ─── Toolbar ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-vsc-border/20 shrink-0 bg-vsc-bg">
        {/* Filter pills */}
        <div className="flex items-center gap-0.5">
          <FilterPill
            label={`All (${diagnostics.length})`}
            isActive={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {(["error", "warning", "info", "hint"] as const).map((sev) => (
            <FilterPill
              key={sev}
              icon={SEV_ICON[sev]}
              iconClass={SEV_COLOR[sev]}
              count={counts[sev]}
              isActive={filter === sev}
              onClick={() => setFilter(sev)}
              disabled={counts[sev] === 0}
            />
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative flex items-center">
          <Icon
            name="search"
            tokenSize="2xs"
            className="absolute left-1.5 text-vsc-text-ghost pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter problems…"
            className="w-[140px] focus:w-[200px] transition-all duration-200 pl-5 pr-1.5 py-0.5 rounded-md text-2xs
                       bg-vsc-surface-2/50 border border-transparent text-vsc-fg
                       placeholder:text-vsc-text-ghost
                       focus:bg-vsc-surface-2 focus:border-vsc-border/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 p-0.5 rounded hover:bg-vsc-surface-2 cursor-pointer"
            >
              <Icon name="close" tokenSize="3xs" className="text-vsc-text-ghost" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" role="tree" aria-label="Problems">
        {grouped.size === 0 ? (
          <EmptyState hasFilter={filter !== "all" || searchQuery.length > 0} />
        ) : (
          <>
            {/* Results summary */}
            {(filter !== "all" || searchQuery) && (
              <div className="px-3 py-1 text-3xs text-vsc-text-ghost border-b border-vsc-border/10">
                {totalFiltered} problem{totalFiltered !== 1 ? "s" : ""} in {grouped.size} file
                {grouped.size !== 1 ? "s" : ""}
              </div>
            )}
            {Array.from(grouped.entries()).map(([file, items]) => (
              <FileGroup
                key={file}
                file={file}
                diagnostics={items}
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
});

/** @deprecated Use ProblemsView instead */
export { ProblemsView as ProblemsPanel };

// ─── Filter Pill ────────────────────────────────────────

const FilterPill = React.memo(function FilterPill({
  label,
  icon,
  iconClass,
  count,
  isActive,
  onClick,
  disabled,
}: {
  label?: string;
  icon?: string;
  iconClass?: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-[3px] rounded-md text-2xs cursor-pointer transition-colors duration-100 focus-ring border border-transparent",
        isActive
          ? "bg-vsc-surface-2 text-vsc-fg font-medium border-vsc-border/20 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
        disabled && "opacity-30 cursor-default",
      )}
    >
      {icon && (
        <Icon
          name={icon}
          tokenSize="2xs"
          className={cn("shrink-0", isActive ? iconClass : "opacity-60")}
        />
      )}
      {label ?? <span className="tabular-nums">{count}</span>}
    </button>
  );
});

// ─── Empty State ────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-text-ghost">
      <div className="relative">
        <Icon name="check-all" size={32} className="opacity-15" />
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-vsc-success/15 flex items-center justify-center">
          <Icon name="check" tokenSize="3xs" className="text-vsc-success" />
        </div>
      </div>
      <div className="text-center">
        <Text size="xs" tone="ghost" weight="medium">
          {hasFilter ? "No matching problems" : "No problems detected"}
        </Text>
        <Text size="2xs" tone="ghost" className="mt-0.5 opacity-60">
          {hasFilter ? "Try adjusting your filters" : "Your workspace is clean"}
        </Text>
      </div>
    </div>
  );
}

// ─── File Group ─────────────────────────────────────────

const FileGroup = React.memo(function FileGroup({
  file,
  diagnostics,
  hoveredId,
  onHover,
}: {
  file: string;
  diagnostics: Diagnostic[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const fileName = file.split("/").pop() ?? file;
  const dirPath = file.split("/").slice(0, -1).join("/");

  const fileErrors = diagnostics.filter((d) => d.severity === "error").length;
  const fileWarnings = diagnostics.filter((d) => d.severity === "warning").length;

  const handleToggle = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <div role="treeitem" className="border-b border-vsc-border/8 last:border-b-0">
      {/* File header */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 py-[5px] text-2xs",
          "hover:bg-vsc-list-hover/60 cursor-pointer transition-colors duration-100 text-left group",
        )}
      >
        <Icon
          name={collapsed ? "chevron-right" : "chevron-down"}
          tokenSize="3xs"
          className="text-vsc-text-ghost shrink-0 transition-transform duration-100"
        />
        <FileTypeIcon fileName={fileName} />
        <span className="text-vsc-fg font-medium truncate">{fileName}</span>
        <span className="text-vsc-text-ghost truncate text-3xs opacity-60">{dirPath}</span>

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {fileErrors > 0 && (
            <Badge
              variant="error"
              text={fileErrors}
              className="min-w-4! min-h-4! text-3xs! px-1!"
            />
          )}
          {fileWarnings > 0 && (
            <Badge
              variant="warning"
              text={fileWarnings}
              className="min-w-4! min-h-4! text-3xs! px-1!"
            />
          )}
          {diagnostics.length - fileErrors - fileWarnings > 0 && (
            <span className="text-3xs text-vsc-text-ghost tabular-nums">
              +{diagnostics.length - fileErrors - fileWarnings}
            </span>
          )}
        </div>
      </button>

      {/* Diagnostic rows */}
      {!collapsed && (
        <div role="group">
          {diagnostics.map((d) => (
            <DiagnosticRow
              key={d.id}
              diagnostic={d}
              isHovered={hoveredId === d.id}
              onHover={onHover}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Diagnostic Row ─────────────────────────────────────

const DiagnosticRow = React.memo(function DiagnosticRow({
  diagnostic: d,
  isHovered,
  onHover,
}: {
  diagnostic: Diagnostic;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-1.5 pl-6 pr-2 py-[4px] text-2xs group/row",
        "cursor-pointer transition-colors duration-75",
        isHovered ? cn("bg-vsc-list-hover/80", SEV_BG[d.severity]) : "hover:bg-vsc-list-hover/50",
      )}
      role="treeitem"
      onMouseEnter={() => onHover(d.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Icon
        name={SEV_ICON[d.severity]}
        tokenSize="2xs"
        className={cn("shrink-0 mt-px", SEV_COLOR[d.severity])}
      />

      <div className="flex-1 min-w-0">
        <span className="text-vsc-text-secondary leading-snug">{d.message}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-1">
        {d.fixable && (
          <span
            className={cn(
              "opacity-0 group-hover/row:opacity-100 transition-opacity duration-100",
              "inline-flex items-center gap-0.5 px-1 py-px rounded text-3xs",
              "bg-vsc-accent/10 text-vsc-accent cursor-pointer hover:bg-vsc-accent/20",
            )}
            title="Quick Fix available"
          >
            <Icon name="lightbulb-autofix" tokenSize="3xs" />
            Fix
          </span>
        )}

        {d.code && (
          <span className="text-3xs text-vsc-text-ghost font-mono opacity-50 group-hover/row:opacity-80 transition-opacity">
            {d.code}
          </span>
        )}

        {d.source && (
          <span className="text-3xs text-vsc-text-ghost opacity-40 group-hover/row:opacity-70 transition-opacity">
            {d.source}
          </span>
        )}

        <span className="text-3xs text-vsc-text-ghost tabular-nums font-mono opacity-40 group-hover/row:opacity-80 transition-opacity">
          Ln {d.line}, Col {d.col}
        </span>
      </div>
    </div>
  );
});

// ─── File Type Icon ─────────────────────────────────────

function FileTypeIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  let iconName = "file";
  let colorClass = "text-vsc-text-tertiary";

  if (ext === "tsx" || ext === "jsx") {
    iconName = "symbol-misc";
    colorClass = "text-sky-400";
  } else if (ext === "ts" || ext === "js") {
    iconName = "symbol-namespace";
    colorClass = "text-amber-400";
  } else if (ext === "css" || ext === "scss") {
    iconName = "symbol-color";
    colorClass = "text-purple-400";
  } else if (ext === "json") {
    iconName = "symbol-structure";
    colorClass = "text-emerald-400";
  }

  return <Icon name={iconName} tokenSize="2xs" className={cn("shrink-0", colorClass)} />;
}
