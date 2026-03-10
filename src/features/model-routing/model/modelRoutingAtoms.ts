/**
 * Model Routing atoms.
 *
 * Tracks which model handles which task type, providing a history of routing
 * decisions that the UI can display in compact or expanded form.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ModelRoute } from "../../../shared/protocol";

/** Maximum number of routing history entries to retain */
const MAX_ROUTES = 50;

// ─── Core Store ──────────────────────────────────────────────

/** All model routing decisions, newest first */
export const modelRoutesAtom = atom<readonly ModelRoute[]>([]);

/** Write-only: merge incoming routes (dedupes by timestamp) */
export const setModelRoutesAtom = atom(null, (get, set, routes: readonly ModelRoute[]) => {
  const existing = get(modelRoutesAtom);
  const existingTimestamps = new Set(existing.map((r) => r.timestamp_ms));
  const newRoutes = routes.filter((r) => !existingTimestamps.has(r.timestamp_ms));
  const merged = [...newRoutes, ...existing]
    .sort((a, b) => b.timestamp_ms - a.timestamp_ms)
    .slice(0, MAX_ROUTES);
  set(modelRoutesAtom, merged);
});

/** Derived: the most recent routing decision */
export const latestRouteAtom = atom<ModelRoute | null>((get) => {
  const routes = get(modelRoutesAtom);
  return routes.length > 0 ? (routes[0] ?? null) : null;
});

/** Write-only: reset model routing state */
export const resetModelRoutesAtom = atom(null, (_get, set) => {
  set(modelRoutesAtom, []);
});

registerResetAtom(resetModelRoutesAtom);
