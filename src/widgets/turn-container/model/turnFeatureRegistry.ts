/**
 * Turn-feature registry — self-registration for per-turn feature widgets.
 *
 * Each feature calls `registerTurnFeature()` at module scope.
 * TurnContainer iterates `getAllTurnFeatures()` or filters by slot
 * via `getTurnFeaturesBySlot()` without knowing which features exist (OCP).
 *
 * Consistent API:
 *   registerTurnFeature(def)          — register a turn feature
 *   getTurnFeature(id)                — look up a single feature by id
 *   getAllTurnFeatures()              — all features sorted by priority (desc)
 *   getTurnFeaturesBySlot(slot)       — features for a specific slot, sorted
 */
import type React from "react";

import type { TurnId } from "../../../shared/protocol";

export interface TurnFeatureDef {
  id: string;
  /** Render phase: "pre-phases" renders before phase sections, "post-phases" after */
  slot: "pre-phases" | "post-phases";
  render: (turnId: TurnId) => React.ReactNode;
  /** Higher priority renders first within the slot. Default 0. */
  priority?: number;
}

const features: TurnFeatureDef[] = [];
let sorted = true;

export function registerTurnFeature(def: TurnFeatureDef): void {
  features.push(def);
  sorted = false;
}

/** Get a single turn feature by id. */
export function getTurnFeature(id: string): TurnFeatureDef | undefined {
  return features.find((f) => f.id === id);
}

function ensureSorted(): void {
  if (!sorted) {
    features.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    sorted = true;
  }
}

/** Get all registered turn features sorted by descending priority. */
export function getAllTurnFeatures(): readonly TurnFeatureDef[] {
  ensureSorted();
  return features;
}

/** Get turn features for a specific slot, sorted by descending priority. */
export function getTurnFeaturesBySlot(slot: TurnFeatureDef["slot"]): readonly TurnFeatureDef[] {
  ensureSorted();
  return features.filter((f) => f.slot === slot);
}

/**
 * @deprecated Use `getTurnFeaturesBySlot(slot)` instead.
 */
export function getTurnFeatures(slot: TurnFeatureDef["slot"]): readonly TurnFeatureDef[] {
  return getTurnFeaturesBySlot(slot);
}
