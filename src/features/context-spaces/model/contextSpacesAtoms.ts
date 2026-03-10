/**
 * Context Spaces atoms (CS-07).
 *
 * Project-level shared context bundles containing files, rules,
 * and descriptions that can be toggled active/inactive.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ContextSpace } from "../../../shared/protocol";

// ─── Panel Visibility ────────────────────────────────────────

/** Whether the context space panel is open */
export const contextSpacePanelOpenAtom = atom(false);

// ─── Context Space Data ──────────────────────────────────────

/** All context spaces keyed by id */
export const contextSpacesMapAtom = atom<ReadonlyMap<string, ContextSpace>>(new Map());

/** Write-only: replace all context spaces */
export const setContextSpacesAtom = atom(null, (_get, set, spaces: readonly ContextSpace[]) => {
  const map = new Map<string, ContextSpace>();
  for (const space of spaces) {
    map.set(space.id, space);
  }
  set(contextSpacesMapAtom, map);
});

/** Derived: ordered list of context spaces (sorted by name) */
export const contextSpacesListAtom = atom((get) => {
  const map = get(contextSpacesMapAtom);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
});

/** Derived: only active context spaces */
export const activeContextSpacesAtom = atom((get) =>
  get(contextSpacesListAtom).filter((space) => space.active),
);

/** Derived: total file count across all active spaces */
export const activeContextFilesCountAtom = atom((get) => {
  const activeSpaces = get(activeContextSpacesAtom);
  return activeSpaces.reduce((sum, space) => sum + space.files.length, 0);
});

/** Write-only: reset context spaces store */
export const resetContextSpacesStoreAtom = atom(null, (_get, set) => {
  set(contextSpacesMapAtom, new Map());
  set(contextSpacePanelOpenAtom, false);
});

registerResetAtom(resetContextSpacesStoreAtom);
