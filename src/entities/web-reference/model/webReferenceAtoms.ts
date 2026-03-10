import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

export interface WebReference {
  id: string;
  url: string;
  title: string;
  snippet: string;
  domain: string;
  fetchedAt: string;
}

export const webReferencesAtomFamily = createBoundedAtomFamily(
  (_turnId: string) => atom<WebReference[]>([]),
  { maxSize: 1000 },
  (a: string, b: string) => a === b,
);
setDebugLabel(webReferencesAtomFamily, "webReferencesAtomFamily");

/** Reset all per-turn web reference state */
export const resetWebReferenceStoreAtom = atom(null, (_get, _set) => {
  webReferencesAtomFamily.setShouldRemove(() => true);
  webReferencesAtomFamily.setShouldRemove(null);
});
registerResetAtom(resetWebReferenceStoreAtom);
