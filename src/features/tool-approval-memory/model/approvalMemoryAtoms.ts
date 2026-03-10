import { atom } from "jotai";

/**
 * Tool approval memory — stores "always allow" rules per tool name.
 * When a tool is in the allowed set, approval requests for it are auto-granted.
 */

/** Set of tool names that are permanently allowed */
export const alwaysAllowedToolsAtom = atom<ReadonlySet<string>>(new Set<string>());

/** Write atom: add a tool to the always-allowed set */
export const addAlwaysAllowedToolAtom = atom(null, (get, set, toolName: string) => {
  const prev = get(alwaysAllowedToolsAtom);
  if (prev.has(toolName)) return;
  set(alwaysAllowedToolsAtom, new Set([...prev, toolName]));
});

/** Write atom: remove a tool from the always-allowed set */
export const removeAlwaysAllowedToolAtom = atom(null, (get, set, toolName: string) => {
  const prev = get(alwaysAllowedToolsAtom);
  if (!prev.has(toolName)) return;
  const next = new Set(prev);
  next.delete(toolName);
  set(alwaysAllowedToolsAtom, next);
});

/** Write atom: clear all always-allowed tools */
export const clearAlwaysAllowedToolsAtom = atom(null, (_get, set) => {
  set(alwaysAllowedToolsAtom, new Set());
});

/** Derived: check if a specific tool is always allowed */
export function isToolAlwaysAllowed(toolName: string, allowedSet: ReadonlySet<string>): boolean {
  return allowedSet.has(toolName);
}
