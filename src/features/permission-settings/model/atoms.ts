import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ToolCategory } from "../../../shared/protocol";
import { type CategoryPermission, DEFAULT_PERMISSIONS } from "./types";

/** Per-category permission map */
export const categoryPermissionsAtom = atom<ReadonlyMap<ToolCategory, CategoryPermission>>(
  new Map(DEFAULT_PERMISSIONS),
);

/** Write atom: set a single category's permission */
export const setCategoryPermissionAtom = atom(
  null,
  (get, set, payload: { category: ToolCategory; permission: CategoryPermission }) => {
    const current = get(categoryPermissionsAtom);
    const next = new Map(current);
    next.set(payload.category, payload.permission);
    set(categoryPermissionsAtom, next);
  },
);

/** Write atom: replace all category permissions at once (for presets) */
export const setAllCategoryPermissionsAtom = atom(
  null,
  (_get, set, permissions: ReadonlyMap<ToolCategory, CategoryPermission>) => {
    set(categoryPermissionsAtom, new Map(permissions));
  },
);

/** Write atom: reset to defaults */
export const resetCategoryPermissionsAtom = atom(null, (_get, set) => {
  set(categoryPermissionsAtom, new Map(DEFAULT_PERMISSIONS));
});

registerResetAtom(resetCategoryPermissionsAtom);
