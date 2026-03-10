/**
 * Browser Automation atoms for visualizing browser actions.
 *
 * Manages action timeline, screenshots, and console output
 * for browser automation tasks.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { BrowserAction } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** All browser actions in the current session */
export const browserActionsAtom = atom<readonly BrowserAction[]>([]);

/** Write-only: set browser actions from a serverEvent payload */
export const setBrowserActionsAtom = atom(null, (get, set, actions: readonly BrowserAction[]) => {
  const existing = get(browserActionsAtom);
  const existingIds = new Set(existing.map((a) => a.id));
  const newActions = actions.filter((a) => !existingIds.has(a.id));
  const updatedActions = existing.map((a) => {
    const update = actions.find((u) => u.id === a.id);
    return update ?? a;
  });
  set(browserActionsAtom, [...updatedActions, ...newActions]);
});

// ─── Derived Atoms ───────────────────────────────────────────

/** Derived: the latest screenshot from the action list */
export const latestScreenshotAtom = atom((get) => {
  const actions = get(browserActionsAtom);
  for (let i = actions.length - 1; i >= 0; i--) {
    const action = actions[i];
    if (action?.screenshot_url) {
      return action.screenshot_url;
    }
  }
  return undefined;
});

/** Derived: actions sorted by timestamp */
export const sortedBrowserActionsAtom = atom((get) => {
  const actions = get(browserActionsAtom);
  return [...actions].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
});

/** Write-only: reset all browser actions */
export const resetBrowserAutomationStoreAtom = atom(null, (_get, set) => {
  set(browserActionsAtom, []);
});

registerResetAtom(resetBrowserAutomationStoreAtom);
