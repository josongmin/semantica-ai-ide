/**
 * Breadcrumb Navigation atoms.
 *
 * Tracks the user's current navigation context:
 * Session -> Turn -> File -> Symbol
 *
 * Updated as the user scrolls, clicks, or focuses on different elements.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { BreadcrumbContext } from "../../../shared/protocol";

/** Current breadcrumb navigation context */
export const breadcrumbContextAtom = atom<BreadcrumbContext>({});

/** Write-only: update the breadcrumb context (partial merge) */
export const setBreadcrumbContextAtom = atom(
  null,
  (get, set, update: Partial<BreadcrumbContext>) => {
    const current = get(breadcrumbContextAtom);
    set(breadcrumbContextAtom, { ...current, ...update });
  },
);

/** Write-only: clear breadcrumb context below a certain level */
export const clearBreadcrumbBelowAtom = atom(
  null,
  (get, set, level: "session" | "turn" | "file" | "symbol") => {
    const current = get(breadcrumbContextAtom);
    switch (level) {
      case "session":
        set(breadcrumbContextAtom, { session_name: current.session_name });
        break;
      case "turn":
        set(breadcrumbContextAtom, {
          session_name: current.session_name,
          turn_id: current.turn_id,
          turn_label: current.turn_label,
        });
        break;
      case "file":
        set(breadcrumbContextAtom, {
          session_name: current.session_name,
          turn_id: current.turn_id,
          turn_label: current.turn_label,
          file_path: current.file_path,
        });
        break;
      case "symbol":
        // Keep everything
        break;
    }
  },
);

/** Write-only: reset breadcrumb context */
export const resetBreadcrumbContextAtom = atom(null, (_get, set) => {
  set(breadcrumbContextAtom, {});
});

registerResetAtom(resetBreadcrumbContextAtom);
