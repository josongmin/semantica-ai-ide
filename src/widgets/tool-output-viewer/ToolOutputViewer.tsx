import React, { useMemo, useState } from "react";

import { lineStyles,parseDiffLines } from "../../shared/lib/parseDiffLines";
import type { ToolCallOutput } from "../../shared/protocol";
import { cn, Tabs, Text } from "../../shared/ui";

interface ToolOutputViewerProps {
  output: ToolCallOutput;
  className?: string;
}

const OUTPUT_TABS = [
  { id: "output", label: "Output" },
  { id: "json", label: "JSON" },
] as const;

/** Detect whether text looks like a unified diff */
function looksLikeDiff(text: string): boolean {
  return /^@@\s[+-]/m.test(text) || (/^\+{3}\s/m.test(text) && /^-{3}\s/m.test(text));
}

const LINE_PREFIX_STYLE: Record<string, string> = {
  add: "text-vsc-success",
  remove: "text-vsc-error",
  header: "text-vsc-info",
  context: "text-vsc-text-ghost",
};

/** Compact inline diff renderer reusing parseDiffLines + lineStyles */
const InlineDiffBlock = React.memo(function InlineDiffBlock({ text }: { text: string }) {
  const lines = useMemo(() => parseDiffLines(text), [text]);

  return (
    <div className="font-mono text-2xs leading-relaxed overflow-auto">
      {lines.map((line, i) => (
        <div key={`${line.type}-${line.lineNumber ?? i}`} className={cn("flex", lineStyles[line.type])}>
          <span
            className={cn(
              "select-none shrink-0 w-5 text-right pr-1 text-vsc-text-ghost/50",
              line.type === "header" && "text-vsc-info",
            )}
          >
            {line.lineNumber ?? ""}
          </span>
          <span className={cn("select-none shrink-0 w-3 text-center", LINE_PREFIX_STYLE[line.type])}>
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

/**
 * Structured output viewer for tool call results.
 * Displays stdout/stderr in "Output" tab, and raw structured data in "JSON" tab.
 * Automatically renders unified diffs with colored add/remove lines.
 */
export const ToolOutputViewer = React.memo(function ToolOutputViewer({
  output,
  className,
}: ToolOutputViewerProps) {
  const [activeTab, setActiveTab] = useState("output");

  const hasStdout = !!output.stdout;
  const hasStderr = !!output.stderr;
  const hasStructured = !!output.structured && Object.keys(output.structured).length > 0;
  const isDiff = hasStdout && looksLikeDiff(output.stdout);

  if (!hasStdout && !hasStderr && !hasStructured) {
    return (
      <div className={cn("text-xs text-vsc-text-tertiary italic py-1", className)}>No output</div>
    );
  }

  return (
    <div className={cn("rounded-md border border-vsc-border overflow-hidden", className)}>
      <Tabs tabs={[...OUTPUT_TABS]} activeId={activeTab} onTabChange={setActiveTab} />

      <div className="p-2 max-h-[--panel-max-h-md] overflow-auto">
        {activeTab === "output" ? (
          <div className="space-y-1.5">
            {hasStdout && (
              isDiff ? (
                <InlineDiffBlock text={output.stdout} />
              ) : (
                <pre className="text-2xs leading-relaxed text-vsc-fg whitespace-pre-wrap wrap-break-word font-mono">
                  {output.stdout}
                </pre>
              )
            )}
            {hasStderr && (
              <pre className="text-2xs leading-relaxed text-vsc-error/80 whitespace-pre-wrap wrap-break-word font-mono">
                {output.stderr}
              </pre>
            )}
            {!hasStdout && !hasStderr && (
              <Text size="2xs" tone="tertiary">
                No text output
              </Text>
            )}
          </div>
        ) : (
          <pre className="text-2xs leading-relaxed text-vsc-fg whitespace-pre-wrap wrap-break-word font-mono">
            {hasStructured
              ? JSON.stringify(output.structured, null, 2)
              : JSON.stringify(
                  {
                    stdout: output.stdout ?? null,
                    stderr: output.stderr ?? null,
                    exit_code: output.exit_code ?? null,
                  },
                  null,
                  2,
                )}
          </pre>
        )}
      </div>
    </div>
  );
});
