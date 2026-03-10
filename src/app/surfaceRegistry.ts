import type { ComponentType, LazyExoticComponent } from "react";

import type { SurfaceId } from "../shared/protocol/types/ui";
import type { PersistenceScope } from "./shell/model/viewRegistry";

// ─── Surface Registry (RFC-016 §4.2) ──────────────────────────
//
// Empty Map + registerSurface() API.
// Each surface self-registers at module scope in its index.ts.
// SurfaceRouter and TitleBar query surfaces via getAllSurfaces().

export interface SurfaceDefinition {
  readonly id: SurfaceId;
  readonly label: string;
  readonly icon: string;
  readonly component: LazyExoticComponent<ComponentType>;
  readonly priority?: number;
  readonly persistence?: PersistenceScope;
}

// ─── Registry Store ──────────────────────────────────────────

const surfaces = new Map<SurfaceId, SurfaceDefinition>();

export function registerSurface(def: SurfaceDefinition): void {
  if (surfaces.has(def.id)) {
    throw new Error(`[SurfaceRegistry] Surface "${def.id}" already registered`);
  }
  surfaces.set(def.id, def);
}

export function getSurface(id: SurfaceId): SurfaceDefinition | undefined {
  return surfaces.get(id);
}

export function getAllSurfaces(): readonly SurfaceDefinition[] {
  return [...surfaces.values()].sort(
    (a, b) => (a.priority ?? 999) - (b.priority ?? 999),
  );
}
