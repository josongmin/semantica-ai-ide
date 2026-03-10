import React, { memo, useCallback, useMemo, useState } from "react";

import { getVscodeApi } from "~shared/lib/vscodeApi";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

// ─── Types ──────────────────────────────────────────────

type Severity = "error" | "warning" | "info";

interface Finding {
  readonly severity: Severity;
  readonly message: string;
  readonly filePath: string;
  readonly line: number;
  readonly col: number;
  readonly source?: string;
}

type FilterTab = "all" | "error" | "warning" | "info";

// ─── Severity Config ────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { icon: string; color: string; label: string }> = {
  error: { icon: "error", color: "text-vsc-error", label: "Errors" },
  warning: { icon: "warning", color: "text-vsc-warning", label: "Warnings" },
  info: { icon: "info", color: "text-vsc-info", label: "Info" },
};

// ─── Mock Data ──────────────────────────────────────────

const MOCK_FINDINGS: Finding[] = [
  { severity: "error", message: "Type 'string' is not assignable to type 'number'", filePath: "src/core/engine/SemanticParser.ts", line: 47, col: 12, source: "ts(2322)" },
  { severity: "error", message: "Property 'resolve' does not exist on type 'INodeVisitor'", filePath: "src/core/engine/SemanticParser.ts", line: 102, col: 8, source: "ts(2339)" },
  { severity: "error", message: "Cannot find module '../core/missing'", filePath: "src/features/intent-engine/resolver.ts", line: 3, col: 1, source: "ts(2307)" },
  { severity: "warning", message: "'parseResult' is declared but never used", filePath: "src/core/engine/SemanticParser.ts", line: 15, col: 7, source: "ts(6133)" },
  { severity: "warning", message: "This comparison appears to be unintentional", filePath: "src/features/intent-engine/resolver.ts", line: 33, col: 14, source: "ts(2367)" },
  { severity: "warning", message: "Unexpected 'any'. Specify a different type", filePath: "src/shared/lib/utils.ts", line: 71, col: 29, source: "@typescript-eslint" },
  { severity: "warning", message: "Missing return type on function", filePath: "src/shared/lib/utils.ts", line: 85, col: 1, source: "@typescript-eslint" },
  { severity: "warning", message: "Prefer 'const' over 'let' when variable is never reassigned", filePath: "packages/protocol/src/models/index.ts", line: 22, col: 3, source: "prefer-const" },
  { severity: "info", message: "This async function has no 'await' expression", filePath: "src/features/intent-engine/resolver.ts", line: 58, col: 1, source: "require-await" },
  { severity: "info", message: "File has too many lines (320). Maximum allowed is 300", filePath: "src/core/engine/SemanticParser.ts", line: 1, col: 1, source: "max-lines" },
  { severity: "info", message: "Consider extracting this logic into a separate function", filePath: "src/widgets/prompt-box/PromptBox.tsx", line: 156, col: 3, source: "complexity" },
  { severity: "warning", message: "React Hook useEffect has a missing dependency", filePath: "src/widgets/prompt-box/PromptBox.tsx", line: 89, col: 5, source: "react-hooks/exhaustive-deps" },
];

// ─── Finding Row ────────────────────────────────────────

const FindingRow = memo(function FindingRow({ finding }: { finding: Finding }) {
  const config = SEVERITY_CONFIG[finding.severity];

  const handleClick = useCallback(() => {
    getVscodeApi().postMessage({
      type: "OPEN_FILE_AT_LINE",
      file_path: finding.filePath,
      line: finding.line,
    });
  }, [finding.filePath, finding.line]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-start gap-2 w-full px-4 py-1 text-left bg-transparent border-none cursor-pointer",
        "hover:bg-vsc-list-hover/50 transition-colors duration-fast group",
      )}
    >
      <Icon name={config.icon} tokenSize="2xs" className={cn("shrink-0 mt-0.5", config.color)} />
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="text-2xs text-vsc-fg/90 leading-tight">{finding.message}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-3xs text-vsc-text-ghost/50 tabular-nums">
            {finding.line}:{finding.col}
          </span>
          {finding.source && (
            <span className="text-3xs text-vsc-text-ghost/35">{finding.source}</span>
          )}
        </div>
      </div>
    </button>
  );
});

// ─── File Group ─────────────────────────────────────────

const FileGroup = memo(function FileGroup({
  filePath,
  findings,
}: {
  filePath: string;
  findings: readonly Finding[];
}) {
  const [open, setOpen] = useState(true);
  const parts = filePath.split("/");
  const fileName = parts.pop() ?? filePath;
  const dirPath = parts.join("/");

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 h-6 text-left bg-transparent border-none cursor-pointer",
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
        <Icon name="file" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
        <span className="text-2xs text-vsc-fg font-medium truncate">{fileName}</span>
        <span className="text-3xs text-vsc-text-ghost/40 truncate min-w-0">{dirPath}</span>
        <span className="ml-auto text-3xs text-vsc-text-ghost/50 tabular-nums shrink-0">
          {findings.length}
        </span>
      </button>
      {open && findings.map((f, i) => <FindingRow key={`${f.line}-${f.col}-${i}`} finding={f} />)}
    </div>
  );
});

// ─── Filter Tab Button ──────────────────────────────────

const FilterTabButton = memo(function FilterTabButton({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2 h-5 rounded-sm border-none cursor-pointer text-3xs transition-colors duration-fast",
        active
          ? "bg-vsc-accent/15 text-vsc-accent font-medium"
          : "bg-transparent text-vsc-text-tertiary hover:text-vsc-fg",
      )}
    >
      <span>{label}</span>
      <span className={cn("tabular-nums", color && active ? color : undefined)}>{count}</span>
    </button>
  );
});

// ─── Main Panel ─────────────────────────────────────────

export const FindingsView = React.memo(function FindingsView() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const counts = useMemo(() => {
    const c = { all: 0, error: 0, warning: 0, info: 0 };
    for (const f of MOCK_FINDINGS) {
      c.all++;
      c[f.severity]++;
    }
    return c;
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === "all") return MOCK_FINDINGS;
    return MOCK_FINDINGS.filter((f) => f.severity === activeTab);
  }, [activeTab]);

  const groupedByFile = useMemo(() => {
    const map = new Map<string, Finding[]>();
    for (const f of filtered) {
      const arr = map.get(f.filePath) ?? [];
      arr.push(f);
      map.set(f.filePath, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div className="flex flex-col h-full select-none text-xs">
      {/* ── Header ── */}
      <div className="shrink-0 px-2 pt-2.5 pb-2 space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-2xs font-semibold text-vsc-fg">Findings</span>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0.5">
          <FilterTabButton
            label="All"
            count={counts.all}
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
          <FilterTabButton
            label="Errors"
            count={counts.error}
            active={activeTab === "error"}
            onClick={() => setActiveTab("error")}
            color="text-vsc-error"
          />
          <FilterTabButton
            label="Warnings"
            count={counts.warning}
            active={activeTab === "warning"}
            onClick={() => setActiveTab("warning")}
            color="text-vsc-warning"
          />
          <FilterTabButton
            label="Info"
            count={counts.info}
            active={activeTab === "info"}
            onClick={() => setActiveTab("info")}
            color="text-vsc-info"
          />
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-2 px-0.5">
          <div className="flex items-center gap-1">
            <Icon name="error" tokenSize="2xs" className="text-vsc-error" />
            <span className="text-3xs text-vsc-text-ghost/60 tabular-nums">{counts.error}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="warning" tokenSize="2xs" className="text-vsc-warning" />
            <span className="text-3xs text-vsc-text-ghost/60 tabular-nums">{counts.warning}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="info" tokenSize="2xs" className="text-vsc-info" />
            <span className="text-3xs text-vsc-text-ghost/60 tabular-nums">{counts.info}</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-vsc-border/15 to-transparent shrink-0" />

      {/* ── Findings List ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pt-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
            <Icon name="check" tokenSize="lg" className="text-vsc-success/30" />
            <span className="text-2xs text-vsc-text-ghost/40 text-center">
              No {activeTab === "all" ? "findings" : SEVERITY_CONFIG[activeTab as Severity].label.toLowerCase()} found
            </span>
          </div>
        ) : (
          Array.from(groupedByFile.entries()).map(([filePath, findings]) => (
            <FileGroup key={filePath} filePath={filePath} findings={findings} />
          ))
        )}
      </div>
    </div>
  );
});

/** @deprecated Use FindingsView instead */
export { FindingsView as FindingsPanel };
