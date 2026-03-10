import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { setDebugLabel } from "./debugLabel";
import { registerResetAtom } from "./resetRegistry";

export interface ProgressItem {
  readonly key: string;
  readonly value: number;
  readonly max?: number;
  readonly label?: string;
}

/** Per-key progress data */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
export const progressItemFamily = atomFamily(
  (_key: string) => atom<ProgressItem | null>(null),
  (a: string, b: string) => a === b,
);
setDebugLabel(progressItemFamily, "progressItemFamily");

/** Ordered list of active progress keys (single source of truth) */
export const progressKeysAtom = atom<readonly string[]>([]);

/** Write-only: upsert a progress entry */
export const setProgressAtom = atom(
  null,
  (get, set, payload: { key: string; value: number; max?: number; label?: string }) => {
    const item: ProgressItem = {
      key: payload.key,
      value: payload.value,
      max: payload.max,
      label: payload.label,
    };
    set(progressItemFamily(payload.key), item);

    const keys = get(progressKeysAtom);
    if (!keys.includes(payload.key)) {
      set(progressKeysAtom, [...keys, payload.key]);
    }
  },
);

/** Write-only: remove a completed progress entry */
export const removeProgressAtom = atom(null, (get, set, key: string) => {
  set(progressItemFamily(key), null);
  progressItemFamily.remove(key);
  const keys = get(progressKeysAtom);
  if (keys.includes(key)) {
    set(
      progressKeysAtom,
      keys.filter((k) => k !== key),
    );
  }
});

/** Write-only: reset all progress state */
export const resetProgressStoreAtom = atom(null, (get, set) => {
  for (const key of get(progressKeysAtom)) {
    set(progressItemFamily(key), null);
    progressItemFamily.remove(key);
  }
  set(progressKeysAtom, []);
});

registerResetAtom(resetProgressStoreAtom);
