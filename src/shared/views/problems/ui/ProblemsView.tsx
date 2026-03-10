import React, { useMemo, useState } from "react";
import { atom, useAtomValue } from "jotai";

import { cn, Icon, Text } from "~shared/ui";

// ─── Problem Model ───────────────────────────────────────

export interface Diagnostic {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  readonly col: number;
  readonly severity: "error" | "warning" | "info" | "hint";
  readonly message: string;
  readonly source?: string;
}

/** Global diagnostics atom — updated by LSP bridge or agent */
// eslint-disable-next-line react-refresh/only-export-components
export const diagnosticsAtom = atom<Diagnostic[]>([]);

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

// ─── Problems View (Bottom Zone) ────────────────────────

export const ProblemsView = React.memo(function ProblemsView() {
  const diagnostics = useAtomValue(diagnosticsAtom);
  const [filter, setFilter] = useState<Diagnostic["severity"] | "all">("all");

  const grouped = useMemo(() => {
    const items = filter === "all" ? diagnostics : diagnostics.filter((d) => d.severity === filter);
    const sorted = [...items].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

    const byFile = new Map<string, Diagnostic[]>();
    for (const d of sorted) {
      const list = byFile.get(d.file) ?? [];
      list.push(d);
      byFile.set(d.file, list);
    }
    return byFile;
  }, [diagnostics, filter]);

  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, info: 0, hint: 0 };
    for (const d of diagnostics) c[d.severity]++;
    return c;
  }, [diagnostics]);

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-vsc-border/30 shrink-0">
        {(["all", "error", "warning", "info", "hint"] as const).map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setFilter(sev)}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs cursor-pointer transition-colors duration-fast focus-ring",
              filter === sev
                ? "bg-vsc-surface-2 text-vsc-fg font-medium"
                : "text-vsc-text-ghost hover:text-vsc-text-secondary",
            )}
          >
            {sev === "all" ? (
              <>All ({diagnostics.length})</>
            ) : (
              <>
                <Icon name={SEV_ICON[sev]} tokenSize="2xs" className={SEV_COLOR[sev]} />
                {counts[sev]}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Diagnostics tree */}
      <div className="flex-1 overflow-y-auto" role="tree" aria-label="Problems">
        {grouped.size === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-vsc-text-ghost">
            <Icon name="check-all" tokenSize="lg" className="opacity-30" />
            <Text size="xs" tone="ghost">
              No problems detected
            </Text>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([file, items]) => (
            <FileGroup key={file} file={file} diagnostics={items} />
          ))
        )}
      </div>
    </div>
  );
});

/** @deprecated Use ProblemsView instead */
export { ProblemsView as ProblemsPanel };

// ─── File Group ──────────────────────────────────────────

const FileGroup = React.memo(function FileGroup({
  file,
  diagnostics,
}: {
  file: string;
  diagnostics: Diagnostic[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const fileName = file.split("/").pop() ?? file;
  const dirPath = file.split("/").slice(0, -1).join("/");

  return (
    <div role="treeitem">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 w-full px-2 py-0.5 text-2xs
                   hover:bg-vsc-list-hover cursor-pointer transition-colors duration-fast text-left"
      >
        <Icon
          name={collapsed ? "chevron-right" : "chevron-down"}
          tokenSize="2xs"
          className="text-vsc-text-ghost shrink-0"
        />
        <Icon name="file" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
        <span className="text-vsc-fg font-medium">{fileName}</span>
        <span className="text-vsc-text-ghost truncate">{dirPath}</span>
        <span className="ml-auto text-vsc-text-ghost tabular-nums">{diagnostics.length}</span>
      </button>

      {!collapsed && (
        <div role="group">
          {diagnostics.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-1.5 pl-7 pr-2 py-0.5 text-2xs
                         hover:bg-vsc-list-hover cursor-pointer transition-colors duration-fast"
              role="treeitem"
            >
              <Icon
                name={SEV_ICON[d.severity]}
                tokenSize="2xs"
                className={cn("shrink-0", SEV_COLOR[d.severity])}
              />
              <span className="text-vsc-text-secondary flex-1">{d.message}</span>
              {d.source && <span className="text-vsc-text-ghost shrink-0">{d.source}</span>}
              <span className="text-vsc-text-ghost tabular-nums shrink-0">
                [{d.line},{d.col}]
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
