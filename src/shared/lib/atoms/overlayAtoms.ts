import { atom } from "jotai";

// ─── Overlay Stack (LIFO) ────────────────────────────────

/** Unique overlay instance identifier */
export type OverlayId = string;

/** Overlay type for stack management */
export type OverlayType =
  | "dialog"
  | "dropdown"
  | "popover"
  | "alert-dialog"
  | "command-palette"
  | "context-menu"
  | "drawer";

/** Metadata for a registered overlay */
export interface OverlayEntry {
  readonly id: OverlayId;
  readonly type: OverlayType;
  readonly dismiss: (() => void) | null;
}

/** LIFO stack of active overlays. Bottom = index 0, top = last. */
export const overlayStackAtom = atom<readonly OverlayEntry[]>([]);

/** Push an overlay onto the top of the stack. Deduplicates by id (safe for StrictMode). */
export const pushOverlayAtom = atom(null, (get, set, entry: OverlayEntry) => {
  const current = get(overlayStackAtom);
  const withoutDup = current.filter((e) => e.id !== entry.id);
  set(overlayStackAtom, [...withoutDup, entry]);
});

/** Remove a specific overlay by id. */
export const popOverlayAtom = atom(null, (get, set, id: OverlayId) => {
  const current = get(overlayStackAtom);
  set(
    overlayStackAtom,
    current.filter((e) => e.id !== id),
  );
});

/** Derived: the topmost overlay entry, or null if stack is empty. */
export const topOverlayAtom = atom((get) => {
  const stack = get(overlayStackAtom);
  return stack.length > 0 ? stack[stack.length - 1] : null;
});

/** Reset all overlay atoms to their defaults */
export const resetOverlayAtomsAtom = atom(null, (_get, set) => {
  set(overlayStackAtom, []);
});
