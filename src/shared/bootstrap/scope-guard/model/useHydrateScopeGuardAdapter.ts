/**
 * Hydrate hook that populates the scope-guard adapter atom.
 * Called once at bootstrap time from StreamingBootstrap.
 */
import { useCallback, useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  type ScopeGuardAdapter,
  scopeGuardAdapterAtom,
} from "~shared/lib/atoms/scopeGuardAdapterAtoms";

import {
  isScopeGuardActiveAtom,
  matchesGlob,
  scopeExcludesAtom,
  scopeIncludesAtom,
  setScopeGuardAtom,
} from "./scopeGuardAtoms";

export function useHydrateScopeGuardAdapter(): void {
  const isActive = useAtomValue(isScopeGuardActiveAtom);
  const includes = useAtomValue(scopeIncludesAtom);
  const excludes = useAtomValue(scopeExcludesAtom);
  const setScopeGuard = useSetAtom(setScopeGuardAtom);
  const setAdapter = useSetAtom(scopeGuardAdapterAtom);

  const isScopeViolation = useCallback(
    (filePath: string): boolean => {
      if (includes.length === 0 && excludes.length === 0) return false;
      if (excludes.some((pattern) => matchesGlob(filePath, pattern))) return true;
      if (includes.length > 0) {
        return !includes.some((pattern) => matchesGlob(filePath, pattern));
      }
      return false;
    },
    [includes, excludes],
  );

  const adapter: ScopeGuardAdapter = useMemo(
    () => ({
      isActive,
      includes,
      excludes,
      isScopeViolation,
      setScopeGuard,
    }),
    [isActive, includes, excludes, isScopeViolation, setScopeGuard],
  );

  useEffect(() => {
    setAdapter(adapter);
  }, [setAdapter, adapter]);
}
