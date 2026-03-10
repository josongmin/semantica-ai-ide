/**
 * Feature-sheet registry — self-registration pattern for side-panel sheets.
 *
 * Each widget calls `registerFeatureSheet()` at module scope.
 * FeatureSheetHost iterates `getAllFeatureSheets()` without knowing
 * which sheets exist (OCP).
 *
 * Consistent API:
 *   registerFeatureSheet(def)   — register a sheet definition
 *   getFeatureSheet(id)         — look up a single sheet by id
 *   getAllFeatureSheets()       — all sheets sorted by priority (desc)
 */
import type React from "react";

import type { FeatureSheetId } from "~shared/lib";

export interface SheetDef {
  id: NonNullable<FeatureSheetId>;
  title: string;
  icon: string;
  render: () => React.ReactNode;
  /** Higher priority renders first. Default 0. */
  priority?: number;
}

const sheets: SheetDef[] = [];
let sorted = true;

/** Register a feature sheet. Called at module scope by each widget. */
export function registerFeatureSheet(def: SheetDef): void {
  sheets.push(def);
  sorted = false;
}

/** Get a single sheet by id. */
export function getFeatureSheet(id: NonNullable<FeatureSheetId>): SheetDef | undefined {
  return sheets.find((s) => s.id === id);
}

/** Get all registered sheets sorted by descending priority. */
export function getAllFeatureSheets(): readonly SheetDef[] {
  if (!sorted) {
    sheets.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    sorted = true;
  }
  return sheets;
}

/**
 * @deprecated Use `getAllFeatureSheets()` instead.
 */
export function getFeatureSheets(): readonly SheetDef[] {
  return getAllFeatureSheets();
}
