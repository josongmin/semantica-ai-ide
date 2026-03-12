import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";

import type { SurfaceId } from "../../../shared/protocol/types/ui";
import { detachToFloatingAtom } from "../model/floatingAtoms";
import { activeNavCategoryAtom, type NavCategoryId, type NavToolId } from "../model/navRegistry";
import { navigateAtom } from "../model/surfaceLifecycleAtoms";

/** Maps nav categories to their default surface. */
const CATEGORY_SURFACE: Partial<Record<NavCategoryId, SurfaceId>> = {
  ide: "code",
  agent: "chat",
  graph: "graph",
};

export function useNavCategoryActions() {
  const [activeCategory, setActiveCategory] = useAtom(activeNavCategoryAtom);
  const navigate = useSetAtom(navigateAtom);
  const detachToFloating = useSetAtom(detachToFloatingAtom);

  const handleCategoryClick = useCallback(
    (id: NavCategoryId) => {
      setActiveCategory(id);
      const surfaceId = CATEGORY_SURFACE[id];
      if (surfaceId) {
        // RFC-021 §4: Coordinator handles save/restore/lifecycle
        navigate({ surfaceId });
      }
    },
    [setActiveCategory, navigate],
  );

  const handleToolClick = useCallback(
    (id: NavToolId) => {
      if (id === "terminal") {
        detachToFloating("terminal");
      } else if (id === "settings") {
        navigate({ surfaceId: "settings" });
      }
    },
    [navigate, detachToFloating],
  );

  return { activeCategory, handleCategoryClick, handleToolClick } as const;
}
