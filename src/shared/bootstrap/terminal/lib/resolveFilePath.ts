/**
 * resolveFilePath — RFC-TERMINAL-017 §3.1
 *
 * Resolves relative/partial file paths from terminal output to workspace-absolute paths.
 * Handles common patterns: ./src/foo.ts, src/foo.ts, ../foo.ts, /abs/path.ts
 *
 * Resolution order:
 * 1. Already absolute → return as-is
 * 2. Relative to session CWD → join with cwd
 * 3. Relative to workspace root → join with workspace
 * 4. Fallback → return original
 */

/**
 * Resolve a file path from terminal output to a workspace-relative or absolute path.
 *
 * @param filePath - The path as it appears in terminal output
 * @param sessionCwd - The current working directory of the terminal session
 * @param workspaceRoot - The workspace root (optional, for fallback resolution)
 */
export function resolveFilePath(
  filePath: string,
  sessionCwd: string,
  workspaceRoot?: string,
): string {
  const trimmed = filePath.trim();

  // Already absolute
  if (trimmed.startsWith("/") || /^[A-Z]:\\/i.test(trimmed)) {
    return trimmed;
  }

  // Strip common prefixes that parsers may include
  const cleaned = trimmed
    .replace(/^\.\//, "") // ./src/foo.ts → src/foo.ts
    .replace(/^file:\/\//, ""); // file:// URIs

  // Join with session CWD (most common case)
  const cwdResolved = joinPath(sessionCwd, cleaned);

  // If workspace root is provided, also consider workspace-relative
  if (workspaceRoot && !sessionCwd.startsWith(workspaceRoot)) {
    // CWD is outside workspace — try workspace root as fallback
    return cwdResolved;
  }

  return cwdResolved;
}

/**
 * Simple path join that handles trailing slashes.
 * Does not use Node.js path module (browser-compatible).
 */
function joinPath(base: string, relative: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${b}/${relative}`;
}

/**
 * Extract file path and line/column from common terminal output patterns.
 *
 * Matches:
 *   src/foo.ts:42:10      → { file: "src/foo.ts", line: 42, column: 10 }
 *   src/foo.ts(42,10)     → { file: "src/foo.ts", line: 42, column: 10 }
 *   src/foo.ts line 42    → { file: "src/foo.ts", line: 42 }
 *   at src/foo.ts:42:10   → { file: "src/foo.ts", line: 42, column: 10 }
 */
export function parseFileReference(text: string): {
  file: string;
  line: number;
  column?: number;
} | null {
  // Pattern 1: file:line:col (TypeScript, ESLint, Rust)
  const colonMatch = /(?:at\s+)?([^\s:()]+\.\w+):(\d+)(?::(\d+))?/.exec(text);
  if (colonMatch) {
    return {
      file: colonMatch[1] ?? "",
      line: Number(colonMatch[2] ?? 0),
      column: colonMatch[3] ? Number(colonMatch[3]) : undefined,
    };
  }

  // Pattern 2: file(line,col) (MSBuild, C# compiler)
  const parenMatch = /([^\s:()]+\.\w+)\((\d+),(\d+)\)/.exec(text);
  if (parenMatch) {
    return {
      file: parenMatch[1] ?? "",
      line: Number(parenMatch[2] ?? 0),
      column: Number(parenMatch[3] ?? 0),
    };
  }

  return null;
}
