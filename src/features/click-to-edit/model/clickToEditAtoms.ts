import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ElementMapping } from "../../../shared/protocol";

/** All element-to-source mappings for click-to-edit */
export const elementMappingsAtom = atom<readonly ElementMapping[]>([]);

/** Write-only: replace all element mappings from a SET_ELEMENT_MAPPINGS serverEvent */
export const setElementMappingsAtom = atom(
  null,
  (_get, set, mappings: readonly ElementMapping[]) => {
    set(elementMappingsAtom, mappings);
  },
);

/** Whether click-to-edit mode is enabled */
export const clickToEditEnabledAtom = atom(false);

/** Write-only: reset click-to-edit state */
export const resetClickToEditStoreAtom = atom(null, (_get, set) => {
  set(elementMappingsAtom, []);
  set(clickToEditEnabledAtom, false);
});

registerResetAtom(resetClickToEditStoreAtom);
