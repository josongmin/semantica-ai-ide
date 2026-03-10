import React, { useCallback, useMemo, useRef, useState } from "react";

import { stripAnsi } from "../../shared/lib";
import { useXtermTerminal } from "../../shared/lib/hooks/useXtermTerminal";
import type { ToolCallOutput } from "../../shared/protocol";
import { Badge, cn, Spinner, Text, VisuallyHidden } from "../../shared/ui";

interface TerminalOutputViewerProps {
  output: ToolCallOutput;
  maxLines?: number;
  className?: string;
}

const DEFAULT_MAX_LINES = 200;

function truncateContent(
  text: string,
  max: number,
): { content: string; truncated: boolean; totalLines: number } {
  const lines = text.split("\n");
  if (lines.length <= max) return { content: text, truncated: false, totalLines: lines.length };
  return { content: lines.slice(0, max).join("\n"), truncated: true, totalLines: lines.length };
}

/** xterm-powered pane for stdout or stderr */
const XtermPane = React.memo(function XtermPane({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isReady } = useXtermTerminal({
    content,
    containerRef: ref,
    fontSize: 10,
    lineHeight: 1.6,
  });
  return (
    <>
      <div ref={ref} className="w-full" style={{ maxHeight: "280px" }} />
      {/* Screen-reader accessible text (xterm canvas is not accessible) */}
      <VisuallyHidden>
        <pre>{stripAnsi(content)}</pre>
      </VisuallyHidden>
      {!isReady && (
        <div className="p-2 flex items-center gap-1">
          <Spinner size="sm" />
          <Text size="2xs" tone="ghost">
            Loading terminal...
          </Text>
        </div>
      )}
    </>
  );
});

/**
 * Terminal-style output viewer for command tool calls.
 * Uses xterm.js for full ANSI color rendering.
 */
export const TerminalOutputViewer = React.memo(function TerminalOutputViewer({
  output,
  maxLines = DEFAULT_MAX_LINES,
  className,
}: TerminalOutputViewerProps) {
  const [showStderr, setShowStderr] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const stdoutRaw = output.stdout ?? "";
  const stderrRaw = output.stderr ?? "";
  const hasStdout = stdoutRaw.length > 0;
  const hasStderr = stderrRaw.length > 0;
  const exitCode = output.exit_code;
  const isError = exitCode != null && exitCode !== 0;

  const activeContent = showStderr ? stderrRaw : stdoutRaw;
  const truncation = useMemo(
    () => truncateContent(activeContent, maxLines),
    [activeContent, maxLines],
  );
  const displayContent = showAll ? activeContent : truncation.content;

  const toggleStderr = useCallback(() => {
    setShowStderr((v) => !v);
    setShowAll(false);
  }, []);

  const toggleShowAll = useCallback(() => setShowAll((v) => !v), []);

  return (
    <div
      className={cn(
        "rounded-md border border-vsc-border bg-vsc-code-bg overflow-hidden",
        className,
      )}
    >
      {/* Header with exit code badge and stderr toggle */}
      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-vsc-border bg-vsc-surface-2/50">
        <Text size="2xs" tone="ghost" weight="medium">
          Terminal
        </Text>
        {exitCode != null && (
          <Badge variant={isError ? "error" : "success"} text={`exit ${exitCode}`} />
        )}
        <div className="flex-1" />
        {hasStderr && (
          <button
            type="button"
            onClick={toggleStderr}
            className={cn(
              "text-2xs px-1.5 py-0.5 rounded cursor-pointer transition-colors duration-fast focus-ring",
              showStderr
                ? "bg-vsc-error/15 text-vsc-error"
                : "text-vsc-text-tertiary hover:text-vsc-text-secondary hover:bg-vsc-toolbar transition-colors duration-fast",
            )}
          >
            stderr
          </button>
        )}
      </div>

      {/* Output area */}
      <div className="max-h-[--panel-max-h-md] overflow-hidden">
        {!hasStdout && !hasStderr ? (
          <div className="p-2">
            <Text size="2xs" tone="tertiary" className="italic">
              No output
            </Text>
          </div>
        ) : (
          <>
            {!showStderr && hasStdout && <XtermPane content={displayContent} />}
            {showStderr && hasStderr && <XtermPane content={displayContent} />}
            {!hasStdout && !showStderr && (
              <div className="p-2">
                <Text size="2xs" tone="tertiary" className="italic">
                  No output
                </Text>
              </div>
            )}
          </>
        )}
      </div>

      {/* Truncation notice */}
      {truncation.truncated && !showAll && (
        <div className="px-2 py-1 border-t border-vsc-border">
          <button
            type="button"
            onClick={toggleShowAll}
            className="text-2xs text-vsc-link hover:underline cursor-pointer bg-transparent border-none focus-ring"
          >
            Show all {truncation.totalLines} lines (truncated at {maxLines})
          </button>
        </div>
      )}
    </div>
  );
});
