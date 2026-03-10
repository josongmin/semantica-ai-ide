import React, { useMemo, useState } from "react";

import { cn, Icon, Text } from "../../shared/ui";

interface SideBySideDiffViewerProps {
  diffText: string;
  className?: string;
}

interface SplitLine {
  readonly oldLineNum: number | null;
  readonly oldContent: string;
  readonly oldType: "remove" | "context" | "";
  readonly newLineNum: number | null;
  readonly newContent: string;
  readonly newType: "add" | "context" | "";
}

function parseSideBySide(text: string): readonly SplitLine[] {
  if (!text.trim()) return [];

  const rawLines = text.split("\n");
  const result: SplitLine[] = [];
  let oldNum = 0;
  let newNum = 0;

  // Collect consecutive remove/add blocks for alignment
  let removeBuf: string[] = [];
  let addBuf: string[] = [];

  function flushBuffers() {
    const max = Math.max(removeBuf.length, addBuf.length);
    for (let i = 0; i < max; i++) {
      const hasOld = i < removeBuf.length;
      const hasNew = i < addBuf.length;
      result.push({
        oldLineNum: hasOld ? ++oldNum : null,
        oldContent: hasOld ? (removeBuf[i] ?? "") : "",
        oldType: hasOld ? "remove" : "",
        newLineNum: hasNew ? ++newNum : null,
        newContent: hasNew ? (addBuf[i] ?? "") : "",
        newType: hasNew ? "add" : "",
      });
    }
    removeBuf = [];
    addBuf = [];
  }

  for (const line of rawLines) {
    if (line.startsWith("@@")) {
      flushBuffers();
      const match = /@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(line);
      if (match) {
        const parsedOld = parseInt(match[1] ?? "", 10);
        const parsedNew = parseInt(match[2] ?? "", 10);
        if (!Number.isNaN(parsedOld)) oldNum = parsedOld - 1;
        if (!Number.isNaN(parsedNew)) newNum = parsedNew - 1;
      }
      result.push({
        oldLineNum: null,
        oldContent: line,
        oldType: "",
        newLineNum: null,
        newContent: line,
        newType: "",
      });
      continue;
    }

    if (line.startsWith("-")) {
      removeBuf.push(line);
      continue;
    }
    if (line.startsWith("+")) {
      addBuf.push(line);
      continue;
    }

    // Context line
    flushBuffers();
    oldNum++;
    newNum++;
    result.push({
      oldLineNum: oldNum,
      oldContent: line,
      oldType: "context",
      newLineNum: newNum,
      newContent: line,
      newType: "context",
    });
  }
  flushBuffers();

  return result;
}

const cellStyle: Record<string, string> = {
  remove: "bg-vsc-diff-delete-line text-vsc-error",
  add: "bg-vsc-diff-insert-line text-vsc-success",
  context: "",
  "": "",
};

/**
 * Side-by-side diff viewer: old (left) and new (right) in a CSS grid.
 * Aligns add/remove pairs for easier comparison.
 */
/** Find runs of 4+ consecutive context lines for collapsing */
interface ContextGroup { startIndex: number; endIndex: number; lineCount: number }

function findCollapsibleGroups(lines: readonly SplitLine[]): readonly ContextGroup[] {
  const groups: ContextGroup[] = [];
  let runStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const lineItem = lines[i];
    if (lineItem === undefined) continue;
    const isContext = lineItem.oldType === "context" && lineItem.newType === "context";
    if (isContext) {
      if (runStart === -1) runStart = i;
    } else {
      if (runStart !== -1 && i - runStart >= 4) {
        groups.push({ startIndex: runStart, endIndex: i - 1, lineCount: i - runStart });
      }
      runStart = -1;
    }
  }
  if (runStart !== -1 && lines.length - runStart >= 4) {
    groups.push({
      startIndex: runStart,
      endIndex: lines.length - 1,
      lineCount: lines.length - runStart,
    });
  }
  return groups;
}

export const SideBySideDiffViewer = React.memo(function SideBySideDiffViewer({
  diffText,
  className,
}: SideBySideDiffViewerProps) {
  const lines = useMemo(() => parseSideBySide(diffText), [diffText]);
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<number>>(() => new Set());
  const contextGroups = useMemo(() => findCollapsibleGroups(lines), [lines]);

  if (lines.length === 0) {
    return (
      <div className={cn("text-center py-2", className)}>
        <Text size="xs" tone="tertiary">
          No diff available
        </Text>
      </div>
    );
  }

  return (
    <div
      className={cn("grid grid-cols-2 text-xs leading-relaxed overflow-auto font-mono", className)}
      role="region"
      aria-label="Side-by-side diff"
    >
      {lines.map((line, i) => {
        // Check if this line is inside a collapsed context group
        const groupIdx = contextGroups.findIndex((g) => i >= g.startIndex && i <= g.endIndex);
        const matchedGroup = groupIdx !== -1 ? contextGroups[groupIdx] : undefined;
        if (matchedGroup !== undefined && !expandedGroups.has(groupIdx)) {
          // Render collapsed placeholder only at group start
          if (i === matchedGroup.startIndex) {
            return (
              <div
                key={`cg-${groupIdx}`}
                className="col-span-2 flex items-center px-1 py-0.5 text-2xs text-vsc-text-ghost hover:bg-vsc-list-hover cursor-pointer select-none focus-ring transition-colors duration-fast"
                onClick={() => setExpandedGroups((s) => new Set([...s, groupIdx]))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedGroups((s) => new Set([...s, groupIdx]));
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Expand ${matchedGroup.lineCount} hidden lines`}
                data-testid="collapsed-context"
              >
                <span className="w-8 shrink-0" />
                <Icon name="unfold" tokenSize="2xs" className="mr-1" />
                <span>⋯ {matchedGroup.lineCount} lines hidden</span>
              </div>
            );
          }
          return null;
        }
        return (
          <React.Fragment key={line.oldLineNum ?? line.newLineNum ?? i}>
            {/* Old side */}
            <div className={cn("flex border-r border-vsc-border/30", cellStyle[line.oldType])}>
              <span className="w-8 shrink-0 text-right pr-2 text-vsc-text-ghost select-none tabular-nums">
                {line.oldLineNum ?? ""}
              </span>
              <span className="px-1 flex-1 whitespace-pre">{line.oldContent}</span>
            </div>
            {/* New side */}
            <div className={cn("flex", cellStyle[line.newType])}>
              <span className="w-8 shrink-0 text-right pr-2 text-vsc-text-ghost select-none tabular-nums">
                {line.newLineNum ?? ""}
              </span>
              <span className="px-1 flex-1 whitespace-pre">{line.newContent}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
});
