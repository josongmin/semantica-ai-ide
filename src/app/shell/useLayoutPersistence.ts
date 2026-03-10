import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  activeSurfaceAtom,
  activeTrayViewAtom,
  agentPanelVisibleAtom,
  agentPanelWidthAtom,
  shellLayoutAtom,
  sidebarVisibleAtom,
  sidebarWidthAtom,
  trayHeightAtom,
  trayVisibleAtom,
} from "./model/shellAtoms";
import { loadShellLayout, saveShellLayout } from "./model/ZoneManager";

/**
 * Auto-persist shell layout to localStorage on change (debounced).
 * Restores layout from localStorage on first mount.
 */
export function useLayoutPersistence() {
  const layout = useAtomValue(shellLayoutAtom);
  const setSidebarWidth = useSetAtom(sidebarWidthAtom);
  const setSidebarVisible = useSetAtom(sidebarVisibleAtom);
  const setAgentWidth = useSetAtom(agentPanelWidthAtom);
  const setAgentVisible = useSetAtom(agentPanelVisibleAtom);
  const setTrayHeight = useSetAtom(trayHeightAtom);
  const setTrayVisible = useSetAtom(trayVisibleAtom);
  const setActiveSurface = useSetAtom(activeSurfaceAtom);
  const setActiveTrayView = useSetAtom(activeTrayViewAtom);

  const restored = useRef(false);

  // Restore on mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const saved = loadShellLayout();
    if (!saved) return;

    setSidebarWidth(saved.sidebarWidth);
    setSidebarVisible(saved.sidebarVisible);
    setAgentWidth(saved.agentPanelWidth);
    setAgentVisible(saved.agentPanelVisible);
    setTrayHeight(saved.trayHeight);
    setTrayVisible(saved.trayVisible);
    setActiveSurface(saved.activeSurface);
    setActiveTrayView(saved.activeTrayView);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced auto-save on change
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    // Skip the initial render (restore phase)
    if (!restored.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveShellLayout(layout);
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [layout]);
}
