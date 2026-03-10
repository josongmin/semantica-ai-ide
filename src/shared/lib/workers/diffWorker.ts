/**
 * Web Worker for computing line-by-line diffs off the main thread.
 *
 * Receives: { id: string; before: string; after: string }
 * Responds: { id: string; result: DiffResult } | { id: string; error: string }
 *
 * Uses a simple LCS-based (Longest Common Subsequence) diff algorithm.
 * This prevents UI blocking for large files.
 */

// ─── Types (duplicated to avoid import issues in worker context) ──
type DiffLineKind = "add" | "remove" | "context";

interface DiffResultLine {
  readonly kind: DiffLineKind;
  readonly content: string;
  readonly oldLineNumber: number | null;
  readonly newLineNumber: number | null;
}

interface DiffResult {
  readonly lines: readonly DiffResultLine[];
  readonly additions: number;
  readonly deletions: number;
  readonly unchanged: number;
}

interface WorkerRequest {
  readonly id: string;
  readonly before: string;
  readonly after: string;
}

type WorkerResponse =
  | { readonly id: string; readonly result: DiffResult }
  | { readonly id: string; readonly error: string };

// ─── LCS Diff Algorithm ────────────────────────────────────

/**
 * Compute the LCS table for two arrays of strings.
 * Returns a 2D array where lcs[i][j] = length of LCS of a[0..i-1] and b[0..j-1].
 */
function computeLcsTable(a: readonly string[], b: readonly string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    const dpRow = dp[i] ?? [];
    const dpPrevRow = dp[i - 1] ?? [];
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dpRow[j] = (dpPrevRow[j - 1] ?? 0) + 1;
      } else {
        dpRow[j] = Math.max(dpPrevRow[j] ?? 0, dpRow[j - 1] ?? 0);
      }
    }
  }

  return dp;
}

/**
 * Backtrack through the LCS table to produce a diff.
 */
function backtrackDiff(a: readonly string[], b: readonly string[], dp: number[][]): DiffResult {
  let i = a.length;
  let j = b.length;
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  // We collect lines in reverse, then reverse at the end
  const reversedLines: DiffResultLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      // Context line (unchanged)
      reversedLines.push({
        kind: "context",
        content: a[i - 1] ?? "",
        oldLineNumber: i,
        newLineNumber: j,
      });
      unchanged++;
      i--;
      j--;
    } else if (j > 0 && (i === 0 || (dp[i]?.[j - 1] ?? 0) >= (dp[i - 1]?.[j] ?? 0))) {
      // Addition
      reversedLines.push({
        kind: "add",
        content: b[j - 1] ?? "",
        oldLineNumber: null,
        newLineNumber: j,
      });
      additions++;
      j--;
    } else if (i > 0) {
      // Removal
      reversedLines.push({
        kind: "remove",
        content: a[i - 1] ?? "",
        oldLineNumber: i,
        newLineNumber: null,
      });
      deletions++;
      i--;
    }
  }

  reversedLines.reverse();

  return {
    lines: reversedLines,
    additions,
    deletions,
    unchanged,
  };
}

/**
 * Compute a line-by-line diff between two strings.
 */
function computeDiff(before: string, after: string): DiffResult {
  const aLines = before.split("\n");
  const bLines = after.split("\n");

  // Fast path: identical inputs
  if (before === after) {
    return {
      lines: aLines.map((content, i) => ({
        kind: "context" as const,
        content,
        oldLineNumber: i + 1,
        newLineNumber: i + 1,
      })),
      additions: 0,
      deletions: 0,
      unchanged: aLines.length,
    };
  }

  // Fast path: empty before (all additions)
  if (before === "") {
    return {
      lines: bLines.map((content, i) => ({
        kind: "add" as const,
        content,
        oldLineNumber: null,
        newLineNumber: i + 1,
      })),
      additions: bLines.length,
      deletions: 0,
      unchanged: 0,
    };
  }

  // Fast path: empty after (all deletions)
  if (after === "") {
    return {
      lines: aLines.map((content, i) => ({
        kind: "remove" as const,
        content,
        oldLineNumber: i + 1,
        newLineNumber: null,
      })),
      additions: 0,
      deletions: aLines.length,
      unchanged: 0,
    };
  }

  const dp = computeLcsTable(aLines, bLines);
  return backtrackDiff(aLines, bLines, dp);
}

// ─── Worker Message Handler ────────────────────────────────

declare const self: {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown) => void;
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, before, after } = event.data;

  try {
    const result = computeDiff(before, after);
    const response: WorkerResponse = { id, result };
    self.postMessage(response);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown diff error";
    const response: WorkerResponse = { id, error: errorMessage };
    self.postMessage(response);
  }
};

// Export for testing (when imported as a module, not as a worker)
export { computeDiff };
export type { DiffResult as WorkerDiffResult,WorkerRequest, WorkerResponse };
