/**
 * View menu action handlers.
 *
 * Uses lazy imports (dynamic import()) to avoid coupling the menu system
 * to the full app atom graph at bundle time.
 */
import type { PageId } from "../../../shared/lib/atoms/uiAtoms";
import { registerMenuAction, registerMenuActions } from "../actionRegistry";
import { ACTION_IDS } from "../types";

// ── View — Page Navigation ──
const pageActions: readonly [string, PageId][] = [
  [ACTION_IDS.VIEW_PAGE_SESSIONS, "sessions"],
  [ACTION_IDS.VIEW_PAGE_ARENA, "arena"],
  [ACTION_IDS.VIEW_PAGE_REVIEW, "review"],
  [ACTION_IDS.VIEW_PAGE_TODOS, "todos"],
  [ACTION_IDS.VIEW_PAGE_SETTINGS, "settings"],
];

for (const [actionId, page] of pageActions) {
  registerMenuAction(actionId as typeof ACTION_IDS.VIEW_PAGE_SESSIONS, async (store) => {
    const { currentPageAtom } = await import("../../../shared/lib/atoms/uiAtoms");
    store.set(currentPageAtom, page);
  });
}

// ── View — Toggles ──
registerMenuAction(ACTION_IDS.VIEW_TOGGLE_SIDEBAR, async (store) => {
  const { fileTreePanelVisibleAtom } = await import("../../../shared/lib/atoms/uiAtoms");
  const current = store.get(fileTreePanelVisibleAtom);
  store.set(fileTreePanelVisibleAtom, !current);
});

registerMenuAction(ACTION_IDS.VIEW_TOGGLE_FEATURE_BAR, async (store) => {
  const { activeFeatureSheetAtom, toggleFeatureSheetAtom } = await import(
    "../../../shared/lib/atoms/featureSheetAtoms"
  );
  const current = store.get(activeFeatureSheetAtom);
  // If a sheet is open → close it. If closed → open default "agents" sheet.
  store.set(toggleFeatureSheetAtom, current ?? "agents");
});

// ── View — Workspace Graph ──
registerMenuAction(ACTION_IDS.VIEW_WORKSPACE_GRAPH, async (store) => {
  const { graphPanelVisibleAtom } = await import("../../../shared/lib/atoms/panelAtoms");
  store.set(graphPanelVisibleAtom, !store.get(graphPanelVisibleAtom));
});

// ── View — File Changes ──
registerMenuAction(ACTION_IDS.VIEW_FILE_CHANGES, async (store) => {
  const { reviewChangesPanelVisibleAtom } = await import("../../../shared/lib/atoms/panelAtoms");
  store.set(reviewChangesPanelVisibleAtom, !store.get(reviewChangesPanelVisibleAtom));
});

// ── View — Symbol Panel ──
registerMenuAction(ACTION_IDS.VIEW_SYMBOL_PANEL, async (store) => {
  const { symbolPanelVisibleAtom } = await import("../../../shared/lib/atoms/uiAtoms");
  store.set(symbolPanelVisibleAtom, !store.get(symbolPanelVisibleAtom));
});

// ── View — Focus Mode ──
registerMenuAction(ACTION_IDS.VIEW_FOCUS_MODE, async (store) => {
  const { toggleFocusModeAtom } = await import("../../shell/model/shellAtoms");
  store.set(toggleFocusModeAtom);
});

// ── View — Zoom (Tauri handles natively with zoomHotkeysEnabled) ──
registerMenuActions(
  [ACTION_IDS.VIEW_ZOOM_IN, ACTION_IDS.VIEW_ZOOM_OUT, ACTION_IDS.VIEW_ZOOM_RESET],
  () => {
    // No-op: Tauri handles zoom natively
  },
);
