import { atom } from "jotai";

/**
 * Factory for the common [arrayAtom, pushAtom, resetAtom] triple.
 * Eliminates boilerplate across features that accumulate items
 * into a readonly array (push / reset pattern).
 */
export function createPushAtomSet<T>() {
  const arrayAtom = atom<readonly T[]>([]);
  const pushAtom = atom(null, (get, set, item: T) => {
    const current = get(arrayAtom);
    set(arrayAtom, [...current, item]);
  });
  const resetAtom = atom(null, (_get, set) => {
    set(arrayAtom, []);
  });
  return [arrayAtom, pushAtom, resetAtom] as const;
}
