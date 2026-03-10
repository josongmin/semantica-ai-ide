import { atom } from "jotai";

import { createBoundedAtomFamily } from "~shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "~shared/lib/atoms/debugLabel";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

/** Include glob patterns: files matching any pattern are allowed */
export const scopeIncludesAtom = atom<readonly string[]>([]);

/** Exclude glob patterns: files matching any pattern are blocked */
export const scopeExcludesAtom = atom<readonly string[]>([]);

/** Write-only: set scope guard patterns (both includes and excludes) */
export const setScopeGuardAtom = atom(
  null,
  (_get, set, payload: { includes: readonly string[]; excludes: readonly string[] }) => {
    set(scopeIncludesAtom, payload.includes);
    set(scopeExcludesAtom, payload.excludes);
  },
);

/**
 * Simple glob matcher supporting * and ** patterns.
 * Converts a glob pattern to a RegExp for matching file paths.
 */
export function matchesGlob(filePath: string, pattern: string): boolean {
  // Normalize separators
  const normalizedPath = filePath.replace(/\\/g, "/");
  const normalizedPattern = pattern.replace(/\\/g, "/");

  // Escape regex special chars except * and ?
  const regexStr = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    // ** matches any path including /
    .replace(/\*\*/g, "{{DOUBLESTAR}}")
    // * matches anything except /
    .replace(/\*/g, "[^/]*")
    .replace(/\{\{DOUBLESTAR\}\}/g, ".*")
    .replace(/\?/g, "[^/]");

  return new RegExp(`^${regexStr}$`).test(normalizedPath);
}

/**
 * Derived atom factory: checks if a file path violates scope rules.
 * Returns true if the path is outside the allowed scope.
 *
 * Rules:
 * - If no includes are set, all paths are allowed (unless excluded)
 * - If includes are set, the path must match at least one include pattern
 * - If the path matches any exclude pattern, it is blocked
 */
export const isScopeViolationAtom = createBoundedAtomFamily(
  (filePath: string) =>
    atom<boolean>((get) => {
      const includes = get(scopeIncludesAtom);
      const excludes = get(scopeExcludesAtom);

      // No scope rules = no violations
      if (includes.length === 0 && excludes.length === 0) return false;

      // Check excludes first: if excluded, it's a violation
      if (excludes.some((pattern) => matchesGlob(filePath, pattern))) {
        return true;
      }

      // If includes are set, path must match at least one
      if (includes.length > 0) {
        return !includes.some((pattern) => matchesGlob(filePath, pattern));
      }

      return false;
    }),
  { maxSize: 1000 },
  (a: string, b: string) => a === b,
);
setDebugLabel(isScopeViolationAtom, "isScopeViolationAtom");

/** Read-only: whether scope guard is active (any rules configured) */
export const isScopeGuardActiveAtom = atom((get) => {
  return get(scopeIncludesAtom).length > 0 || get(scopeExcludesAtom).length > 0;
});

/** Write-only: reset scope guard state */
export const resetScopeGuardAtom = atom(null, (_get, set) => {
  set(scopeIncludesAtom, []);
  set(scopeExcludesAtom, []);
});

registerResetAtom(resetScopeGuardAtom);
