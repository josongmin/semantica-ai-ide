import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { ToolCategory } from "../../../shared/protocol";
import {
  categoryPermissionsAtom,
  resetCategoryPermissionsAtom,
  setAllCategoryPermissionsAtom,
  setCategoryPermissionAtom,
} from "./atoms";
import {
  type CategoryPermission,
  DEFAULT_PERMISSIONS,
  PERMISSION_PRESETS,
  type PermissionPreset,
} from "./types";

export function usePermissionSettings() {
  const permissions = useAtomValue(categoryPermissionsAtom);
  const setCategoryPermission = useSetAtom(setCategoryPermissionAtom);
  const setAllPermissions = useSetAtom(setAllCategoryPermissionsAtom);
  const resetPermissions = useSetAtom(resetCategoryPermissionsAtom);

  const setPermission = useCallback(
    (category: ToolCategory, permission: CategoryPermission) => {
      setCategoryPermission({ category, permission });
    },
    [setCategoryPermission],
  );

  const applyPreset = useCallback(
    (preset: PermissionPreset) => {
      const presetMap = PERMISSION_PRESETS[preset];
      setAllPermissions(presetMap);
    },
    [setAllPermissions],
  );

  const resetToDefaults = useCallback(() => {
    resetPermissions();
  }, [resetPermissions]);

  const apply = useCallback(() => {
    // Ensure all default categories are present (defensive: prevent silent data loss)
    const merged = new Map(DEFAULT_PERMISSIONS);
    for (const [category, permission] of permissions) {
      merged.set(category, permission);
    }
    const entries: { category: ToolCategory; permission: CategoryPermission }[] = [];
    for (const [category, permission] of merged) {
      entries.push({ category, permission });
    }
    getVscodeApi().postMessage({
      type: "SET_CATEGORY_PERMISSIONS",
      permissions: entries,
    });
  }, [permissions]);

  const getPermission = useCallback(
    (category: ToolCategory): CategoryPermission => {
      return permissions.get(category) ?? DEFAULT_PERMISSIONS.get(category) ?? "ask";
    },
    [permissions],
  );

  return {
    setPermission,
    applyPreset,
    resetToDefaults,
    apply,
    getPermission,
  };
}
