import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";

import type { SurfaceId } from "../../../shared/protocol/types/ui";
import { detachToFloatingAtom } from "../model/floatingAtoms";
import { activeNavCategoryAtom, type NavCategoryId, type NavToolId } from "../model/navRegistry";
import { activeSurfaceAtom, restoreFrameStateAtom, saveFrameStateAtom } from "../model/shellAtoms";

/** Maps nav categories to their default surface. */
const CATEGORY_SURFACE: Partial<Record<NavCategoryId, SurfaceId>> = {
  ide: "code",
  agent: "chat",
  graph: "graph",
};

export function useNavCategoryActions() {
  const [activeCategory, setActiveCategory] = useAtom(activeNavCategoryAtom);
  const setActiveSurface = useSetAtom(activeSurfaceAtom);
  const detachToFloating = useSetAtom(detachToFloatingAtom);
  const saveFrameState = useSetAtom(saveFrameStateAtom);
  const restoreFrameState = useSetAtom(restoreFrameStateAtom);

  const handleCategoryClick = useCallback(
    (id: NavCategoryId) => {
      // Save current surface's frame state before switching
      saveFrameState();

      setActiveCategory(id);
      const surfaceId = CATEGORY_SURFACE[id];
      if (surfaceId) {
        setActiveSurface(surfaceId);
        // Restore the target surface's saved frame state (layout-constrained)
        restoreFrameState(surfaceId);
      }
    },
    [setActiveCategory, setActiveSurface, saveFrameState, restoreFrameState],
  );

  const handleToolClick = useCallback(
    (id: NavToolId) => {
      if (id === "terminal") {
        detachToFloating("terminal");
      } else if (id === "settings") {
        saveFrameState();
        setActiveSurface("settings");
      }
    },
    [setActiveSurface, detachToFloating, saveFrameState],
  );

  return { activeCategory, handleCategoryClick, handleToolClick } as const;
}
