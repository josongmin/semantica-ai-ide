/**
 * Scratchpad / Notepad atoms.
 *
 * Manages multiple named notepads that can be referenced via @Notepads.
 * Each notepad has a title, content, and last-updated timestamp.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { Notepad } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** All notepads keyed by id */
export const notepadsAtom = atom<ReadonlyMap<string, Notepad>>(new Map());

/** Write-only: replace/merge notepads from a serverEvent payload */
export const setNotepadsAtom = atom(null, (get, set, notepads: readonly Notepad[]) => {
  const existing = new Map(get(notepadsAtom));
  for (const notepad of notepads) {
    existing.set(notepad.id, notepad);
  }
  set(notepadsAtom, existing);
});

/** Write-only: upsert a single notepad */
export const upsertNotepadAtom = atom(null, (get, set, notepad: Notepad) => {
  const map = new Map(get(notepadsAtom));
  map.set(notepad.id, notepad);
  set(notepadsAtom, map);
});

/** Write-only: delete a notepad by id */
export const deleteNotepadAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(notepadsAtom));
  map.delete(id);
  set(notepadsAtom, map);
});

// ─── Active Notepad ──────────────────────────────────────────

/** Currently selected notepad id */
export const activeNotepadIdAtom = atom<string | null>(null);

/** Derived: the currently active notepad object */
export const activeNotepadAtom = atom<Notepad | null>((get) => {
  const id = get(activeNotepadIdAtom);
  if (!id) return null;
  return get(notepadsAtom).get(id) ?? null;
});

/** Derived: ordered list of all notepads sorted by last updated */
export const notepadListAtom = atom((get) => {
  const map = get(notepadsAtom);
  return Array.from(map.values()).sort((a, b) => b.updated_at_ms - a.updated_at_ms);
});

/** Write-only: reset scratchpad state */
export const resetScratchpadAtom = atom(null, (_get, set) => {
  set(notepadsAtom, new Map());
  set(activeNotepadIdAtom, null);
});

registerResetAtom(resetScratchpadAtom);
