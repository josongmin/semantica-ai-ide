export type DiffLineType = "add" | "remove" | "context" | "header";

export interface DiffLine {
  readonly type: DiffLineType;
  readonly content: string;
  readonly lineNumber: number | null;
  readonly hunkIndex: number;
}

export function parseDiffLines(text: string): readonly DiffLine[] {
  if (!text.trim()) return [];

  let lineNum = 0;
  let hunkIdx = -1;
  return text.split("\n").map((line): DiffLine => {
    if (line.startsWith("@@")) {
      hunkIdx++;
      const match = /@@ -\d+(?:,\d+)? \+(\d+)/.exec(line);
      if (match) {
        const parsed = parseInt(match[1] ?? "0", 10);
        if (!Number.isNaN(parsed)) lineNum = parsed - 1;
      }
      return { type: "header", content: line, lineNumber: null, hunkIndex: hunkIdx };
    }
    if (line.startsWith("-")) {
      return { type: "remove", content: line, lineNumber: null, hunkIndex: hunkIdx };
    }
    lineNum++;
    if (line.startsWith("+")) {
      return { type: "add", content: line, lineNumber: lineNum, hunkIndex: hunkIdx };
    }
    return { type: "context", content: line, lineNumber: lineNum, hunkIndex: hunkIdx };
  });
}

export const lineStyles: Record<DiffLineType, string> = {
  add: "bg-vsc-diff-insert-line",
  remove: "bg-vsc-diff-delete-line",
  context: "",
  header: "text-vsc-info font-medium bg-vsc-surface-1/50",
};

/** Identify collapsible context line groups (4+ consecutive context lines) */
export interface ContextGroup {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly lineCount: number;
}

export function findCollapsibleGroups(lines: readonly DiffLine[]): readonly ContextGroup[] {
  const groups: ContextGroup[] = [];
  let runStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.type === "context") {
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

/** Build a Set of line indices hidden by collapsed context groups */
export function buildHiddenSet(
  groups: readonly ContextGroup[],
  expandedGroups: ReadonlySet<number>,
): ReadonlySet<number> {
  const hidden = new Set<number>();
  for (let gi = 0; gi < groups.length; gi++) {
    if (expandedGroups.has(gi)) continue;
    const g = groups[gi];
    if (g === undefined) continue;
    for (let i = g.startIndex; i <= g.endIndex; i++) hidden.add(i);
  }
  return hidden;
}
