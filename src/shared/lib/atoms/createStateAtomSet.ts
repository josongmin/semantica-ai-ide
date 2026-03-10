import { atom } from "jotai";

/**
 * Factory for the common [stateAtom, setAtom, resetAtom] triple.
 * Eliminates boilerplate across features that follow the standard
 * read / write / reset pattern.
 */
export function createStateAtomSet<T>(defaultValue: T) {
  const stateAtom = atom<T>(defaultValue);
  const setAtom = atom(null, (_get, set, value: T) => {
    set(stateAtom, value);
  });
  const resetAtom = atom(null, (_get, set) => {
    set(stateAtom, defaultValue);
  });
  return [stateAtom, setAtom, resetAtom] as const;
}
