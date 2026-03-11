import type { ShellLayoutState, SurfaceId } from "./shellAtoms";
import { getViewById } from "./viewRegistry";

// ─── Zone Manager (S1 layer — RFC-010) ──────────────────

const STORAGE_KEY = "semantica:shell-layout";

/**
 * Persist shell layout state to localStorage.
 */
export function saveShellLayout(state: ShellLayoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (e.g., sandboxed iframe)
  }
}

/**
 * Restore shell layout state from localStorage.
 * Returns null if no persisted state is found or data is invalid.
 */
export function loadShellLayout(): ShellLayoutState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Validate required fields (supports both old and new field names for migration)
    const sw = parsed.sidebarWidth;
    const sv = parsed.sidebarVisible;
    const th = parsed.trayHeight ?? parsed.bottomPanelHeight;
    const tv = parsed.trayVisible ?? parsed.bottomPanelVisible;
    const activeSurf = parsed.activeSurface;
    const atv = parsed.activeTrayView ?? parsed.activeBottomPanel;

    if (
      typeof sw !== "number" ||
      typeof sv !== "boolean" ||
      typeof th !== "number" ||
      typeof tv !== "boolean" ||
      typeof activeSurf !== "string" ||
      typeof atv !== "string"
    ) {
      return null;
    }

    const aw = typeof parsed.agentPanelWidth === "number" ? parsed.agentPanelWidth : 320;
    const av = typeof parsed.agentPanelVisible === "boolean" ? parsed.agentPanelVisible : true;

    // RFC-016 §8.2: Validate restored View IDs against viewRegistry
    const validTrayView = getViewById(atv) ? atv : "problems";
    let rawSidebarView: string;
    if (typeof parsed.activeSidebarView === "string") {
      rawSidebarView = parsed.activeSidebarView;
    } else if (typeof parsed.activeSidebarPanel === "string") {
      rawSidebarView = parsed.activeSidebarPanel;
    } else {
      rawSidebarView = "file-tree";
    }
    const validSidebarView = getViewById(rawSidebarView) ? rawSidebarView : "file-tree";
    const navBarExp = typeof parsed.navBarExpanded === "boolean" ? parsed.navBarExpanded : true;

    return {
      navBarExpanded: navBarExp,
      sidebarWidth: clamp(sw, 160, 480),
      sidebarVisible: sv,
      agentPanelWidth: clamp(aw, 200, 600),
      agentPanelVisible: av,
      trayHeight: clamp(th, 100, 500),
      trayVisible: tv,
      activeSurface: activeSurf as SurfaceId,
      activeTrayView: validTrayView,
      activeSidebarView: validSidebarView,
    };
  } catch {
    return null;
  }
}

/**
 * Remove persisted layout state.
 */
export function clearShellLayout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

// ─── Helpers ────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
