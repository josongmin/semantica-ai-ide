import React, { useMemo } from "react";

import { lineStyles,parseDiffLines } from "../../shared/lib/parseDiffLines";
import { cn } from "../../shared/ui";

/** Detect whether text looks like a unified diff */
// eslint-disable-next-line react-refresh/only-export-components -- co-located helper for InlineDiffSummary
export function looksLikeDiff(text: string): boolean {
  return /^@@\s[+-]/m.test(text) || (/^\+{3}\s/m.test(text) && /^-{3}\s/m.test(text));
}

/** Compact inline diff for result_summary */
export const InlineDiffSummary = React.memo(function InlineDiffSummary({ text }: { text: string }) {
  const lines = useMemo(() => parseDiffLines(text), [text]);

  return (
    <div className="font-mono text-2xs leading-relaxed overflow-auto mt-0.5 rounded border border-vsc-border/30" role="region" aria-label="Diff summary">
      {lines.map((line, i) => (
        <div key={i} className={cn("flex px-1", lineStyles[line.type])}>
          <span className="select-none shrink-0 w-4 text-right pr-1 text-vsc-text-ghost/50">
            {line.lineNumber ?? ""}
          </span>
          <span
            className={cn(
              "select-none shrink-0 w-3 text-center",
              line.type === "add" && "text-vsc-success",
              line.type === "remove" && "text-vsc-error",
              line.type === "header" && "text-vsc-info",
            )}
          >
            {(() => { if (line.type === "add") return "+"; if (line.type === "remove") return "\u2212"; if (line.type === "header") return "@@"; return " "; })()}
          </span>
          <span className="flex-1 whitespace-pre-wrap break-all">
            {line.type === "header" ? line.content : line.content.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
});
